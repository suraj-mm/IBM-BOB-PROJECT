/**
 * Gateway Client for Backend Intelligence Engine
 * 
 * Connects the backend engine to the unified WebSocket gateway
 */

import { io, Socket } from 'socket.io-client';
import { IntelligenceEvent, createEvent } from '../../shared/types';
import { logger } from '../utils/logger';

export class GatewayClient {
  private socket: Socket | null = null;
  private gatewayUrl: string;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 10;
  private eventHandlers: Map<string, Function[]> = new Map();
  private isConnected: boolean = false;

  constructor(gatewayUrl: string = 'http://localhost:4000') {
    this.gatewayUrl = gatewayUrl;
  }

  /**
   * Connect to the gateway
   */
  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.socket = io(this.gatewayUrl, {
          autoConnect: true,
          reconnectionAttempts: this.maxReconnectAttempts,
          transports: ['websocket', 'polling'],
          timeout: 10000,
        });

        this.socket.on('connect', () => {
          logger.info('✅ Connected to unified gateway');
          this.isConnected = true;
          this.reconnectAttempts = 0;

          // Identify as backend engine
          this.socket!.emit('identify', {
            subsystem: 'backend-engine',
            metadata: {
              version: '1.0.0',
              capabilities: [
                'ast-parsing',
                'dependency-analysis',
                'impact-analysis',
                'change-detection',
              ],
            },
          });

          resolve();
        });

        this.socket.on('disconnect', () => {
          logger.warn('⚠️ Disconnected from gateway');
          this.isConnected = false;
        });

        this.socket.on('reconnect', (attemptNumber: number) => {
          logger.info(`🔄 Reconnected to gateway (attempt ${attemptNumber})`);
          this.isConnected = true;
          this.reconnectAttempts = 0;
        });

        this.socket.on('reconnect_attempt', (attemptNumber: number) => {
          this.reconnectAttempts = attemptNumber;
          logger.info(`🔄 Reconnection attempt ${attemptNumber}/${this.maxReconnectAttempts}`);
        });

        this.socket.on('reconnect_failed', () => {
          logger.error('❌ Failed to reconnect to gateway');
          this.isConnected = false;
          reject(new Error('Failed to connect to gateway'));
        });

        this.socket.on('connect_error', (error: Error) => {
          logger.error('Connection error', error);
        });

        // Listen for incoming events
        this.socket.on('event', (event: IntelligenceEvent) => {
          this.handleIncomingEvent(event);
        });

        // Listen for specific event types (backward compatibility)
        this.socket.on('file_changed', (payload: any) => {
          this.handleLegacyEvent('file_changed', payload);
        });

        this.socket.on('editor_context', (payload: any) => {
          this.handleLegacyEvent('editor_context', payload);
        });

        this.socket.on('branch_changed', (payload: any) => {
          this.handleLegacyEvent('branch_changed', payload);
        });
      } catch (error) {
        logger.error('Failed to connect to gateway', error);
        reject(error);
      }
    });
  }

  /**
   * Disconnect from the gateway
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      logger.info('Disconnected from gateway');
    }
  }

  /**
   * Send an event to the gateway
   */
  sendEvent(event: IntelligenceEvent): void {
    if (!this.socket || !this.isConnected) {
      logger.warn('Cannot send event: not connected to gateway');
      return;
    }

    this.socket.emit('event', event);
    logger.info(`📤 Sent event: ${event.eventType}`);
  }

  /**
   * Handle incoming event from gateway
   */
  private handleIncomingEvent(event: IntelligenceEvent): void {
    logger.info(`📥 Received event: ${event.eventType}`);

    // Call registered handlers
    const handlers = this.eventHandlers.get(event.eventType);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(event);
        } catch (error) {
          logger.error(`Error in event handler for ${event.eventType}`, error);
        }
      });
    }

    // Call wildcard handlers
    const wildcardHandlers = this.eventHandlers.get('*');
    if (wildcardHandlers) {
      wildcardHandlers.forEach(handler => {
        try {
          handler(event);
        } catch (error) {
          logger.error('Error in wildcard event handler', error);
        }
      });
    }
  }

  /**
   * Handle legacy event format
   */
  private handleLegacyEvent(eventType: string, payload: any): void {
    const event = createEvent(
      eventType as any,
      {
        subsystem: 'vscode-extension',
      },
      payload
    );
    this.handleIncomingEvent(event);
  }

  /**
   * Register event handler
   */
  on(eventType: string, handler: (event: IntelligenceEvent) => void): void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, []);
    }
    this.eventHandlers.get(eventType)!.push(handler);
  }

  /**
   * Remove event handler
   */
  off(eventType: string, handler: Function): void {
    const handlers = this.eventHandlers.get(eventType);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  /**
   * Check if connected
   */
  isConnectedToGateway(): boolean {
    return this.isConnected;
  }

  /**
   * Get connection status
   */
  getStatus(): ConnectionStatus {
    return {
      connected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      gatewayUrl: this.gatewayUrl,
    };
  }
}

interface ConnectionStatus {
  connected: boolean;
  reconnectAttempts: number;
  gatewayUrl: string;
}

// Made with Bob