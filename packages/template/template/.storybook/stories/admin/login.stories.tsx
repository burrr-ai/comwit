import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import Login from '../../../src/services/admin/page/login'
import { adminRoutes } from '../../../src/lib/admin-routes'

const meta = {
  id: 'admin-login',
  title: '어드민/로그인',
  component: Login,
  parameters: { nextjs: { navigation: { pathname: adminRoutes.login } } },
} satisfies Meta<typeof Login>

export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = { name: '기본' }
