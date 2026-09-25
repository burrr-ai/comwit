'use client'

import * as React from 'react'
import { toast } from '@comwit/ui-templates/toast'
import { CheckCircle2, AlertTriangle, XCircle, Info, Search, Plus } from 'lucide-react'

import { popup } from '@comwit/ui-templates/lib/popup'
import { Button } from '@comwit/ui-templates/button'
import { Chip } from '@comwit/ui-templates/chip'
import { Badge } from '@comwit/ui-templates/badge'
import { Input } from '@comwit/ui-templates/input'
import { InputGroup, InputAddon } from '@comwit/ui-templates/input-group'
import { Textarea } from '@comwit/ui-templates/textarea'
import { TextField } from '@comwit/ui-templates/text-field'
import { Label } from '@comwit/ui-templates/label'
import { Checkbox } from '@comwit/ui-templates/checkbox'
import { RadioGroup, RadioGroupItem } from '@comwit/ui-templates/radio-group'
import { Switch } from '@comwit/ui-templates/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@comwit/ui-templates/select'
import { Autocomplete, AutocompleteItem } from '@comwit/ui-templates/autocomplete'
import { Calendar } from '@comwit/ui-templates/calendar'
import { DatePicker } from '@comwit/ui-templates/date-picker'
import { TimePicker } from '@comwit/ui-templates/time-picker'
import { MonthPicker } from '@comwit/ui-templates/month-picker'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@comwit/ui-templates/tabs'
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@comwit/ui-templates/accordion'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@comwit/ui-templates/dialog'
import { Separator } from '@comwit/ui-templates/separator'

import { CatalogSection, GroupLabel } from './section'
import { MainPagePreview } from './main-preview'
import { DataTableDemo } from './data-table-demo'
import { Foundations } from './foundations'
import { OverrideLab, OverrideLabControls } from './override-lab'

/* status 5토큰 아나토미 — solid/on-solid 는 헤더 스트립에, surface/on-surface/border 는 본문에 그대로 시연 */
const STATUS_ANATOMY = [
  {
    key: 'success',
    solid: 'bg-success text-success-foreground',
    surface: 'border-success-border bg-success-surface',
    fg: 'text-success-surface-foreground',
    hex: '#30a46c · sf #e6f6eb · fg #1c7549 · bd #8eceaa',
  },
  {
    key: 'info',
    solid: 'bg-info text-info-foreground',
    surface: 'border-info-border bg-info-surface',
    fg: 'text-info-surface-foreground',
    hex: '#0090ff · sf #e6f4fe · fg #0b68ba · bd #8ec8f6',
  },
  {
    key: 'warning',
    solid: 'bg-warning text-warning-foreground',
    surface: 'border-warning-border bg-warning-surface',
    fg: 'text-warning-surface-foreground',
    hex: '#f76b15 · sf #ffefd6 · fg #b54500 · bd #f5ae73',
  },
  {
    key: 'destructive',
    solid: 'bg-destructive text-destructive-foreground',
    surface: 'border-destructive-border bg-destructive-surface',
    fg: 'text-destructive-surface-foreground',
    hex: '#e5484d · sf #feebec · fg #c62a2f · bd #f4a9aa',
  },
] as const

const BUTTON_VARIANTS = ['default', 'secondary', 'outline', 'ghost', 'link', 'destructive'] as const

/* 콜아웃 = surface 배경 + border + on-surface 텍스트(같은 계열 진한 톤) + 솔리드 아이콘 */
const CALLOUTS = [
  {
    tone: 'success',
    wrap: 'border-success-border bg-success-surface',
    icon: 'text-success',
    fg: 'text-success-surface-foreground',
    Icon: CheckCircle2,
    title: '완료되었습니다',
    body: '작업이 정상적으로 처리되었습니다.',
  },
  {
    tone: 'info',
    wrap: 'border-info-border bg-info-surface',
    icon: 'text-info',
    fg: 'text-info-surface-foreground',
    Icon: Info,
    title: '안내',
    body: '참고할 정보를 여기에 표시합니다.',
  },
  {
    tone: 'warning',
    wrap: 'border-warning-border bg-warning-surface',
    icon: 'text-warning',
    fg: 'text-warning-surface-foreground',
    Icon: AlertTriangle,
    title: '주의가 필요합니다',
    body: '확인이 필요한 항목이 있습니다.',
  },
  {
    tone: 'destructive',
    wrap: 'border-destructive-border bg-destructive-surface',
    icon: 'text-destructive',
    fg: 'text-destructive-surface-foreground',
    Icon: XCircle,
    title: '문제가 발생했습니다',
    body: '다시 시도해 주세요.',
  },
] as const

