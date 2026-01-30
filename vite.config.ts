import { defineConfig } from 'vite';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import netlify from '@netlify/vite-plugin-tanstack-start';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  server: {
    port: 5173,
    // Allow ngrok hosts for Clerk webhook development
    allowedHosts: true,
  },
  resolve: {
    alias: {
      '~': path.resolve(__dirname, './app'),
      '@': path.resolve(__dirname, '.'),
      // Più specifico prima: with-selector resta dal pacchetto reale (pre-bundled)
      'use-sync-external-store/shim/with-selector.js': path.resolve(
        __dirname,
        'node_modules/use-sync-external-store/shim/with-selector.js',
      ),
      // SWR e altri importano .../shim/index.js; React 19 ha useSyncExternalStore
      'use-sync-external-store/shim/index.js':
        path.resolve(__dirname, './app/lib/use-sync-external-store-shim.ts'),
      'use-sync-external-store/shim':
        path.resolve(__dirname, './app/lib/use-sync-external-store-shim.ts'),
    },
  },
  plugins: [
    tanstackStart({
      srcDirectory: './app',
    }),
    netlify(),
    // React plugin must come after TanStack Start plugin
    react(),
    tailwindcss(),
    svgr({
      svgrOptions: {
        icon: true,
      },
    }),
  ],
});
