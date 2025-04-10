// Check Node.js version (add at the top of the file)
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const process = require('process');

const requiredNodeVersion = '16.0.0';

function compareVersions(v1, v2) {
    const v1parts = v1.split('.').map(Number);
    const v2parts = v2.split('.').map(Number);

    for (let i = 0; i < v1parts.length; ++i) {
        if (v2parts.length === i) {
            return 1; // v1 is longer, so greater
        }
        if (v1parts[i] > v2parts[i]) {
            return 1;
        }
        if (v1parts[i] < v2parts[i]) {
            return -1;
        }
    }

    if (v1parts.length !== v2parts.length) {
        return -1; // v2 is longer, so greater
    }

    return 0;
}

if (compareVersions(process.version.substring(1), requiredNodeVersion) < 0) {
    console.error(`\n\n\x1b[31m=========== ERROR: INCOMPATIBLE NODE.JS VERSION ===========\x1b[0m`);
    console.error(`\x1b[31mYou are running Node.js ${process.version}, but NoteGeek requires at least v${requiredNodeVersion}\x1b[0m`);
    console.error(`\x1b[31mPlease run: \x1b[33mnvm use --lts\x1b[31m and try again.\x1b[0m`);
    console.error(`\x1b[31m=========================================================\x1b[0m\n`);
    process.exit(1);
}

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import commonjs from 'vite-plugin-commonjs'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    commonjs({
      include: ['jwt-decode']
    })
  ],
  optimizeDeps: {
    include: ['react', 'react-dom', 'jwt-decode'],
  },
  build: {
    commonjsOptions: {
      include: [/node_modules/],
    },
  },
})
