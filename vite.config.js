import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/related-map/',
  build: { outDir: 'build' },
  test: { environment: 'happy-dom', globals: true, environmentOptions: { happyDOM: { settings: { handleDisabledFileLoadingAsSuccess: true } } }, setupFiles: ['./src/setupTests.js'] }
});
