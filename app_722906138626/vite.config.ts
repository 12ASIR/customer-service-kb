import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const isGithubPages = process.env.GITHUB_PAGES === 'true';

export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === 'build' && isGithubPages ? '/customer-service-kb/' : '/',
  server: {
    host: true,
    port: 5173,
  },
  preview: {
    port: 4173,
  },
}));
