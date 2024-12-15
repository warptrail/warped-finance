import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    sourcemap: true, // Enable source maps for the build
  },
  server: {
    sourcemap: true, // Ensure source maps work during development
  },
});