const FILLED_CALLOUTS = [
  {
    tone: 'success',
    wrap: 'bg-success text-success-foreground',
    Icon: CheckCircle2,
    title: '저장되었습니다',
  },
  {
    tone: 'warning',
    wrap: 'bg-warning text-warning-foreground',
    Icon: AlertTriangle,
    title: '용량이 얼마 남지 않았습니다',
  },
  {
    tone: 'destructive',
    wrap: 'bg-destructive text-destructive-foreground',
    Icon: XCircle,
    title: '삭제에 실패했습니다',
  },
  { tone: 'info', wrap: 'bg-info text-info-foreground', Icon: Info, title: '새 버전이 있습니다' },
] as const

const CHIP_TONES = ['neutral', 'brand', 'success', 'warning', 'destructive', 'info'] as const

const FRUITS: [string, string][] = [
  ['apple', '사과'],
  ['banana', '바나나'],
  ['cherry', '체리'],
  ['grape', '포도'],
  ['mango', '망고'],
  ['orange', '오렌지'],
  ['peach', '복숭아'],
  ['strawberry', '딸기'],
  ['watermelon', '수박'],
]

/* ── 헬퍼 ──────────────────────────────────────────────────────── */

const NAV: [string, string][] = [
  ['overview', 'Overview'],
  ['foundations', 'Foundations'],
  ['status', 'Status'],
  ['buttons', 'Buttons'],
  ['chips', 'Chips'],
  ['form', 'Form'],
  ['date', 'Date'],
  ['disclosure', 'Disclosure'],
  ['data', 'Data'],
  ['feedback', 'Feedback'],
  ['elevation', 'Elevation'],
]

/* ── 카탈로그 ──────────────────────────────────────────────────── */

