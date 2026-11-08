import {defineConfig} from '../frontend/node_modules/vite/dist/node/index.js';
import react from '../frontend/node_modules/@vitejs/plugin-react/dist/index.js';
import {fileURLToPath} from 'node:url';

export default defineConfig({root:fileURLToPath(new URL('../frontend/',import.meta.url)),publicDir:false,
  plugins:[react()],build:{sourcemap:false,emptyOutDir:false,rollupOptions:{input:fileURLToPath(new URL('../frontend/developments.html',import.meta.url))}}});
