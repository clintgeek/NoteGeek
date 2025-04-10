import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const process = require('process');

// Check Node.js version (add at the top of the file)
const nodeVersion = process.versions.node;
const [major] = nodeVersion.split('.');
if (major < 14) {
  console.error(
    'Node.js 14.0.0 or higher is required. ' +
    `Your version: ${nodeVersion}`
  );
  process.exit(1);
}

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import commonjs from 'vite-plugin-commonjs'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    commonjs()
  ],
  server: {
    port: 5173,
    host: true
  },
  optimizeDeps: {
    include: ['jwt-decode']
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
})
