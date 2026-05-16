import { useEffect } from 'react';
import { io } from 'socket.io-client';
import { useOverlayStore } from '../store/useOverlayStore.js';

const socket = io('http://127.0.0.1:4000', {
  autoConnect: true,
  reconnectionAttempts: 10,
  transports: ['websocket'],
  timeout: 10000
});

export function useSocketClient({ addNotification }) {
  const activeContext = useOverlayStore((state) => state.activeContext);
  const updateContext = useOverlayStore((state) => state.updateContext);

  useEffect(() => {
    socket.on('connect', () => {
      addNotification({ title: 'Connected', severity: 'Low', message: 'Real-time assistant is online.' });
      socket.emit('LOCAL_CONTEXT', activeContext);
    });

    socket.on('MERGE_RISK', (payload) => {
      updateContext({ riskScore: payload.risk || 24 });
      addNotification({ title: 'Merge risk update', severity: 'High', message: payload.summary || 'Merge conflict risk increased.' });
    });

    socket.on('API_CHANGED', (payload) => {
      addNotification({ title: 'API contract changed', severity: 'High', message: payload.detail || 'Backend schema changed in active module.' });
    });

    socket.on('ARCHITECTURE_ALERT', (payload) => {
      addNotification({ title: 'Architecture insight', severity: 'Medium', message: payload.suggestion || 'Consider simplifying your module boundaries.' });
    });

    socket.on('DEPENDENCY_WARNING', (payload) => {
      addNotification({ title: 'Dependency warning', severity: 'Medium', message: payload.message || 'A package version mismatch was detected.' });
    });

    socket.on('TEAM_OVERLAP', (payload) => {
      addNotification({ title: 'Team overlap detected', severity: 'High', message: payload.detail || 'Someone is editing the same module.' });
    });

    socket.on('disconnect', () => {
      addNotification({ title: 'Disconnected', severity: 'Low', message: 'Realtime sync interrupted. Reconnecting...' });
    });

    return () => {
      socket.off('connect');
      socket.off('MERGE_RISK');
      socket.off('API_CHANGED');
      socket.off('ARCHITECTURE_ALERT');
      socket.off('DEPENDENCY_WARNING');
      socket.off('TEAM_OVERLAP');
      socket.off('disconnect');
    };
  }, [activeContext, addNotification, updateContext]);

  useEffect(() => {
    if (socket.connected) {
      socket.emit('ACTIVE_MODULE', { activeFile: activeContext.activeFile, branch: activeContext.currentBranch });
    }
  }, [activeContext.activeFile, activeContext.currentBranch]);

  return socket;
}
