/**
 * Backend Intelligence Engine - Main Entry Point
 * 
 * Starts the Fastify server and initializes the Intelligence Engine
 */

import Fastify from 'fastify';
import websocket from '@fastify/websocket';
import dotenv from 'dotenv';
import { IntelligenceEngine } from './engine/intelligence-engine';
import { registerAnalysisRoutes } from './routes/analysis-routes';
import { EngineConfig } from './types';
import { logger } from './utils/logger';

// Load environment variables
dotenv.config();

// Configuration
const config: EngineConfig = {
  repoPath: process.env.REPO_PATH || process.cwd(),
  neo4jUri: process.env.NEO4J_URI || 'bolt://localhost:7687',
  neo4jUser: process.env.NEO4J_USER || 'neo4j',
  neo4jPassword: process.env.NEO4J_PASSWORD || 'password',
  postgresConfig: {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432'),
    database: process.env.POSTGRES_DB || 'backend_intelligence',
    user: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || 'password',
  },
};

const PORT = parseInt(process.env.PORT || '3000');

/**
 * Start the server
 */
async function start() {
  try {
    // Create Fastify instance
    const fastify = Fastify({
      logger: false, // We use our custom logger
    });

    // Register WebSocket support
    await fastify.register(websocket);

    // Initialize Intelligence Engine
    logger.info('Initializing Intelligence Engine...');
    const engine = new IntelligenceEngine(config);
    await engine.initialize();

    // Register routes
    await registerAnalysisRoutes(fastify, engine);

    // WebSocket endpoint for real-time events
    fastify.register(async function (fastify) {
      fastify.get('/ws/events', { websocket: true }, (connection, req) => {
        logger.info('WebSocket client connected');

        // Register event listener
        const eventListener = (event: any) => {
          connection.socket.send(JSON.stringify(event));
        };

        // Listen to all event types
        engine.onEvent('breaking-api-change', eventListener);
        engine.onEvent('dependency-risk', eventListener);
        engine.onEvent('affected-modules', eventListener);
        engine.onEvent('contract-violation', eventListener);

        connection.socket.on('close', () => {
          logger.info('WebSocket client disconnected');
        });

        connection.socket.on('error', (error) => {
          logger.error('WebSocket error', error);
        });
      });
    });

    // Start server
    await fastify.listen({ port: PORT, host: '0.0.0.0' });

    logger.info(`🚀 Backend Intelligence Engine running on port ${PORT}`);
    logger.info(`📊 Health check: http://localhost:${PORT}/api/health`);
    logger.info(`🔌 WebSocket events: ws://localhost:${PORT}/ws/events`);

    // Graceful shutdown
    const shutdown = async () => {
      logger.info('Shutting down gracefully...');
      await engine.shutdown();
      await fastify.close();
      process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (error) {
    logger.error('Failed to start server', error);
    process.exit(1);
  }
}

// Start the server
start();

// Made with Bob
