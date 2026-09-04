import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// When the API process is down/restarting, the default proxy behaviour is an
// opaque HTML 500 — which the client renders as the generic "The server hit an
// error." Respond with a JSON 502 carrying a real message instead, so failures
// are diagnosable from the UI itself.
function apiProxy(target: string) {
  return {
    target,
    changeOrigin: true,
    configure: (proxy: { on: (event: string, cb: (...args: unknown[]) => void) => void }) => {
      proxy.on('error', (err: unknown, _req: unknown, res: unknown) => {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[vite proxy] ${target} unreachable: ${message}`);
        const writable = res as { headersSent?: boolean; writeHead?: Function; end?: Function } | null;
        if (writable && typeof writable.writeHead === 'function' && !writable.headersSent) {
          writable.writeHead(502, { 'Content-Type': 'application/json' });
          writable.end(JSON.stringify({ success: false, error: `Cannot reach the API server at ${target}. Is the backend running?` }));
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': apiProxy('http://localhost:3001'),
      '/uploads': apiProxy('http://localhost:3001'),
    },
  },
});
