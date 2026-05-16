import http from 'http';
import { Server } from 'socket.io';

const server = http.createServer();
const io = new Server(server, { cors: { origin: '*' } });

const notifications = [
  { type: 'MERGE_RISK', payload: { risk: 58, summary: 'Overlapping work detected in core state and API modules.' } },
  { type: 'API_CHANGED', payload: { detail: 'Backend contract changed for /api/users endpoint.' } },
  { type: 'DEPENDENCY_WARNING', payload: { message: 'Outdated package version detected for tailwindcss.' } },
  { type: 'TEAM_OVERLAP', payload: { detail: 'Two teammates are editing the same reducer module.' } },
  { type: 'ARCHITECTURE_ALERT', payload: { suggestion: 'Split platform logic into isolated service layers.' } }
];

io.on('connection', (socket) => {
  console.log('Client connected');

  socket.on('LOCAL_CONTEXT', (context) => {
    console.log('LOCAL_CONTEXT', context);
  });

  socket.on('CURRENT_BRANCH', (payload) => {
    console.log('CURRENT_BRANCH', payload);
  });

  socket.on('ACTIVE_MODULE', (payload) => {
    console.log('ACTIVE_MODULE', payload);
  });

  socket.on('FILE_UPDATED', (payload) => {
    console.log('FILE_UPDATED', payload);
  });

  socket.on('HEARTBEAT', (payload) => {
    socket.emit('HEARTBEAT_ACK', { timestamp: Date.now(), received: payload.timestamp });
  });

  let index = 0;
  const eventInterval = setInterval(() => {
    const event = notifications[index % notifications.length];
    socket.emit(event.type, event.payload);
    index += 1;
  }, 16000);

  socket.on('disconnect', () => {
    clearInterval(eventInterval);
    console.log('Client disconnected');
  });
});

server.listen(4000, () => {
  console.log('Backend socket server running on http://localhost:4000');
});
