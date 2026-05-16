import { io } from 'socket.io-client';
import { getLocalContextPayload } from '../../src/utils/contextPayload.js';

export function createSocketAgent({ cache, mainWindow }) {
  const socket = io('http://127.0.0.1:4000', {
    autoConnect: true,
    reconnectionAttempts: 10,
    transports: ['websocket'],
    timeout: 10000
  });

  const forwardEvent = (eventName, payload) => {
    if (mainWindow?.webContents) {
      mainWindow.webContents.send('agent:event', { type: eventName, payload });
    }
  };

  const flushQueue = () => {
    const queue = cache.get('retryQueue') || [];
    if (!queue.length || !socket.connected) {
      return;
    }
    queue.forEach(({ type, payload }) => socket.emit(type, payload));
    cache.set('retryQueue', []);
  };

  const heartbeat = setInterval(() => {
    if (socket.connected) {
      socket.emit('HEARTBEAT', { timestamp: Date.now() });
    }
  }, 12000);

  socket.on('connect', () => {
    cache.set('socketStatus', 'connected');
    socket.emit('LOCAL_CONTEXT', getLocalContextPayload(cache));
    flushQueue();
  });

  socket.on('reconnect', () => {
    cache.set('socketStatus', 'reconnected');
    flushQueue();
  });

  socket.on('disconnect', () => {
    cache.set('socketStatus', 'disconnected');
  });

  socket.on('connect_error', () => {
    cache.set('socketStatus', 'error');
  });

  ['API_CHANGED', 'MERGE_RISK', 'DEPENDENCY_WARNING', 'TEAM_OVERLAP', 'ARCHITECTURE_ALERT', 'HEARTBEAT_ACK'].forEach((eventName) => {
    socket.on(eventName, (payload) => {
      if (eventName === 'HEARTBEAT_ACK') {
        cache.set('lastHeartbeat', Date.now());
      }
      forwardEvent(eventName, payload);
    });
  });

  return {
    status: () => socket.connected,
    send: (type, payload) => {
      if (socket.connected) {
        socket.emit(type, payload);
      } else {
        const queue = cache.get('retryQueue') || [];
        cache.set('retryQueue', [...queue, { type, payload }]);
      }
    },
    destroy: () => {
      clearInterval(heartbeat);
      socket.close();
    }
  };
}
