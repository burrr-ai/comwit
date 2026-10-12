import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect, userEvent, within } from 'storybook/test'
import Account from '../../../src/services/admin/page/account'
import { adminRoutes } from '../../../src/lib/admin-routes'

const meta = {
  id: 'admin-account',
  title: '어드민/내 계정',
  component: Account,
  parameters: { nextjs: { navigation: { pathname: adminRoutes.account } } },
} satisfies Meta<typeof Account>

export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = { name: '기본' }
export const PasswordMismatch: Story = {
  name: '비밀번호 확인 오류',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.type(canvas.getByLabelText('현재 비밀번호', { exact: false }), 'old-example-password')
    await userEvent.type(canvas.getByLabelText(/^새 비밀번호\s*\*?$/), 'new-example-password')
    await userEvent.type(canvas.getByLabelText('새 비밀번호 확인', { exact: false }), 'different-password')
    await userEvent.click(canvas.getByRole('button', { name: '비밀번호 변경' }))
    await expect(canvas.getByRole('alert')).toHaveTextContent('새 비밀번호 확인이 일치하지 않습니다.')
  },
}
