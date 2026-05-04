import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  base: '/forge-app/',
  build: {
    outDir: resolve(__dirname, '../forge-app'),
    emptyOutDir: true,
  },
})
