import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import type { StorybookConfig } from '@storybook/nextjs-vite'
import { apiMocks } from './api-mocks.mjs'

const root = fileURLToPath(new URL('../', import.meta.url))
// public/ may not exist yet in a fresh project; Storybook refuses a missing static dir.
const publicDir = fileURLToPath(new URL('../public', import.meta.url))

const config: StorybookConfig = {
  stories: ['./stories/**/*.stories.tsx'],
  framework: {
    name: '@storybook/nextjs-vite',
    options: { nextConfigPath: fileURLToPath(new URL('./next.config.ts', import.meta.url)) },
  },
  staticDirs: existsSync(publicDir) ? ['../public'] : [],
  core: { disableTelemetry: true },
  async viteFinal(config) {
    const { mergeConfig } = await import('vite')
    return mergeConfig(config, {
      resolve: {
        alias: [
          { find: '@', replacement: fileURLToPath(new URL('../src', import.meta.url)) },
        ],
      },
      plugins: [apiMocks(root)],
    })
  },
}

export default config
