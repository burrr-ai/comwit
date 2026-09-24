import * as React from 'react'

import { Button } from '@comwit/ui-templates/button'
import { Chip } from '@comwit/ui-templates/chip'

/**
 * 메인 페이지 프리뷰 — 레이아웃과 토큰의 "느낌"만 보여주는 **빈 플레이스홀더**.
 * 베이스 템플릿이라 실제 콘텐츠·브랜드는 비워둔다. 프로젝트가 정해지면
 * services/app/page 에서 채운다.
 */

function Line({ w }: { w: string }) {
  return <div className={`h-3 rounded bg-muted ${w}`} />
}

export function MainPagePreview() {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
      {/* top bar */}
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <div className="flex items-center gap-2">
          <span className="size-4 rounded bg-primary" />
          <span className="text-title-md text-foreground">Brand</span>
        </div>
        <nav className="hidden items-center gap-5 md:flex">
          <Line w="w-12" />
          <Line w="w-12" />
          <Line w="w-12" />
        </nav>
        <Button variant="outline" size="sm">
          Action
        </Button>
      </div>

      {/* hero */}
      <div className="flex flex-col items-center px-6 pb-10 pt-12 text-center">
        <div className="h-8 w-72 max-w-full rounded-md bg-muted" />
        <div className="mt-3 h-4 w-96 max-w-full rounded bg-muted" />
        <div className="mt-6 flex items-center gap-2">
          <Button>기본 버튼</Button>
          <Button variant="outline">보조 버튼</Button>
        </div>
        <div className="mt-5 flex items-center gap-2">
          <Chip size="sm" selected>
            전체
          </Chip>
          <Chip size="sm">카테고리</Chip>
          <Chip size="sm">카테고리</Chip>
        </div>
      </div>

      {/* placeholder card grid */}
      <div className="grid gap-5 border-t border-border bg-muted/40 p-6 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-lg border border-border bg-card p-3">
            <div className="aspect-[4/3] w-full rounded-md bg-muted" />
            <div className="space-y-2 p-1 pt-3">
              <Line w="w-2/3" />
              <Line w="w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
