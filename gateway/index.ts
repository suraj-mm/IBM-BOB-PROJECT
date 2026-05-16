/**
 * Gateway Entry Point
 * 
 * Starts the unified WebSocket gateway server
 */

import { WebSocketGateway } from './websocket-gateway';
import { logger } from './logger';

const PORT = parseInt(process.env.GATEWAY_PORT || '4000');
const HOST = process.env.GATEWAY_HOST || '0.0.0.0';

async function startGateway() {
  try {
    const gateway = new WebSocketGateway({
      port: PORT,
      host: HOST,
    });

    await gateway.start();

    logger.info('🎯 Unified WebSocket Gateway is ready');
    logger.info(`📡 Listening on ws://${HOST}:${PORT}`);
    logger.info('🔗 Subsystems can now connect:');
    logger.info('   - VS Code Extension');
    logger.info('   - Backend Intelligence Engine');
    logger.info('   - AI Risk Engine');
    logger.info('   - Floating Overlay UI');

    // Graceful shutdown
    const shutdown = async () => {
      logger.info('Shutting down gateway...');
      await gateway.stop();
      process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (error) {
    logger.error('Failed to start gateway', error);
    process.exit(1);
  }
}

// Start the gateway
startGateway();

// Made with Bob