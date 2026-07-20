import { io } from 'socket.io-client';
import { getToken } from './api';

let socket = null;

export function getSocket() {
  if (!socket || socket.disconnected) {
    socket = io(import.meta.env.VITE_API_URL || '/', {
      auth: { token: getToken() },
    });
  }
  return socket;
}

export function closeSocket() {
  socket?.close();
  socket = null;
}
