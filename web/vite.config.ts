import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { execSync } from 'child_process'

function getGitHash(): string {
  try {
    return execSync('git rev-parse --short HEAD').toString().trim()
  } catch {
    return 'unknown'
  }
}

export default defineConfig({
  plugins: [react()],
  define: {
    __GIT_HASH__: JSON.stringify(getGitHash()),
  },
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
        target: 'http://localhost:3000',
        changeOrigin: true,
        configure: (_proxy, options) => {
          options.bypass = (req, res) => {
            if (req.url === '/api/get-latest-prediction-url') {
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ url: '/predictions.json' }));
              return undefined;
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
