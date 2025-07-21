import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const isGitHubPages = process.env.GITHUB_PAGES === 'true';

export default defineConfig({
  plugins: [react()],
  root: 'src/renderer',
  base: isGitHubPages ? '/poe2-quest-tracker/' : './',
  build: {
    outDir: '../../dist/renderer',
    emptyOutDir: true,
  },
  server: {
    port: 3000,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
});
