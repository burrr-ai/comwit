import type { StorybookConfig } from '@storybook/react-vite'
import tailwindcss from '@tailwindcss/vite'

const config: StorybookConfig = {
  // Stories include generated/* from scripts/build-stories.mjs and handwritten compound stories.
  // All stories import @comwit/ui-templates directly; no component implementation is copied.
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  addons: [],
  framework: { name: '@storybook/react-vite', options: {} },
  core: { disableTelemetry: true },
  async viteFinal(config) {
    config.plugins = config.plugins ?? []
    config.plugins.push(tailwindcss())
    return config
  },
}

export default config
