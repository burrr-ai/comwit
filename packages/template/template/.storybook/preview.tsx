import type { Preview } from '@storybook/nextjs-vite'
import { RootLayoutClient } from '../src/lib/layout/client'
import '../src/app/globals.css'
import './preview.css'
import { withPageShell } from './stories/shell'
import { user } from './mocks/api/app-user'
import { adminUser } from './mocks/api/admin-user'
import { initialUserForPage } from './mocks/session'

const preview: Preview = {
  beforeEach(context) {
    user.getMe.mockReset().mockResolvedValue(null)
    adminUser.getMe.mockReset().mockImplementation(async () =>
      initialUserForPage(context.title, context.parameters.nextjs?.navigation?.pathname),
    )
  },
  parameters: {
    layout: 'fullscreen',
    nextjs: { appDirectory: true },
    options: { storySort: { order: ['디자인 시스템', '사용자', '어드민'] } },
  },
  decorators: [
    withPageShell,
    (Story, context) => (
      <RootLayoutClient key={context.id}>
        <Story />
      </RootLayoutClient>
    ),
  ],
}

export default preview
