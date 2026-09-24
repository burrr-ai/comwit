import type { Metadata } from 'next'
import Link from 'next/link'
import { components } from '../_generated/catalog'

export const metadata: Metadata = { title: '컴포넌트 카탈로그' }

export default function ComponentsPage() {
  const sorted = [...components].sort((a, b) => a.title.localeCompare(b.title))
  return (
    <div>
      <header className="max-w-3xl">
        <h1 className="text-display-md text-foreground">컴포넌트 카탈로그</h1>
        <p className="mt-2 text-body text-muted-foreground">
          {components.length}개 컴포넌트. 각 페이지에 라이브 예시 · 복붙 코드 · CLI 설치 명령 · 구성
          파트.
        </p>
      </header>

      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {sorted.map((c) => (
          <Link
            key={c.name}
            href={`/ui/components/${c.name}`}
            className="group rounded-xl border bg-card p-4 transition-colors hover:border-foreground/20 hover:bg-accent/30"
          >
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-title-sm text-foreground">{c.title}</h2>
            </div>
            <p className="mt-1 line-clamp-2 text-body-sm text-muted-foreground">{c.oneLiner}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
