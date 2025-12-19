import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ command }) => ({
  plugins: [react()],
  // 使用相对路径 './' 可以适配任何仓库名称，无需硬编码 '/customer-service-kb/'
  // 配合 HashRouter 使用非常完美
  base: command === 'build' ? './' : '/',
  server: {
    host: true,
    port: 5173,
  },
  preview: {
    port: 4173,
  },
}));
