import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks: {
          'three-vendor': ['three', '@react-three/fiber', '@react-three/drei'],
          'blockly-vendor': ['blockly'],
          'monaco-vendor': ['@monaco-editor/react'],
          'ui-vendor': ['react', 'react-dom', 'react-router-dom', 'lucide-react'],
        },
      },
    },
  },
});
