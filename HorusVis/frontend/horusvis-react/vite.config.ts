import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'url';

const BACKEND_URL = process.env.VITE_BACKEND_URL ?? 'http://localhost:5049';

export default defineConfig({
  plugins: [react()],
  define: {
    'process.env': {},
  },
  resolve: {
    alias: {
      '@horusvis-web': fileURLToPath(new URL('../shared/HorusVisWeb', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: BACKEND_URL,
        changeOrigin: true,
        secure: false, // accept self-signed cert if HTTPS target is ever used
      },
    },
  },
});
