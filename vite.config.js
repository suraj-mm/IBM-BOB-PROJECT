import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  root: 'src',
  base: './',
  plugins: [react()],
  server: {
    port: 5173,
    host: '127.0.0.1'
  },
  build: {
    outDir: '../dist',
    sourcemap: false,
    rollupOptions: {
      input: 'src/main.jsx'
    }
  }
});
