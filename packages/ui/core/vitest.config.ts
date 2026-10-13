import { defineConfig } from 'vitest/config'

// Icon tests only; the primitives are exercised through Storybook and the docs/template builds.
export default defineConfig({ test: { environment: 'happy-dom', include: ['test/**/*.test.tsx'] } })
