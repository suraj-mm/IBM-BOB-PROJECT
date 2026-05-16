/**
 * Unified WebSocket Gateway
 * 
 * Central communication hub for all subsystems:
 * - VS Code Extension
 * - Backend Intelligence Engine
 * - AI Risk Engine
 * - Floating Overlay UI
 * 
 * Responsibilities:
 * - Route events between subsystems
 * - Transform event formats
 * - Handle reconnections
 * - Manage event queues
 * - Provide fault tolerance
 */

import { Server as SocketIOServer, Socket } from 'socket.io';
import { createServer, Server as HTTPServer } from 'http';
import { IntelligenceEvent, EventType, isValidEvent } from '../shared/types';
import { GatewayConfig, defaultGatewayConfig } from '../shared/config/gateway.config';
import { EventRouter } from './event-router';
import { EventQueue } from './event-queue';
import { logger } from './logger';

export class WebSocketGateway {
  private httpServer: HTTPServer;
  private io: SocketIOServer;
  private config: GatewayConfig;
  private eventRouter: EventRouter;
  private eventQueue: EventQueue;
  private clients: Map<string, ClientConnection>;
  private heartbeatIntervals: Map<string, NodeJS.Timeout>;

  constructor(config: Partial<GatewayConfig> = {}) {
    this.config = { ...defaultGatewayConfig, ...config };
    this.clients = new Map();
    this.heartbeatIntervals = new Map();
    
    // Create HTTP server
    this.httpServer = createServer();
    
    // Create Socket.IO server
    this.io = new SocketIOServer(this.httpServer, {
      cors: this.config.cors,
      transports: ['websocket', 'polling'],
      pingTimeout: this.config.heartbeat.timeout,
      pingInterval: this.config.heartbeat.interval,
    });

    // Initialize router and queue
    this.eventRouter = new EventRouter();
    this.eventQueue = new EventQueue(this.config.eventQueue);

    this.setupEventHandlers();
  }

