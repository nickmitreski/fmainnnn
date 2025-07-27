import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: undefined,
        inlineDynamicImports: true, // Force everything inline
      },
    },
  },
  define: {
    // Inject all environment variables as constants at build time
    'import.meta.env.DEV': JSON.stringify(process.env.NODE_ENV === 'development'),
    'import.meta.env.PROD': JSON.stringify(process.env.NODE_ENV === 'production'),
    'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(process.env.VITE_SUPABASE_URL || ''),
    'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(process.env.VITE_SUPABASE_ANON_KEY || ''),
    'import.meta.env.VITE_OPENAI_API_KEY': JSON.stringify(process.env.VITE_OPENAI_API_KEY || ''),
    'import.meta.env.OPENAI_API_KEY': JSON.stringify(process.env.OPENAI_API_KEY || ''),
    'import.meta.env.VITE_MISTRAL_API_KEY': JSON.stringify(process.env.VITE_MISTRAL_API_KEY || ''),
    'import.meta.env.VITE_GOOGLE_MAPS_API_KEY': JSON.stringify(process.env.VITE_GOOGLE_MAPS_API_KEY || ''),
    'import.meta.env.VITE_YOUTUBE_API_KEY': JSON.stringify(process.env.VITE_YOUTUBE_API_KEY || ''),
    'import.meta.env.VITE_PUBLIC_POSTHOG_KEY': JSON.stringify(process.env.VITE_PUBLIC_POSTHOG_KEY || ''),
    'import.meta.env.VITE_PUBLIC_POSTHOG_HOST': JSON.stringify(process.env.VITE_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com'),
    'import.meta.env.VITE_POSTHOG_KEY': JSON.stringify(process.env.VITE_POSTHOG_KEY || ''),
    'import.meta.env.VITE_DEBUG_APIS': JSON.stringify(process.env.VITE_DEBUG_APIS || 'false'),
  },
});
