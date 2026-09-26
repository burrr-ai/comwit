'use client'

import * as React from 'react'
import { ChevronDown, Code2 } from 'lucide-react'
import { Button } from '@comwit/ui-templates/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@comwit/ui-templates/sheet'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@comwit/ui-templates/collapsible'
import { cn } from '@comwit/ui-templates/lib/utils'
import { byName, groups, type Component } from '../_generated/catalog'
import { EXAMPLES } from '../_generated/examples'
import { CliCommand } from './cli-command'
import { CodeBlock } from './code-block'
import { EXHIBITS } from './exhibits'
import { markArrived } from './gallery-nav'

const CodeContext = React.createContext<(name: string) => void>(() => undefined)

/** "WithLabels" → "With labels" */
function humanize(name: string) {
  const words = name.replace(/([a-z0-9])([A-Z])/g, '$1 $2').split(' ')
  return words.map((w, i) => (i === 0 ? w : w.toLowerCase())).join(' ')
}

/** 카드에 올릴 예시 — 전시물(exhibit)이 있으면 그것, 없으면 스펙의 gallery 스토리. */
function Preview({ name }: { name: string }) {
  const Exhibit = EXHIBITS[name]
  if (Exhibit) return <Exhibit />
  const examples = EXAMPLES[name] ?? []
  const example = examples.find((e) => e.gallery) ?? examples[0]
  if (!example) return null
  return <example.Render />
}

/** "Built on Sonner" — the curated library behind a component, linked. Nothing when there is none. */
function Credits({ component: c, className }: { component: Component; className?: string }) {
  if (!c.credits.length) return null
  return (
    <p className={cn('text-caption text-muted-foreground', className)}>
      Built on{' '}
      {c.credits.map((credit, i) => (
        <React.Fragment key={credit.href}>
          {i > 0 && (i === c.credits.length - 1 ? ' and ' : ', ')}
          <a
            href={credit.href}
            target="_blank"
            rel="noreferrer"
            className="font-medium text-soft-foreground underline decoration-border underline-offset-[3px] transition-colors duration-fast hover:text-primary hover:decoration-primary"
          >
            {credit.label}
          </a>
        </React.Fragment>
      ))}
    </p>
  )
}

function CodeButton({ name, className }: { name: string; className?: string }) {
  const openCode = React.useContext(CodeContext)
  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn('shrink-0 text-muted-foreground hover:text-foreground', className)}
      onClick={() => openCode(name)}
      aria-label={`${byName[name].title} code and install`}
    >
      <Code2 /> Code
    </Button>
  )
}

/**
 * 한 항목에 한 줄 — 왼쪽 이름 칸, 오른쪽 라이브 전시물. 항목마다 세로 위치가 달라서 사이드바에서 고르면
 * 언제나 그 항목이 맨 위로 올라온다(나란히 놓인 이웃과 같은 자리를 나눠 갖지 않는다).
 */
function ItemInfo({ component: c, sticky }: { component: Component; sticky?: boolean }) {
  return (
    <div
      className={cn(
        'flex items-start justify-between gap-2 md:block',
        // 폰처럼 긴 전시물 옆에서는 이름 칸이 헤더 아래에 붙어 따라온다.
        sticky && 'md:sticky md:top-[calc(var(--site-header-height)+24px)] md:self-start'
      )}
    >
      <div className="min-w-0">
        <h3 id={`${c.name}-title`} className="text-title-sm text-foreground">
          {c.title}
        </h3>
        <Credits component={c} className="mt-1" />
      </div>
      <CodeButton name={c.name} className="md:mt-2 md:-ml-3" />
    </div>
  )
}

const ROW = 'grid gap-4 md:grid-cols-[200px_minmax(0,1fr)] md:gap-8'

/** 전시형 — 이름 칸 + 회색 무대 위의 전시물(폰·넓은 판·카드). */
function GalleryCard({ component: c }: { component: Component }) {
  const tall = c.exhibit === 'phone'
  return (
    <article
      id={c.name}
      data-gallery-item
      aria-labelledby={`${c.name}-title`}
      className={cn(ROW, 'border-t border-border py-8')}
    >
      <ItemInfo component={c} sticky={tall} />
      <div
        data-gallery-stage="card"
        className={cn(
          'flex min-w-0 items-center justify-center overflow-hidden rounded-card bg-muted',
          // 폰 무대는 높이를 고정한다(폰 612 + 아래 줄 36 + 여백). 전시물이 무엇을 두든 사각형이 같다.
          tall
            ? 'h-[732px] px-4 py-8'
            : c.exhibit === 'wide'
              ? 'min-h-72 p-6 sm:p-8'
              : 'min-h-72 p-6'
        )}
      >
        <div className={cn('flex w-full justify-center', c.exhibit === 'card' && 'max-w-xl')}>
          <Preview name={c.name} />
        </div>
      </div>
    </article>
  )
}

