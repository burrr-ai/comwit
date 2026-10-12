import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import HomePage from '../../../src/services/app/page/home'

const meta = {
  id: 'app-home',
  title: '사용자/홈',
  component: HomePage,
  parameters: { nextjs: { navigation: { pathname: '/' } } },
} satisfies Meta<typeof HomePage>

export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = { name: '기본' }