  /**
   * Start the gateway server
   */
  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.httpServer.listen(this.config.port, this.config.host, () => {
          logger.info(`🚀 WebSocket Gateway running on ${this.config.host}:${this.config.port}`);
          resolve();
        });
      } catch (error) {
        logger.error('Failed to start gateway', error);
        reject(error);
      }
    });
  }

  /**
   * Stop the gateway server
   */
  async stop(): Promise<void> {
    logger.info('Shutting down WebSocket Gateway...');
    
    // Clear all heartbeat intervals
    this.heartbeatIntervals.forEach(interval => clearInterval(interval));
    this.heartbeatIntervals.clear();
    
    // Close all connections
    this.io.close();
    
    return new Promise((resolve) => {
      this.httpServer.close(() => {
        logger.info('WebSocket Gateway shut down');
        resolve();
      });
    });
  }

  /**
   * Setup event handlers for Socket.IO
   */
  private setupEventHandlers(): void {
    this.io.on('connection', (socket: Socket) => {
      logger.info(`Client connected: ${socket.id}`);
      
      // Register client
      this.registerClient(socket);
      
      // Handle subsystem identification
      socket.on('identify', (data: { subsystem: string; metadata?: any }) => {
        this.identifyClient(socket, data);
      });
      
      // Handle incoming events
      socket.on('event', (event: IntelligenceEvent) => {
        this.handleIncomingEvent(socket, event);
      });
      
      // Handle VS Code Extension events
      socket.on('file_changed', (payload) => {
        this.handleVSCodeEvent(socket, 'file_changed', payload);
      });
      
      socket.on('editor_context', (payload) => {
        this.handleVSCodeEvent(socket, 'editor_context', payload);
      });
      
      socket.on('branch_changed', (payload) => {
        this.handleVSCodeEvent(socket, 'branch_changed', payload);
      });
      
      // Handle Backend Engine events (legacy compatibility)
      socket.on('LOCAL_CONTEXT', (payload) => {
        this.handleLegacyEvent(socket, 'editor_context', payload);
      });
      
      socket.on('FILE_UPDATED', (payload) => {
        this.handleLegacyEvent(socket, 'file_changed', payload);
      });
      
      socket.on('CURRENT_BRANCH', (payload) => {
        this.handleLegacyEvent(socket, 'branch_changed', payload);
      });
      
      // Handle heartbeat
      socket.on('heartbeat', (payload) => {
        socket.emit('heartbeat_ack', {
          timestamp: Date.now(),
          received: payload?.timestamp,
        });
      });
      
      // Handle disconnection
      socket.on('disconnect', () => {
        this.unregisterClient(socket);
      });
      
      // Handle errors
      socket.on('error', (error) => {
        logger.error(`Socket error for ${socket.id}`, error);
      });
      
      // Start heartbeat
      this.startHeartbeat(socket);
      
      // Send queued events for this client
      this.flushQueuedEvents(socket);
    });
  }

  /**
   * Register a new client connection
   */
  private registerClient(socket: Socket): void {
    const client: ClientConnection = {
      id: socket.id,
      socket,
      subsystem: 'unknown',
      connectedAt: new Date(),
      lastHeartbeat: new Date(),
      metadata: {},
    };
    
    this.clients.set(socket.id, client);
    
    // Emit connection event
    this.broadcastSystemEvent('connection_established', {
      clientId: socket.id,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Identify client subsystem
   */
  private identifyClient(socket: Socket, data: { subsystem: string; metadata?: any }): void {
    const client = this.clients.get(socket.id);
    if (client) {
      client.subsystem = data.subsystem;
      client.metadata = data.metadata || {};
      logger.info(`Client ${socket.id} identified as ${data.subsystem}`);
    }
  }

  /**
   * Unregister a client connection
   */
  private unregisterClient(socket: Socket): void {
    logger.info(`Client disconnected: ${socket.id}`);
    
    // Clear heartbeat
    const interval = this.heartbeatIntervals.get(socket.id);
    if (interval) {
      clearInterval(interval);
      this.heartbeatIntervals.delete(socket.id);
    }
    
    // Remove client
    this.clients.delete(socket.id);
    
    // Emit disconnection event
    this.broadcastSystemEvent('connection_lost', {
      clientId: socket.id,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Handle incoming intelligence event
   */
  private handleIncomingEvent(socket: Socket, event: IntelligenceEvent): void {
    // Validate event
    if (!isValidEvent(event)) {
      logger.warn(`Invalid event received from ${socket.id}`, event);
      return;
    }
    
    logger.info(`Event received: ${event.eventType} from ${socket.id}`);
    
    // Route event to appropriate handlers
    const targets = this.eventRouter.route(event);
    
    // Broadcast to target clients
    this.broadcastEvent(event, targets);
  }

  /**
   * Handle VS Code extension events
   */
  private handleVSCodeEvent(socket: Socket, eventType: EventType, payload: any): void {
    const event: IntelligenceEvent = {
      eventId: this.generateEventId(),
      eventType,
      timestamp: new Date().toISOString(),
      severity: 'low',
      source: {
        subsystem: 'vscode-extension',
      },
      payload,
    };
    
    this.handleIncomingEvent(socket, event);
  }

  /**
   * Handle legacy event formats for backward compatibility
   */
  private handleLegacyEvent(socket: Socket, eventType: EventType, payload: any): void {
    logger.info(`Legacy event received: ${eventType} from ${socket.id}`);
    this.handleVSCodeEvent(socket, eventType, payload);
  }

  /**
   * Broadcast event to target clients
   */
  private broadcastEvent(event: IntelligenceEvent, targets: string[] = []): void {
    if (targets.length === 0) {
      // Broadcast to all clients except sender
      this.io.emit('event', event);
      
      // Also emit specific event type for backward compatibility
      this.io.emit(event.eventType, event.payload);
    } else {
      // Send to specific targets
      targets.forEach(targetSubsystem => {
        this.clients.forEach(client => {
          if (client.subsystem === targetSubsystem) {
            client.socket.emit('event', event);
            client.socket.emit(event.eventType, event.payload);
          }
        });
      });
    }
  }

  /**
   * Broadcast system event
   */
  private broadcastSystemEvent(eventType: EventType, payload: any): void {
    const event: IntelligenceEvent = {
      eventId: this.generateEventId(),
      eventType,
      timestamp: new Date().toISOString(),
      severity: 'low',
      source: {
        subsystem: 'system',
      },
      payload,
    };
    
    this.io.emit('event', event);
  }

  /**
   * Start heartbeat for a client
   */
  private startHeartbeat(socket: Socket): void {
    const interval = setInterval(() => {
      const client = this.clients.get(socket.id);
      if (client) {
        const now = new Date();
        const timeSinceLastHeartbeat = now.getTime() - client.lastHeartbeat.getTime();
        
        if (timeSinceLastHeartbeat > this.config.heartbeat.timeout) {
          logger.warn(`Client ${socket.id} heartbeat timeout`);
          socket.disconnect();
        }
      }
    }, this.config.heartbeat.interval);
    
    this.heartbeatIntervals.set(socket.id, interval);
  }

  /**
   * Flush queued events for a client
   */
  private flushQueuedEvents(socket: Socket): void {
    const client = this.clients.get(socket.id);
    if (!client) return;
    
    const queuedEvents = this.eventQueue.getEventsForSubsystem(client.subsystem);
    queuedEvents.forEach(event => {
      socket.emit('event', event);
      socket.emit(event.eventType, event.payload);
    });
    
    this.eventQueue.clearEventsForSubsystem(client.subsystem);
  }

  /**
   * Queue event for offline client
   */
  public queueEvent(event: IntelligenceEvent, targetSubsystem: string): void {
    this.eventQueue.enqueue(event, targetSubsystem);
  }

  /**
   * Generate unique event ID
   */
  private generateEventId(): string {
    return `evt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get connected clients
   */
  public getConnectedClients(): ClientConnection[] {
    return Array.from(this.clients.values());
  }

  /**
   * Get client by subsystem
   */
  public getClientsBySubsystem(subsystem: string): ClientConnection[] {
    return Array.from(this.clients.values()).filter(
      client => client.subsystem === subsystem
    );
  }
}

// ============================================
// Supporting Types
// ============================================

interface ClientConnection {
  id: string;
  socket: Socket;
  subsystem: string;
  connectedAt: Date;
  lastHeartbeat: Date;
  metadata: Record<string, any>;
}

// Made with Bob