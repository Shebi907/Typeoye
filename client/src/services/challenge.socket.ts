import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;
let socketToken: string | null = null;

function baseUrl(): string {
  const apiBase = import.meta.env.VITE_API_URL || '/api';
  return apiBase.replace(/\/api\/?$/, '').replace(/\/api$/,'') || window.location.origin;
}

export function connectChallengeSocket(token: string): Socket {
  // Idempotent per token: a socket that is still completing its handshake must
  // be REUSED, never replaced. The page calls this twice per mount (once before
  // the listeners are registered and once for the post-connect sync), and React
  // re-runs the effect on strict-mode/token changes. The old `if connected`
  // guard only short-circuited an ALREADY-connected socket, so a slow handshake
  // spawned a second socket and orphaned the first - along with every listener
  // registered on it. The room then contained a socket with no
  // `challenge:opponentProgress` listener, so the opponent's live progress
  // silently never arrived (intermittently, depending on handshake timing).
  if (socket && (socketToken === token || !token)) return socket;
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
  socketToken = token;
  socket = io(baseUrl(), {
    auth: { token },
    transports: ['websocket', 'polling'],
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 15,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  });
  if (import.meta.env.DEV) {
    (window as any).__challengeSocket = socket;
  }
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
  socketToken = null;
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