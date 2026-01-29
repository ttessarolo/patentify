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
  resolve: {
    alias: {
      '~': path.resolve(__dirname, './app'),
      '@': path.resolve(__dirname, '.'),
    },
  },
});
