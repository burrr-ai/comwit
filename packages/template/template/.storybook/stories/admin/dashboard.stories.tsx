import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import Dashboard from '../../../src/services/admin/page/dashboard'
import { adminRoutes } from '../../../src/lib/admin-routes'

const meta = {
  id: 'admin-dashboard',
  title: '어드민/사용자 관리',
  component: Dashboard,
  parameters: { nextjs: { navigation: { pathname: adminRoutes.dashboard } } },
} satisfies Meta<typeof Dashboard>

export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = { name: '기본' }
