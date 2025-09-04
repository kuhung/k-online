import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    open: true,
    proxy: {
      '/api/get-latest-prediction-url': {
        target: 'http://localhost:3000', // 可以是任意有效的 target，实际上我们不会用到它
        changeOrigin: true,
        configure: (proxy, options) => {
          options.bypass = (req, res, options) => {
            if (req.url === '/api/get-latest-prediction-url') {
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ url: '/predictions.json' }));
              return undefined; // 返回 undefined 表示请求已被处理，不再代理
            }
            return false;
          };
        },
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
})
