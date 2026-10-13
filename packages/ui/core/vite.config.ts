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
  // Icon definitions are authoring helpers evaluated by scripts/generate-icons.mjs; their types are not public.
  plugins: [react(), dts({ insertTypesEntry: true, exclude: ['src/icons/definitions/**'] })],
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        // The icon set is a separate subpath (`@comwit/ui/icons`) so a bundle that only uses the
        // primitives never carries the drawings, and `/icons` (static) never carries the motion
        // runtime of `/icons/animated`. Within an entry, bundlers tree-shake unused icons.
        'icons/index': resolve(__dirname, 'src/icons/index.ts'),
        'icons/animated': resolve(__dirname, 'src/icons/animated.ts'),
        'icons/catalog': resolve(__dirname, 'src/icons/catalog.ts'),
      },
      formats: ['es', 'cjs'],
      fileName: (format, name) => `${name}.${format === 'es' ? 'js' : 'cjs'}`,
    },
    rollupOptions: {
      external: (id) => external.test(id),
      output: {
        exports: 'named',
        // Rollup removes module directives. Restore the client boundary on the animated icon entry.
        banner: (chunk) =>
          /icons\/(?:animated|create-animated-icon)\.tsx?$/.test(chunk.facadeModuleId ?? '')
            ? '"use client";'
            : '',
      },
    },
  },
})
