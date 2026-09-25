import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // 5174 pour tourner en même temps qu'AVEREO CONNECT (5173) en local.
  // Hôte explicite : sous Windows, « localhost » n'écoute qu'en IPv6 (::1)
  // et http://127.0.0.1:5174 serait refusé. Port strict : le corpus est lié à
  // l'adresse ; un repli silencieux sur 5175 afficherait un corpus vide.
  server: { host: '127.0.0.1', port: 5174, strictPort: true },
  preview: { host: '127.0.0.1', port: 5174, strictPort: true },
  test: { environment: 'node' },
});
