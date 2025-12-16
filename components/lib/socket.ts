// src/components/lib/socket.ts
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000', {
  transports: ['websocket', 'polling'],
  forceNew: true,
  reconnection: true,
  reconnectionAttempts: Infinity,
  timeout: 20000,
});

export default socket;
