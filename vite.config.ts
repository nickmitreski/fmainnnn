import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor libraries
          vendor: ['react', 'react-dom'],
          // Split large components
          windows95: ['./src/components/Windows95/Desktop.tsx'],
          modernsite: ['./src/components/ModernSite.tsx'],
          admin: ['./src/components/AdminPage.tsx'],
          iphone: ['./src/components/iPhoneEmu/iPhone.tsx'],
          // Split utilities
          utils: ['framer-motion', 'lucide-react'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
});
