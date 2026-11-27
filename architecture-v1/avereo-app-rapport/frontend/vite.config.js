import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import applicationInstallable from './pwa/plugin.js';

export default defineConfig({
  plugins: [react(), applicationInstallable()],
});
