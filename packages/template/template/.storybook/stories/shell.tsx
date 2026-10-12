import type { Decorator } from '@storybook/nextjs-vite'
import { AppLayoutClient } from '../../src/services/app/page/layout/client'
import { AdminLayoutClient } from '../../src/services/admin/page/layout/client'
import { initialUserForPage } from '../mocks/session'

// Every page receives the production service shell, including future stories.
export const withPageShell: Decorator = (Story, context) => {
  if (context.title === '디자인 시스템') return <Story />
  const pathname = context.parameters.nextjs?.navigation?.pathname
  if (!pathname) throw new Error(`페이지 스토리에 pathname을 지정하세요: ${context.id}`)
  if (context.title.startsWith('어드민/')) {
    return (
      <AdminLayoutClient initialUser={initialUserForPage(context.title, pathname)}>
        <Story />
      </AdminLayoutClient>
    )
  }
  if (context.title.startsWith('사용자/')) {
    return <AppLayoutClient initialUser={null}><Story /></AppLayoutClient>
  }
  throw new Error(`사용자 유형에 맞는 실제 레이아웃을 shell.tsx에 추가하세요: ${context.title}`)
}
