import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: '.',
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        exercise1: resolve(__dirname, 'exercise1/index.html'),
        exercise2: resolve(__dirname, 'exercise2/index.html'),
        exercise3: resolve(__dirname, 'exercise3/index.html'),
        exercise4: resolve(__dirname, 'exercise4/index.html'),
        exercise5: resolve(__dirname, 'exercise5/index.html'),
        exercise6: resolve(__dirname, 'exercise6/index.html')
      }
    }
  },
  server: {
    port: 3000
  }
});