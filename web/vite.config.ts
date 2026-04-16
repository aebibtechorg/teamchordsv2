import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'


export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const target = env['services__api__http__0'];
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src')
      }
    },
    server:{
      port: parseInt(env.VITE_PORT),
      proxy: {
        // "apiservice" is the name of the API in AppHost.cs.
        '/api': {
          target: target,
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path
        },
        '/hubs': {
          target: target,
          changeOrigin: true,
          secure: false,
          ws: true,
          rewrite: (path) => path
        }
      }
    },
    build:{
      outDir: 'dist',
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'index.html')
        }
      }
    }
  }
})