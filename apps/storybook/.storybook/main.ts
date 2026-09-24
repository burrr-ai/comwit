import type { StorybookConfig } from '@storybook/react-vite'
import tailwindcss from '@tailwindcss/vite'

const config: StorybookConfig = {
  // 스토리는 codegen(scripts/build-stories.mjs)이 뽑는 generated/* + 손으로 쓴 compound 스토리.
  // 모두 @comwit/ui-templates 를 직접 import 한다 — 컴포넌트 코드 복제 없음.
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
