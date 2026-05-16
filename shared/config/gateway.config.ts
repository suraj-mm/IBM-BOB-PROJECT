/**
 * Gateway Configuration
 * 
 * Central configuration for the unified WebSocket gateway
 */

export interface GatewayConfig {
  port: number;
  host: string;
  cors: {
    origin: string | string[];
    credentials: boolean;
  };
  reconnection: {
    maxAttempts: number;
    delay: number;
    backoffMultiplier: number;
  };
  heartbeat: {
    interval: number;
    timeout: number;
  };
  eventQueue: {
    maxSize: number;
    retryAttempts: number;
  };
}

export const defaultGatewayConfig: GatewayConfig = {
  port: 4000,
  host: '0.0.0.0',
  cors: {
    origin: '*',
    credentials: true,
  },
  reconnection: {
    maxAttempts: 10,
    delay: 1000,
    backoffMultiplier: 1.5,
  },
  heartbeat: {
    interval: 12000,
    timeout: 30000,
  },
  eventQueue: {
    maxSize: 1000,
    retryAttempts: 3,
  },
};

// Made with Bob