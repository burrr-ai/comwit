'use client'

import * as React from 'react'
import Link from 'next/link'
import { cn } from '@comwit/ui-templates/lib/utils'
import { tokens, tokenMap, byName } from '../_generated/catalog'

import { Button } from '@comwit/ui-templates/button'
import { Badge } from '@comwit/ui-templates/badge'
import { Switch } from '@comwit/ui-templates/switch'
import { Checkbox } from '@comwit/ui-templates/checkbox'
import { Input } from '@comwit/ui-templates/input'
import { Alert, AlertTitle, AlertDescription } from '@comwit/ui-templates/alert'

const colorTokens = tokens.filter((t) => t.isColor)
const groups = [...new Set(colorTokens.map((t) => t.group))]

const toHex = (v: string) => (/^#[0-9a-fA-F]{6}$/.test(v) ? v : '#888888')

export function ThemeEditor() {
  const [overrides, setOverrides] = React.useState<Record<string, string>>({})
  const [active, setActive] = React.useState<string | null>(null)

  function set(name: string, value: string) {
    document.documentElement.style.setProperty(`--${name}`, value)
    setOverrides((o) => ({ ...o, [name]: value }))
  }
  function reset() {
    for (const t of colorTokens) document.documentElement.style.removeProperty(`--${t.name}`)
    setOverrides({})
  }

  const activeUsers = active ? (tokenMap[active] ?? []) : []

  return (
    <div className="grid gap-6 min-[640px]:grid-cols-[minmax(0,1fr)_270px]">
      {/* ── 토큰 컨트롤 ── */}
      <div>
        <div className="mb-5 flex items-center justify-between gap-4">
          <p className="text-body-sm text-muted-foreground">
            색을 바꾸면 <code className="font-mono text-foreground">--토큰</code> 이 실시간으로
            전파됩니다.
            {Object.keys(overrides).length > 0 && (
              <span className="ml-1 text-foreground">
                ({Object.keys(overrides).length}개 변경됨)
              </span>
            )}
          </p>
          <button
            type="button"
            onClick={reset}
            className="shrink-0 text-body-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
          >
            초기화
          </button>
        </div>

        {groups.map((g) => (
          <div key={g} className="mb-6">
            <p className="mb-2 text-caption font-medium uppercase tracking-wide text-muted-foreground">
              {g}
            </p>
            <div className="grid gap-1.5 sm:grid-cols-2">
              {colorTokens
                .filter((t) => t.group === g)
                .map((t) => {
                  const val = overrides[t.name] ?? t.value
                  return (
                    <div
                      key={t.name}
                      onMouseEnter={() => setActive(t.name)}
                      className={cn(
                        'flex items-center gap-2 rounded-md border px-2 py-1.5 transition-shadow',
                        active === t.name && 'ring-2 ring-ring'
                      )}
                    >
                      <label
                        className="relative size-6 shrink-0 overflow-hidden rounded border"
                        style={{ background: val }}
                      >
                        <input
                          type="color"
                          value={toHex(val)}
                          onChange={(e) => set(t.name, e.target.value)}
                          className="absolute inset-0 cursor-pointer opacity-0"
                          aria-label={`${t.name} 색상`}
                        />
                      </label>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-mono text-[11px] text-foreground">{t.name}</p>
                        <input
                          type="text"
                          aria-label={`${t.name} value`}
                          value={val}
                          onChange={(e) => set(t.name, e.target.value)}
                          spellCheck={false}
                          className="w-full bg-transparent font-mono text-[10px] text-muted-foreground"
                        />
                      </div>
                    </div>
                  )
                })}
            </div>
          </div>
        ))}
      </div>

      {/* ── 라이브 프리뷰 + 의존 ── */}
      <div className="space-y-5 min-[640px]:sticky min-[640px]:top-4 min-[640px]:self-start">
        <div className="space-y-4 rounded-xl border bg-card p-5">
          <p className="text-caption font-medium uppercase tracking-wide text-muted-foreground">
            라이브 프리뷰
          </p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm">Primary</Button>
            <Button size="sm" variant="secondary">
              Secondary
            </Button>
            <Button size="sm" variant="outline">
              Outline
            </Button>
            <Button size="sm" variant="destructive">
              Destructive
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Badge>Badge</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="destructive">Destructive</Badge>
            <Switch defaultChecked />
            <Checkbox defaultChecked />
          </div>
          <Input placeholder="입력 필드" />
          <Alert className="flex-col gap-2">
            <AlertTitle>알림</AlertTitle>
            <AlertDescription>토큰을 바꿔 컴포넌트의 변화를 확인하세요.</AlertDescription>
          </Alert>
        </div>

        <div className="rounded-xl border p-4">
          <p className="text-body-sm text-foreground">
            {active ? (
              <>
                <code className="font-mono">{active}</code> 를 쓰는 컴포넌트
              </>
            ) : (
              '토큰에 마우스를 올리면 의존 컴포넌트가 표시됩니다'
            )}
          </p>
          {active && (
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {activeUsers.length ? (
                activeUsers.map((n) => (
                  <Link
                    key={n}
                    href={`/ui/components/${n}`}
                    target="_top"
                    className="rounded-md bg-muted px-2 py-0.5 text-caption text-foreground transition-colors hover:bg-accent"
                  >
                    {byName[n]?.title ?? n}
                  </Link>
                ))
              ) : (
                <span className="text-caption text-muted-foreground">
                  이 토큰을 직접 쓰는 컴포넌트 없음
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
