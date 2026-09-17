import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { SEO_META } from './src/data/seoMeta';

// Injects the per-route title/description map into the inline SEO script in
// index.html (replaces the /*__SEO_META__*/null marker with the serialized
// JSON) so crawlers that snapshot before the bundle boots see the correct
// metadata. Generated from the same blog data source the app uses, so new
// posts get covered automatically. Mirrors index.html's fallback via the
// static <title>/description tags for any route missing from the map.
function seoMetaPlugin(): Plugin {
  const payload = JSON.stringify(SEO_META).replace(/</g, '\\u003c');
  return {
    name: 'typing-seo-meta',
    transformIndexHtml(html) {
      return html.split('/*__SEO_META__*/null').join(`/*__SEO_META__*/${payload}`);
    },
  };
}

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
  plugins: [react(), seoMetaPlugin()],
  server: {
    port: 5173,
    proxy: {
      '/api': apiProxy('http://localhost:3001'),
      '/uploads': apiProxy('http://localhost:3001'),
      '/socket.io': { target: 'http://localhost:3001', changeOrigin: true, ws: true },
    },
  },
});
