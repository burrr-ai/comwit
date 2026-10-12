import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [react(), dts({ include: ['src'], exclude: ['src/definitions'] })],
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        animated: resolve(__dirname, 'src/animated.ts'),
        catalog: resolve(__dirname, 'src/catalog.ts'),
      },
      formats: ['es', 'cjs'],
      fileName: (format, name) => `${name}.${format === 'es' ? 'js' : 'cjs'}`,
    },
    rollupOptions: {
      external: /^react($|\/)/,
      output: {
        preserveModules: true,
        preserveModulesRoot: 'src',
        exports: 'named',
        // Rollup removes module directives. Restore the client boundary only for motion modules.
        banner: (chunk) =>
          /(?:animated|create-animated-icon)\.(?:tsx?|jsx?)$/.test(chunk.facadeModuleId ?? '')
            ? '"use client";'
            : '',
      },
    },
  },
})
