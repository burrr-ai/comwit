import { resolve } from 'node:path'

import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

// External everything we don't own: react runtime + the headless engines.
// The accordion/dialog/select/etc. engine is now our own ported code (no
// external dep), react-aria/react-stately still power text-field/autocomplete,
// and @floating-ui/react-dom is a real dependency used by our ported popper.
// @tiptap/* powers the rich-text engine (useRichTextEditor) — keep it external
// so tiptap is not bundled into @comwit/ui dist (consumers/templates own it).
// react-virtuoso powers Chat.List the same way.
const external =
  /^react($|\/)|^react-dom($|\/)|^@floating-ui\/|^react-aria($|\/)|^react-stately($|\/)|^@react-aria\/|^@tiptap\/|^react-virtuoso($|\/)/

export default defineConfig({
  plugins: [react(), dts({ insertTypesEntry: true })],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'ComwitUI',
      fileName: (format) => (format === 'es' ? 'index.js' : 'index.cjs'),
      formats: ['es', 'cjs'],
    },
    rollupOptions: {
      external: (id) => external.test(id),
      output: { exports: 'named' },
    },
  },
})
