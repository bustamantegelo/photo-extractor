import { resolve } from 'node:path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      outDir: 'build/main',
      rollupOptions: {
        input: { index: resolve('electron/main.ts') },
      },
    },
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      outDir: 'build/preload',
      rollupOptions: {
        input: { index: resolve('electron/preload.ts') },
        output: {
          format: 'cjs',
          entryFileNames: 'index.cjs',
        },
      },
    },
  },
  renderer: {
    root: resolve('.'),
    resolve: {
      alias: { '@': resolve('src') },
    },
    plugins: [react()],
    build: {
      outDir: 'build/renderer',
      rollupOptions: {
        input: resolve('index.html'),
      },
    },
  },
})