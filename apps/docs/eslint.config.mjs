import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'
import noNativeInteractive from './eslint-rules/no-native-interactive.mjs'

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    plugins: { docs: { rules: { 'no-native-interactive': noNativeInteractive } } },
    rules: { 'docs/no-native-interactive': 'error' },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    'app/ui/_generated/**',
  ]),
])

export default eslintConfig
