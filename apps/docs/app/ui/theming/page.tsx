import type { Metadata } from 'next'
import Link from 'next/link'
import { tokens, tokenMap, byName } from '../_generated/catalog'

export const metadata: Metadata = { title: '토큰 & 테마' }

export default function TokensPage() {
  const groups = [...new Set(tokens.map((t) => t.group))]
  return (
    <div className="max-w-4xl">
      <header>
        <h1 className="text-display-md text-foreground">토큰 & 테마</h1>
        <p className="mt-2 text-body text-muted-foreground">
          semantic 토큰 하나를 바꾸면 그 토큰을 소비하는 모든 컴포넌트에 전파됩니다. 아래에서 직접
          바꿔보세요 — 미리보기 안에서만 적용됩니다.
        </p>
      </header>

      <section className="mt-8">
        <iframe
          src="/preview/ui/theme"
          title="UI theme playground"
          className="theme-editor-frame"
        />
      </section>

      <section className="mt-16">
        <h2 className="text-title-md text-foreground">토큰 의존 관계</h2>
        <p className="mt-1 text-body-sm text-muted-foreground">
          각 토큰을 소비하는 컴포넌트 — 리테마 시 영향 범위(위계).
        </p>
        <div className="mt-6 space-y-8">
          {groups.map((g) => (
            <div key={g}>
              <h3 className="mb-3 text-caption font-medium uppercase tracking-wide text-muted-foreground">
                {g}
              </h3>
              <div className="space-y-2">
                {tokens
                  .filter((t) => t.group === g)
                  .map((t) => {
                    const users = tokenMap[t.name] ?? []
                    return (
                      <div
                        key={t.name}
                        className="flex flex-col gap-1.5 border-b pb-2 sm:flex-row sm:items-start sm:gap-4"
                      >
                        <div className="flex w-56 shrink-0 items-center gap-2">
                          {t.isColor ? (
                            <span
                              className="size-4 shrink-0 rounded border"
                              style={{ background: t.value }}
                            />
                          ) : (
                            <span className="size-4 shrink-0" />
                          )}
                          <code className="font-mono text-body-sm text-foreground">{t.name}</code>
                        </div>
                        <div className="flex flex-1 flex-wrap gap-1">
                          {users.length ? (
                            users.map((n) => (
                              <Link
                                key={n}
                                href={`/ui/components/${n}`}
                                className="rounded bg-muted px-1.5 py-0.5 text-[11px] text-foreground transition-colors hover:bg-accent"
                              >
                                {byName[n]?.title ?? n}
                              </Link>
                            ))
                          ) : (
                            <span className="text-[11px] text-muted-foreground">—</span>
                          )}
                        </div>
                      </div>
                    )
                  })}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