/** 기본형 — 카드 없이 이름 칸 + 라이브 컴포넌트 한 줄. 훑고 지나가는 견본지. */
function SpecimenRow({ component: c }: { component: Component }) {
  return (
    <div
      id={c.name}
      data-gallery-item
      data-gallery-stage="row"
      className={cn(ROW, 'border-t border-border py-7')}
    >
      <ItemInfo component={c} />
      <div className="flex min-w-0 items-center overflow-x-auto py-1">
        <Preview name={c.name} />
      </div>
    </div>
  )
}

function ComponentSheet({ name, onClose }: { name: string | null; onClose: () => void }) {
  // 닫히는 애니메이션 동안 내용이 비지 않도록 마지막 항목을 붙잡아 둔다.
  const [shown, setShown] = React.useState(name)
  if (name && name !== shown) setShown(name)
  const c = shown ? byName[shown] : null
  const live = shown ? (EXAMPLES[shown] ?? []) : []
  const importLine = c
    ? `import { ${c.parts.slice(0, 6).join(', ')}${c.parts.length > 6 ? ', …' : ''} } from '${c.importFrom}'`
    : ''

  return (
    <Sheet open={Boolean(name)} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full gap-0 p-0 sm:max-w-2xl">
        {c && (
          <div className="flex h-full flex-col">
            <SheetHeader className="border-b border-border px-6 pt-6 pb-5">
              <SheetTitle className="text-title-lg">{c.title}</SheetTitle>
              <SheetDescription>{c.summary}</SheetDescription>
              <Credits component={c} />
            </SheetHeader>
            <div className="min-h-0 flex-1 space-y-8 overflow-y-auto px-6 py-6">
              <section className="space-y-2">
                <CliCommand command={c.cli} />
                <CodeBlock code={importLine} />
              </section>

              {live.map((ex) => (
                <section key={ex.name} className="space-y-3">
                  <div>
                    <h4 className="text-title-sm text-foreground">{humanize(ex.name)}</h4>
                    {ex.description && (
                      <p className="mt-0.5 text-body-sm text-soft-foreground">{ex.description}</p>
                    )}
                  </div>
                  <div className="flex min-h-40 items-center justify-center overflow-x-auto rounded-card bg-muted p-6">
                    <ex.Render />
                  </div>
                  <Collapsible>
                    <CollapsibleTrigger className="group/code flex items-center gap-1 rounded-lg px-1 text-caption font-semibold text-muted-foreground transition-colors duration-fast hover:text-foreground">
                      <ChevronDown className="size-3.5 transition-transform duration-base group-data-[state=open]/code:rotate-180" />
                      Code
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pt-2">
                      <CodeBlock code={ex.code} />
                    </CollapsibleContent>
                  </Collapsible>
                </section>
              ))}

              <section className="space-y-3 border-t border-border pt-6">
                {c.npmDeps.length > 0 && (
                  <p className="text-body-sm text-soft-foreground">
                    Installs{' '}
                    {c.npmDeps.map((d, i) => (
                      <React.Fragment key={d}>
                        {i > 0 && ', '}
                        <code className="font-mono text-caption text-foreground">{d}</code>
                      </React.Fragment>
                    ))}
                    {c.registryDeps.length > 0 && (
                      <>
                        {' '}
                        with{' '}
                        {c.registryDeps.map((d, i) => (
                          <React.Fragment key={d}>
                            {i > 0 && ', '}
                            <code className="font-mono text-caption text-foreground">{d}</code>
                          </React.Fragment>
                        ))}
                      </>
                    )}
                    .
                  </p>
                )}
                <Collapsible>
                  <CollapsibleTrigger className="group/src flex items-center gap-1 rounded-lg px-1 text-caption font-semibold text-muted-foreground transition-colors duration-fast hover:text-foreground">
                    <ChevronDown className="size-3.5 transition-transform duration-base group-data-[state=open]/src:rotate-180" />
                    Full source
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pt-2">
                    <CodeBlock code={c.source} />
                  </CollapsibleContent>
                </Collapsible>
              </section>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

export function Gallery() {
  const [open, setOpen] = React.useState<string | null>(null)
  // 다른 페이지의 링크(/ui/components#toast)로 들어왔을 때도 도착한 항목을 표시한다.
  React.useEffect(() => {
    const target = document.getElementById(decodeURIComponent(window.location.hash.slice(1)))
    if (target?.hasAttribute('data-gallery-item')) markArrived(target)
  }, [])
  return (
    <CodeContext.Provider value={setOpen}>
      {groups.map((g) => {
        const items = g.items.map((n) => byName[n])
        return (
          <section
            key={g.id}
            id={g.id}
            data-gallery-group
            aria-labelledby={`${g.id}-heading`}
            className="mt-20 first:mt-14"
          >
            <div className="mb-7 max-w-2xl">
              <h2 id={`${g.id}-heading`} className="text-display-sm text-foreground">
                {g.title}
              </h2>
              <p className="mt-2 text-body text-soft-foreground">{g.blurb}</p>
            </div>
            <div className="border-b border-border">
              {items.map((c) =>
                g.specimen ? (
                  <SpecimenRow key={c.name} component={c} />
                ) : (
                  <GalleryCard key={c.name} component={c} />
                )
              )}
            </div>
          </section>
        )
      })}
      <ComponentSheet name={open} onClose={() => setOpen(null)} />
    </CodeContext.Provider>
  )
}
