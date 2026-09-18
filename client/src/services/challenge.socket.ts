import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;
let reconnecting = false;

function baseUrl(): string {
  const apiBase = import.meta.env.VITE_API_URL || '/api';
  return apiBase.replace(/\/api\/?$/, '').replace(/\/api$/,'') || window.location.origin;
}

export function connectChallengeSocket(token: string): Socket {
  if (socket?.connected) return socket;
  socket = io(baseUrl(), {
    auth: { token },
    transports: ['websocket', 'polling'],
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 15,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  });
  return socket;
}

export function getSocket(): Socket | null {
  return socket;
}

export function emit(event: string, data?: unknown, ack?: (response: unknown) => void): void {
  if (socket?.connected) socket.emit(event, data, ack);
}

export function on(event: string, handler: (...args: any[]) => void): void {
  if (socket) socket.on(event, handler);
}

export function off(event: string, handler?: (...args: any[]) => void): void {
  if (socket && handler) socket.off(event, handler);
  else if (socket) socket.removeAllListeners(event);
}

export function disconnectChallengeSocket(): void {
  if (!socket) return;
  socket.removeAllListeners();
  socket.disconnect();
  socket = null;
}

export function ensureSocketJoined(
  code: string,
  cb?: (ok: boolean, error?: string) => void
): void {
  if (!socket?.connected) {
    cb?.(false, 'Socket not connected');
    return;
  }
  emit('challenge:join', { code }, (response: { ok?: boolean; error?: string } | unknown) => {
    const res = response as { ok?: boolean; error?: string };
    cb?.(res?.ok ?? false, res?.error);
  });
}