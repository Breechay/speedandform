import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  base: '/forge/',
  build: {
    // Output to repo root so Netlify (publish=".") serves it directly
    outDir: resolve(__dirname, '../forge-app'),
    emptyOutDir: true,
  },
})
