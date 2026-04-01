import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

/** Avoid proxying to "localhost" on Windows — Node can hit ENOBUFS during getaddrinfo when resolving ::1/127.0.0.1. */
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const rawPort = env.VITE_API_PROXY_PORT || process.env.PORT || '3001';
  const proxyPort = Number(rawPort);
  const safePort = Number.isFinite(proxyPort) && proxyPort > 0 ? proxyPort : 3001;
  const proxyTarget = `http://127.0.0.1:${safePort}`;

  return {
    plugins: [react()],
    optimizeDeps: {
      include: ['react-router-dom'],
    },
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
        },
      },
    },
  };
});