export function DesignSystemCatalog() {
  const [date, setDate] = React.useState('')
  const [time, setTime] = React.useState('')
  const [month, setMonth] = React.useState('')
  const [day, setDay] = React.useState<Date | undefined>(undefined)
  const [filter, setFilter] = React.useState('전체')
  const [tags, setTags] = React.useState(['디자인', '토큰', '컴포넌트'])
  const [floatName, setFloatName] = React.useState('김토큰')
  const [floatEmail, setFloatEmail] = React.useState('')
  const [floatBio, setFloatBio] = React.useState('')
  const [fruit, setFruit] = React.useState<React.Key | null>(null)

  return (
    /* 전 섹션을 Override Lab 이 감싼다 — 래퍼에 CSS 변수만 꽂는데 아래 전부가 리스킨된다.
       소비처가 :root 에서 하는 일과 정확히 같다. */
    <OverrideLab>
      <div className="min-h-screen bg-background text-foreground">
        <div className="mx-auto flex max-w-6xl gap-12 px-6 py-14">
          <aside className="sticky top-14 hidden h-fit w-40 shrink-0 lg:block">
            <p className="mb-4 text-caption font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Design System
            </p>
            <nav className="flex flex-col gap-1 text-body-sm">
              {NAV.map(([id, label]) => (
                <a
                  key={id}
                  href={`#${id}`}
                  className="rounded-md px-2 py-1 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  {label}
                </a>
              ))}
            </nav>
          </aside>

          <main className="min-w-0 flex-1 space-y-4">
            <header className="pb-6">
              <h1 className="text-display-lg text-foreground">디자인 시스템</h1>
            </header>

            <CatalogSection index="00" eyebrow="Overview" title="메인 페이지 미리보기">
              <MainPagePreview />
            </CatalogSection>

            <CatalogSection
              index="01"
              eyebrow="Foundations"
              title="디자인 토큰"
              desc="색·radius·border·elevation·typography·motion·state 를 전부 토큰화했다. 라이브러리는 테마를 싣지 않는다 — 아래 노브를 돌리면(=소비처가 :root 에서 값을 덮으면) 이 페이지의 모든 컴포넌트가 한 번에 리스킨된다. 컴포넌트 코드는 0줄 변한다."
            >
              <div className="space-y-12">
                <OverrideLabControls />
                <Foundations />
              </div>
            </CatalogSection>

            <CatalogSection index="02" eyebrow="Status" title="상태 팔레트">
              <div className="space-y-10">
                {/* 토큰 아나토미 — 카드 하나가 5토큰 전부를 제자리에 시연 */}
                <div className="grid gap-4 sm:grid-cols-2">
                  {STATUS_ANATOMY.map((s) => (
                    <div
                      key={s.key}
                      className={`overflow-hidden rounded-lg border ${s.surface.split(' ')[0]}`}
                    >
                      <div className={`px-4 py-3 ${s.solid}`}>
                        <p className="text-title-sm">{s.key}</p>
                        <p className="font-mono text-caption">
                          bg-{s.key} + text-{s.key}-foreground
                        </p>
                      </div>
                      <div className={`border-t p-4 ${s.surface}`}>
                        <p className={`text-title-sm ${s.fg}`}>
                          surface 위 텍스트는 같은 계열 진한 톤
                        </p>
                        <p className={`mt-0.5 text-body-sm ${s.fg}`}>
                          bg-{s.key}-surface · text-{s.key}-surface-foreground · border-{s.key}
                          -border
                        </p>
                        <p className={`mt-2 font-mono text-caption ${s.fg}`}>{s.hex}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div>
                  <GroupLabel>콜아웃</GroupLabel>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {CALLOUTS.map((c) => (
                      <div key={c.tone} className={`flex gap-3 rounded-lg border p-4 ${c.wrap}`}>
                        <c.Icon className={`mt-0.5 size-5 shrink-0 ${c.icon}`} />
                        <div className="min-w-0">
                          <p className={`text-title-sm ${c.fg}`}>{c.title}</p>
                          <p className={`mt-0.5 text-body-sm ${c.fg}`}>{c.body}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* 칩형 콜아웃 — 솔리드 칩 + 본문 인라인 */}
                  <div className="mt-4 flex items-center gap-3 rounded-lg border border-warning-border bg-warning-surface px-4 py-3">
                    <span className="shrink-0 rounded-md bg-warning px-2 py-0.5 text-caption font-semibold text-warning-foreground">
                      Tip
                    </span>
                    <p className="min-w-0 text-body-sm text-warning-surface-foreground">
                      자세한 사용법은{' '}
                      <a href="#status" className="font-medium underline underline-offset-2">
                        디자인 가이드
                      </a>
                      에서 확인하세요.
                    </p>
                  </div>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    {FILLED_CALLOUTS.map((c) => (
                      <div
                        key={c.tone}
                        className={`flex items-center gap-3 rounded-lg p-4 ${c.wrap}`}
                      >
                        <c.Icon className="size-5 shrink-0" />
                        <p className="text-title-sm">{c.title}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <GroupLabel>Chip 톤</GroupLabel>
                  <div className="flex flex-wrap gap-2">
                    {CHIP_TONES.map((tone) => (
                      <Chip key={tone} tone={tone}>
                        {tone}
                      </Chip>
                    ))}
                  </div>
                </div>
              </div>
            </CatalogSection>

            <CatalogSection index="04" eyebrow="Buttons" title="버튼">
              <div className="space-y-6 rounded-lg border border-border p-6">
                <div className="flex flex-wrap items-center gap-3">
                  {BUTTON_VARIANTS.map((v) => (
                    <Button key={v} variant={v}>
                      {v}
                    </Button>
                  ))}
                </div>
                <Separator />
                <div className="flex flex-wrap items-center gap-3">
                  <Button size="sm">sm</Button>
                  <Button>default</Button>
                  <Button size="lg">lg</Button>
                  <Button size="icon" variant="outline" aria-label="검색">
                    <Search />
                  </Button>
                  <Button className="rounded-pill px-5">pill</Button>
                  <Button disabled>disabled</Button>
                </div>
              </div>
            </CatalogSection>

            <CatalogSection index="05" eyebrow="Chips" title="칩">
              <div className="space-y-6 rounded-lg border border-border p-6">
                {(['soft', 'solid', 'outline'] as const).map((variant) => (
                  <div key={variant} className="flex flex-wrap items-center gap-2">
                    <span className="w-14 shrink-0 font-mono text-caption text-muted-foreground">
                      {variant}
                    </span>
                    {CHIP_TONES.map((tone) => (
                      <Chip key={tone} variant={variant} tone={tone}>
                        {tone}
                      </Chip>
                    ))}
                  </div>
                ))}
                <Separator />
                <div className="flex flex-wrap items-center gap-2">
                  {['전체', '인기', '신규'].map((f) => (
                    <Chip key={f} selected={filter === f} onClick={() => setFilter(f)}>
                      {f}
                    </Chip>
                  ))}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {tags.map((t) => (
                    <Chip
                      key={t}
                      variant="outline"
                      onDelete={() => setTags(tags.filter((x) => x !== t))}
                    >
                      {t}
                    </Chip>
                  ))}
                  {tags.length < 3 ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setTags(['디자인', '토큰', '컴포넌트'])}
                    >
                      <Plus /> 되돌리기
                    </Button>
                  ) : null}
                </div>
                <Separator />
                <div className="flex flex-wrap items-center gap-2">
                  <span className="w-14 shrink-0 font-mono text-caption text-muted-foreground">
                    badge
                  </span>
                  <Badge>default</Badge>
                  <Badge variant="secondary">secondary</Badge>
                  <Badge variant="destructive">destructive</Badge>
                  <Badge variant="outline">outline</Badge>
                </div>
              </div>
            </CatalogSection>

            <CatalogSection index="06" eyebrow="Form" title="입력 · 선택 컨트롤">
              <div className="grid gap-6 rounded-lg border border-border p-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="ds-input">Input</Label>
                  <Input id="ds-input" placeholder="텍스트를 입력하세요" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ds-input-invalid">Input · invalid</Label>
                  <Input id="ds-input-invalid" aria-invalid placeholder="오류 상태" />
                </div>
                <div className="space-y-2">
                  <Label>InputGroup · 검색</Label>
                  <InputGroup>
                    <InputAddon>
                      <Search />
                    </InputAddon>
                    <Input placeholder="검색어" />
                  </InputGroup>
                </div>
                <div className="space-y-2">
                  <Label>InputGroup · 단위</Label>
                  <InputGroup>
                    <InputAddon>₩</InputAddon>
                    <Input placeholder="0" inputMode="numeric" />
                    <InputAddon>.00</InputAddon>
                  </InputGroup>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>InputGroup · 버튼</Label>
                  <InputGroup>
                    <Input placeholder="이메일 주소" type="email" />
                    <Button size="sm" className="mr-1">
                      구독
                    </Button>
                  </InputGroup>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ds-select">Select</Label>
                  <Select>
                    <SelectTrigger id="ds-select">
                      <SelectValue placeholder="옵션 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="a">옵션 A</SelectItem>
                      <SelectItem value="b">옵션 B</SelectItem>
                      <SelectItem value="c">옵션 C</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ds-textarea">Textarea</Label>
                  <Textarea id="ds-textarea" placeholder="여러 줄 입력" />
                </div>
                <div className="space-y-3">
                  <Label>Checkbox</Label>
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <Checkbox id="ds-check" defaultChecked />
                      <Label htmlFor="ds-check" className="font-normal">
                        동의합니다
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox id="ds-check-d" disabled />
                      <Label htmlFor="ds-check-d" className="font-normal text-muted-foreground">
                        비활성
                      </Label>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <Label>Radio</Label>
                  <RadioGroup defaultValue="one" className="flex gap-4">
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="one" id="ds-r1" />
                      <Label htmlFor="ds-r1" className="font-normal">
                        하나
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="two" id="ds-r2" />
                      <Label htmlFor="ds-r2" className="font-normal">
                        둘
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
                <div className="space-y-3 md:col-span-2">
                  <Label>Switch</Label>
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <Switch id="ds-sw" defaultChecked />
                      <Label htmlFor="ds-sw" className="font-normal">
                        알림 받기
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch id="ds-sw-sm" size="sm" />
                      <Label htmlFor="ds-sw-sm" className="font-normal">
                        작게
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch id="ds-sw-d" disabled defaultChecked />
                      <Label htmlFor="ds-sw-d" className="font-normal text-muted-foreground">
                        비활성
                      </Label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Autocomplete(combobox) — React Aria 엔진. 타이핑 필터 + 키보드 + 선택 표식 */}
              <div className="mt-10">
                <GroupLabel>Autocomplete · 검색 선택</GroupLabel>
                <div className="grid gap-6 rounded-lg border border-border p-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Autocomplete
                      label="좋아하는 과일"
                      placeholder="과일 검색…"
                      onSelectionChange={setFruit}
                    >
                      {FRUITS.map(([key, name]) => (
                        <AutocompleteItem key={key}>{name}</AutocompleteItem>
                      ))}
                    </Autocomplete>
                    <p className="text-caption text-muted-foreground">
                      선택: {fruit ? FRUITS.find(([k]) => k === fruit)?.[1] : '없음'}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Autocomplete
                      label="도시"
                      placeholder="입력해 좁히기…"
                      defaultSelectedKey="seoul"
                    >
                      {[
                        ['seoul', '서울'],
                        ['busan', '부산'],
                        ['incheon', '인천'],
                        ['daegu', '대구'],
                        ['gwangju', '광주'],
                        ['daejeon', '대전'],
                      ].map(([key, name]) => (
                        <AutocompleteItem key={key}>{name}</AutocompleteItem>
                      ))}
                    </Autocomplete>
                  </div>
                </div>
              </div>

              {/* TextField — 컴윗은 라벨 고정(outlined) 하나. 라벨↔컨트롤·도움말·에러 배선은 프리미티브가 책임 */}
              <div className="mt-10 space-y-8">
                <div>
                  <GroupLabel>TextField</GroupLabel>
                  <div className="grid gap-6 rounded-lg border border-border p-6 md:grid-cols-3">
                    <TextField label="이름" helperText="실명을 입력하세요">
                      <Input value={floatName} onChange={(e) => setFloatName(e.target.value)} />
                    </TextField>
                    <TextField label="이메일" required helperText="회사 이메일">
                      <Input
                        type="email"
                        value={floatEmail}
                        onChange={(e) => setFloatEmail(e.target.value)}
                      />
                    </TextField>
                    <TextField label="회사" error="필수 항목입니다">
                      <Input aria-invalid />
                    </TextField>
                    <TextField label="자기소개" className="md:col-span-2">
                      <Textarea value={floatBio} onChange={(e) => setFloatBio(e.target.value)} />
                    </TextField>
                    <TextField label="아이디" disabled helperText="변경할 수 없습니다">
                      <Input defaultValue="token_user" disabled />
                    </TextField>
                  </div>
                </div>
              </div>
            </CatalogSection>

            <CatalogSection index="07" eyebrow="Date" title="날짜 · 시간">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="rounded-lg border border-border p-6">
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-2">
                      <Label>DatePicker</Label>
                      <DatePicker value={date} onChange={setDate} placeholder="날짜" />
                    </div>
                    <div className="space-y-2">
                      <Label>TimePicker</Label>
                      <TimePicker value={time} onChange={setTime} placeholder="시간" />
                    </div>
                    <div className="space-y-2">
                      <Label>MonthPicker</Label>
                      <MonthPicker value={month} onChange={setMonth} placeholder="월" />
                    </div>
                  </div>
                </div>
                <div className="rounded-lg border border-border p-6">
                  <Label className="mb-3 block">Calendar</Label>
                  <Calendar mode="single" selected={day} onSelect={setDay} />
                </div>
              </div>
            </CatalogSection>

            <CatalogSection index="08" eyebrow="Disclosure" title="탭 · 아코디언">
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="rounded-lg border border-border p-6">
                  <Tabs defaultValue="t1">
                    <TabsList>
                      <TabsTrigger value="t1">개요</TabsTrigger>
                      <TabsTrigger value="t2">상세</TabsTrigger>
                      <TabsTrigger value="t3">후기</TabsTrigger>
                    </TabsList>
                    <TabsContent value="t1" className="pt-4 text-body-sm text-muted-foreground">
                      개요 콘텐츠
                    </TabsContent>
                    <TabsContent value="t2" className="pt-4 text-body-sm text-muted-foreground">
                      상세 콘텐츠
                    </TabsContent>
                    <TabsContent value="t3" className="pt-4 text-body-sm text-muted-foreground">
                      후기 콘텐츠
                    </TabsContent>
                  </Tabs>
                </div>
                <div className="rounded-lg border border-border p-6">
                  <Accordion type="single" collapsible>
                    <AccordionItem value="a1">
                      <AccordionTrigger>항목 하나</AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">
                        펼쳐진 콘텐츠 영역입니다.
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="a2">
                      <AccordionTrigger>항목 둘</AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">
                        또 다른 콘텐츠 영역입니다.
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
              </div>
            </CatalogSection>

            <CatalogSection
              index="09"
              eyebrow="Data"
              title="데이터 테이블"
              desc="TanStack Table 기반 서버사이드 페이지네이션. 첫 로딩은 스켈레톤, 재조회는 우상단 스피너, 마지막 부분 페이지는 빈 행으로 패딩해 높이가 흔들리지 않는다."
            >
              <DataTableDemo />
            </CatalogSection>

            <CatalogSection index="10" eyebrow="Feedback" title="다이얼로그 · 토스트">
              <div className="space-y-6 rounded-lg border border-border p-6">
                <div className="flex flex-wrap items-center gap-3">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline">Dialog 열기</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>다이얼로그 제목</DialogTitle>
                        <DialogDescription>모달 본문 설명 텍스트입니다.</DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <DialogClose asChild>
                          <Button variant="ghost">취소</Button>
                        </DialogClose>
                        <DialogClose asChild>
                          <Button>확인</Button>
                        </DialogClose>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  <Button
                    variant="outline"
                    onClick={async () => {
                      const ok = await popup.confirm({ description: '이 작업을 진행할까요?' })
                      toast(ok ? '확인했습니다' : '취소했습니다')
                    }}
                  >
                    popup.confirm
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => popup.alert({ description: '처리가 완료되었습니다.' })}
                  >
                    popup.alert
                  </Button>
                </div>
                <Separator />
                <div className="flex flex-wrap items-center gap-3">
                  {/* status 색은 variant 추가 없이 className 오버라이드(cn=twMerge 로 ghost 위에 status 토큰) */}
                  <Button variant="outline" size="sm" onClick={() => toast('링크를 복사했습니다')}>
                    기본
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="bg-success text-success-foreground hover:bg-success/90"
                    onClick={() => toast.success('성공했습니다')}
                  >
                    success
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={() => toast.error('오류가 발생했습니다')}
                  >
                    error
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="bg-warning text-warning-foreground hover:bg-warning/90"
                    onClick={() => toast.warning('주의가 필요합니다')}
                  >
                    warning
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="bg-info text-info-foreground hover:bg-info/90"
                    onClick={() => toast.info('참고하세요')}
                  >
                    info
                  </Button>
                </div>
              </div>
            </CatalogSection>

            <CatalogSection index="11" eyebrow="Elevation" title="그림자 · 라운드">
              <div className="grid gap-6 sm:grid-cols-2">
                <div
                  className="flex h-24 items-center justify-center rounded-lg bg-card text-caption text-muted-foreground"
                  style={{ boxShadow: 'var(--shadow-card)' }}
                >
                  shadow-card
                </div>
                <div
                  className="flex h-24 items-center justify-center rounded-lg bg-card text-caption text-muted-foreground"
                  style={{ boxShadow: 'var(--shadow-card-hover)' }}
                >
                  shadow-card-hover
                </div>
              </div>
              <Separator className="my-8" />
              <div className="flex flex-wrap items-center gap-6">
                <div className="flex flex-col items-center gap-2">
                  <div className="size-16 rounded-lg border border-border bg-muted" />
                  <span className="font-mono text-caption text-muted-foreground">rounded-lg</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="size-16 rounded-pill border border-border bg-muted" />
                  <span className="font-mono text-caption text-muted-foreground">rounded-pill</span>
                </div>
              </div>
            </CatalogSection>
          </main>
        </div>
      </div>
    </OverrideLab>
  )
}
