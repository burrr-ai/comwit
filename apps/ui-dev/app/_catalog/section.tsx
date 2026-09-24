import * as React from 'react'

/** 넘버링 섹션 셸 — `01 — COLOR` 스타일 헤더 + 제목 + 설명. */
export function CatalogSection({
  index,
  eyebrow,
  title,
  desc,
  children,
}: {
  index: string
  eyebrow: string
  title: string
  desc?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section
      id={eyebrow.toLowerCase().replace(/\s+/g, '-')}
      className="scroll-mt-16 border-t border-border pt-14"
    >
      <h2 className="text-display-md text-foreground">{title}</h2>
      {desc ? (
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">{desc}</p>
      ) : null}
      <div className="mt-10">{children}</div>
    </section>
  )
}

/** 섹션 안 소그룹 라벨 */
export function GroupLabel({ children }: { children: React.ReactNode }) {
  return <h3 className="mb-4 text-title-md text-foreground">{children}</h3>
}
