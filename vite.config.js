import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({ base: './', plugins: [react()], assetsInclude: ['**/*.glb', '**/*.hdr'], build: { chunkSizeWarningLimit: 1500 } });
