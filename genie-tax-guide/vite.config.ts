import { defineConfig, ServerOptions } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import * as http from 'http';
import { ServerResponse } from 'node:http';
import { HttpProxy } from 'http-proxy';

// Define server options separately for clarity
const serverOptions: ServerOptions = {
  host: "::",
  port: 8080, // Keep or change as desired
  proxy: {
    // Proxy requests starting with /api to the backend server
    '/api': {
      target: 'http://localhost:3001',
      changeOrigin: true, // Necessary for virtual hosted sites
      secure: false,      // Often required for localhost proxying (HTTP target)
      // Optional: Add logging to see if the proxy is being matched and used
      configure: (proxy: HttpProxy.Server, _options) => {
        proxy.on('error', (err: Error, _req: http.IncomingMessage, _res: http.ServerResponse) => {
          console.log('[VITE PROXY] error:', err);
        });
        proxy.on('proxyReq', (proxyReq: http.ClientRequest, req: http.IncomingMessage, _res: http.ServerResponse) => {
          console.log('[VITE PROXY] Sending Request to target:', req.method, req.url);
        });
        proxy.on('proxyRes', (proxyRes: http.IncomingMessage, req: http.IncomingMessage, _res: http.ServerResponse) => {
          console.log('[VITE PROXY] Received Response from target:', proxyRes.statusCode, req.url);
        });
      },
    }
  }
};

// https://vitejs.dev/config/
export default defineConfig(({ mode }): import('vite').UserConfig => ({
  server: serverOptions, // Use the defined server options
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
