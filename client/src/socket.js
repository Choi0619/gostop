import { io } from 'socket.io-client';
import { getToken } from './api';

let socket = null;

export function getSocket() {
  // 소켓이 없을 때만 생성. 일시 끊김은 socket.io가 자동 재접속하므로 재생성하지 않음
  // (재생성하면 등록된 이벤트 리스너가 모두 사라져 버림)
  if (!socket) {
    socket = io(import.meta.env.VITE_API_URL || '/', {
      auth: { token: getToken() },
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 500,
      reconnectionDelayMax: 3000,
    });
  }
  return socket;
}

export function closeSocket() {
  socket?.close();
  socket = null;
}
