import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Button } from '../../../src/lib/components/ui/button'
import { Input } from '../../../src/lib/components/ui/input'
import { Alert } from '../../../src/lib/components/ui/alert'
import { Chip } from '../../../src/lib/components/ui/chip'

function DesignSystemPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-12 bg-background px-6 py-12 text-foreground">
      <header className="space-y-3">
        <h1 className="text-display-lg">디자인 시스템</h1>
        <p className="text-body text-soft-foreground">프로젝트의 실제 토큰과 공통 UI를 한 페이지에서 확인합니다.</p>
      </header>
      <section className="space-y-4">
        <h2 className="text-title-lg">색상과 표면</h2>
        <div className="grid gap-4 sm:grid-cols-4">
          {[
            ['기본', 'bg-background text-foreground'],
            ['브랜드', 'bg-primary text-primary-foreground'],
            ['보조', 'bg-secondary text-secondary-foreground'],
            ['카드', 'bg-card text-card-foreground'],
          ].map(([label, style]) => <div key={label} className={`rounded-card border border-border p-6 ${style}`}>{label}</div>)}
        </div>
      </section>
      <section className="space-y-4">
        <h2 className="text-title-lg">타이포그래피</h2>
        <p className="text-display-md">큰 제목과 분명한 위계</p>
        <p className="text-title-md">섹션 제목</p>
        <p className="text-body text-soft-foreground">본문은 편안하게 읽을 수 있는 크기와 대비를 사용합니다.</p>
        <p className="text-caption text-muted-foreground">보조 정보와 입력 도움말</p>
      </section>
      <section className="space-y-4">
        <h2 className="text-title-lg">버튼과 입력</h2>
        <div className="flex flex-wrap gap-3">
          <Button>기본 행동</Button><Button variant="secondary">보조 행동</Button>
          <Button variant="outline">외곽선</Button><Button variant="destructive">삭제</Button><Button disabled>비활성</Button>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Input aria-label="기본 입력" placeholder="내용을 입력하세요" />
          <Input aria-label="오류 입력" defaultValue="확인이 필요한 값" aria-invalid />
          <Input aria-label="비활성 입력" placeholder="비활성 입력" disabled />
        </div>
      </section>
      <section className="space-y-4">
        <h2 className="text-title-lg">상태 피드백</h2>
        <div className="flex flex-wrap gap-3">
          <Chip tone="success">완료</Chip><Chip tone="warning">대기</Chip><Chip tone="destructive">오류</Chip><Chip tone="info">안내</Chip>
        </div>
        <Alert tone="info">상태색은 브랜드색과 분리해 일관된 의미를 전달합니다.</Alert>
      </section>
    </main>
  )
}

const meta = { title: '디자인 시스템', id: 'design-system', component: DesignSystemPage } satisfies Meta<typeof DesignSystemPage>
export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = { name: '디자인 시스템' }
