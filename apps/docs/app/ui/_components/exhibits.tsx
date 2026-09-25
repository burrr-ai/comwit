'use client'

import * as React from 'react'
import {
  Bell,
  Bookmark,
  Check,
  ChevronRight,
  Compass,
  Ellipsis,
  Heart,
  House,
  MapPin,
  MessageCircle,
  PenLine,
  Phone,
  Search,
  Share,
  SignalHigh,
  SlidersHorizontal,
  Sparkles,
  User,
  Wifi,
  BatteryFull,
} from 'lucide-react'
import { toast } from '@comwit/ui-templates/toast'
import {
  AppBar,
  AppBarActions,
  AppBarBackButton,
  AppBarTitle,
  FloatingBackButton,
  type AppBarBehavior,
} from '@comwit/ui-templates/app-bar'
import { BottomNav, BottomNavItem } from '@comwit/ui-templates/bottom-nav'
import {
  PageBoundary,
  PageTransition,
  drill,
  hero,
  sheet,
  slide,
  type PageTransitionConfig,
} from '@comwit/ui-templates/page-transition'
import {
  BottomSheet,
  BottomSheetClose,
  BottomSheetContent,
  BottomSheetDescription,
  BottomSheetFooter,
  BottomSheetHeader,
  BottomSheetTitle,
} from '@comwit/ui-templates/bottom-sheet'
import { PullToRefresh } from '@comwit/ui-templates/pull-to-refresh'
import {
  Chat,
  ChatBubble,
  ChatComposer,
  ChatDescription,
  ChatDivider,
  ChatHeader,
  ChatHeaderActions,
  ChatMessage,
  ChatMessageMeta,
  ChatMessages,
  ChatTitle,
  ChatTyping,
  type ChatMode,
} from '@comwit/ui-templates/chat'
import { Avatar, AvatarFallback } from '@comwit/ui-templates/avatar'
import { Glass, GlassButton, type GlassVariant } from '@comwit/ui-templates/glass'
import { SegmentedControl } from '@comwit/ui-templates/segmented-control'
import { Button } from '@comwit/ui-templates/button'
import { Chip } from '@comwit/ui-templates/chip'
import { Textarea } from '@comwit/ui-templates/textarea'
import { ScrollChromeProvider } from '@comwit/ui'
import { cn } from '@comwit/ui-templates/lib/utils'

/* ── Device ─────────────────────────────────────────────────────────── */

// 폰 화면 요소. 시트·스크림처럼 body 로 포털되는 오버레이가 기기 안에 뜨도록 `container` 로 넘긴다.
const PhoneScreenContext = React.createContext<HTMLDivElement | null>(null)
export const usePhoneScreen = () => React.useContext(PhoneScreenContext)

export function PhoneFrame({
  children,
  label,
  className,
}: {
  children: React.ReactNode
  label: string
  className?: string
}) {
  const [screen, setScreen] = React.useState<HTMLDivElement | null>(null)
  return (
    <div className={cn('phone', className)} role="group" aria-label={label}>
      <div ref={setScreen} className="phone-screen">
        <div className="phone-status" aria-hidden="true">
          <span>9:41</span>
          <span className="phone-island" />
          <span className="flex items-center gap-1">
            <SignalHigh className="size-3.5" strokeWidth={2.5} />
            <Wifi className="size-3.5" strokeWidth={2.5} />
            <BatteryFull className="size-4" strokeWidth={2} />
          </span>
        </div>
        <PhoneScreenContext.Provider value={screen}>{children}</PhoneScreenContext.Provider>
        <div className="phone-home" aria-hidden="true" />
      </div>
    </div>
  )
}

/**
 * 갤러리 카드 위의 폰 무대 — 모든 폰 전시물이 같은 골격(폰 + 아래 한 줄)을 갖는다.
 * 아래 줄은 높이가 고정이라(h-9) 컨트롤이 오든 캡션이 오든 카드 높이가 같다.
 */
function PhoneStage({
  label,
  footer,
  children,
}: {
  label: string
  footer?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center gap-5">
      <PhoneFrame label={label}>{children}</PhoneFrame>
      {footer !== undefined && (
        <div className="flex h-9 items-center justify-center text-center text-caption text-muted-foreground">
          {footer}
        </div>
      )}
    </div>
  )
}

/** 폰 안의 스크롤러 — 앱바·바텀내비가 같은 스크롤 의도(ScrollChrome)를 본다. */
function PhoneScreen({
  children,
  onRefresh,
  resetKey,
  resetScroll = true,
}: {
  children: React.ReactNode
  onRefresh?: () => Promise<unknown>
  resetKey?: unknown
  /** 페이지 전환이 스크롤을 직접 복원·초기화하는 화면에서는 끈다. */
  resetScroll?: boolean
}) {
  const scrollRef = React.useRef<HTMLDivElement>(null)
  React.useEffect(() => {
    if (resetScroll) scrollRef.current?.scrollTo({ top: 0 })
  }, [resetKey, resetScroll])
  return (
    <ScrollChromeProvider scrollRef={scrollRef} resetKey={resetKey}>
      <PullToRefresh
        ref={scrollRef}
        enabled={Boolean(onRefresh)}
        onRefresh={onRefresh ?? (() => undefined)}
        className="flex flex-col"
      >
        {children}
      </PullToRefresh>
    </ScrollChromeProvider>
  )
}

/* ── Mobile shell — one phone, many pages, no router ────────────────── */

/**
 * 라우터 대신 쓰는 아주 작은 히스토리. path 가 곧 현재 페이지고, push/back 이 스택을 움직인다.
 * 실제 앱에서는 이 자리가 라우터의 pathname 이고 RouteBoundary 가 그 값을 경계에 넣는다.
 */
function useMiniRouter(initial: string) {
  const [stack, setStack] = React.useState<string[]>([initial])
  const path = stack[stack.length - 1]
  const push = React.useCallback((to: string) => setStack((s) => [...s, to]), [])
  const replace = React.useCallback((to: string) => setStack((s) => [...s.slice(0, -1), to]), [])
  const back = React.useCallback(() => setStack((s) => (s.length > 1 ? s.slice(0, -1) : s)), [])
  return { path, push, replace, back }
}

/**
 * 폰 안의 앱 쉘: 스크롤러 + 전환 프로바이더 + 라우트 경계 하나. 여러 페이지가 있다는 전제로 만든 공통 골격이다 —
 * `path` 가 바뀌면 경계(key)가 바뀌고, 나가는 페이지는 엔진이 붙잡아 애니메이션한다. 앱바는 페이지 안에 있어
 * 페이지와 함께 움직인다. 살아남는 탭 쉘은 `routeKey` 를 고정하고 안쪽에 경계를 하나 더 두되, 쉘에는 탭바만 남긴다.
 */
function MobileShell({
  label,
  path,
  routeKey,
  config,
  onRefresh,
  footer,
  children,
}: {
  label: string
  path: string
  routeKey?: string
  config: PageTransitionConfig
  onRefresh?: () => Promise<unknown>
  footer?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <PhoneStage label={label} footer={footer}>
      <PhoneScreen resetKey={path} resetScroll={false} onRefresh={onRefresh}>
        <PageTransition config={config} className="flex min-h-full flex-1 flex-col">
          <PageBoundary
            path={path}
            routeKey={routeKey}
            className="flex min-h-full flex-1 flex-col bg-background"
          >
            {children}
          </PageBoundary>
        </PageTransition>
      </PhoneScreen>
    </PhoneStage>
  )
}

type Tone = 'sunset' | 'sea' | 'forest' | 'dusk'

function Photo({
  tone,
  className,
  children,
  ...props
}: { tone: Tone } & React.ComponentProps<'div'>) {
  return (
    <div data-tone={tone} className={cn('ui-photo', className)} {...props}>
      {children}
    </div>
  )
}

const PLACES: { name: string; area: string; tone: Tone }[] = [
  { name: 'Seongsan sunrise peak', area: 'Jeju', tone: 'sunset' },
  { name: 'Hyeopjae beach', area: 'Jeju', tone: 'sea' },
  { name: 'Bijarim forest', area: 'Jeju', tone: 'forest' },
  { name: 'Night market', area: 'Seogwipo', tone: 'dusk' },
  { name: 'Udo island ferry', area: 'Jeju', tone: 'sea' },
  { name: 'Hallasan trail', area: 'Jeju', tone: 'forest' },
]
const PLACE_ROWS = [...PLACES, ...PLACES]

function PlaceRowText({ place }: { place: (typeof PLACES)[number] }) {
  return (
    <div className="min-w-0 flex-1">
      <p className="truncate text-label font-semibold text-foreground">{place.name}</p>
      <p className="flex items-center gap-1 text-caption text-muted-foreground">
        <MapPin className="size-3" /> {place.area}
      </p>
    </div>
  )
}

function PlaceRow({ place }: { place: (typeof PLACES)[number] }) {
  return (
    <div className="flex items-center gap-3">
      <Photo tone={place.tone} className="size-14 shrink-0 rounded-control" />
      <PlaceRowText place={place} />
    </div>
  )
}

// hero 양 끝의 모서리 반경(px). 엔진은 CSS 반경을 읽지 않으므로 명시해야 전환 중 반경이 보정된다.
const CONTROL_RADIUS = 10 // rounded-control (--radius)
const CARD_RADIUS = 16 // rounded-card (--card-radius)

/** 목록 행 — 누르면 어디로든 간다. heroKey 를 주면 썸네일이 상세로 이어진다. */
function PlaceRowButton({
  place,
  onClick,
  heroKey,
}: {
  place: (typeof PLACES)[number]
  onClick: () => void
  heroKey?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-card px-2 py-2 text-left transition-colors duration-fast hover:bg-accent"
    >
      <Photo
        tone={place.tone}
        className="size-14 shrink-0 rounded-control"
        data-hero-exit-key={heroKey}
        data-hero-radius={heroKey ? CONTROL_RADIUS : undefined}
      />
      <PlaceRowText place={place} />
      <ChevronRight className="size-4 shrink-0 text-subtle-foreground" />
    </button>
  )
}

/* ── App bar ────────────────────────────────────────────────────────── */

type BarMode = AppBarBehavior | 'hero'

export function AppBarExhibit() {
  const [mode, setMode] = React.useState<BarMode>('reveal')
  return (
    <PhoneStage
      label="App bar demo — scroll inside the phone"
      footer={
        <SegmentedControl<BarMode>
          aria-label="App bar behavior"
          value={mode}
          onValueChange={setMode}
          options={[
            { label: 'Reveal', value: 'reveal' },
            { label: 'Pinned', value: 'pinned' },
            { label: 'Flow', value: 'flow' },
            { label: 'Hero', value: 'hero' },
          ]}
        />
      }
    >
      <PhoneScreen resetKey={mode}>
        {mode === 'hero' ? (
          <>
            <FloatingBackButton onClick={() => toast('Back')} style={{ left: 12, top: 46 }} />
            <Photo tone="sunset" className="h-72 shrink-0" />
          </>
        ) : (
          <AppBar behavior={mode}>
            <AppBarBackButton onClick={() => toast('Back')} />
            <AppBarTitle>Jeju in spring</AppBarTitle>
            <AppBarActions>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Share"
                onClick={() => toast('Link copied')}
              >
                <Share />
              </Button>
            </AppBarActions>
          </AppBar>
        )}
        <div className="space-y-5 px-5 pt-3 pb-10">
          {mode !== 'hero' && <Photo tone="sunset" className="h-44 rounded-card" />}
          <div>
            <h4 className="text-title-lg text-foreground">Four days on the island</h4>
            <p className="mt-1.5 text-body-sm text-soft-foreground">
              Scroll down and the bar slides away. Nudge up and it comes straight back.
            </p>
          </div>
          <div className="space-y-4">
            {PLACE_ROWS.map((place, i) => (
              <PlaceRow key={i} place={place} />
            ))}
          </div>
        </div>
      </PhoneScreen>
    </PhoneStage>
  )
}

/* ── Bottom nav ─────────────────────────────────────────────────────── */

// 값은 경로다 — 앱 쉘 전시물에서 페이지 전환 규칙(ordered)이 그대로 매칭한다.
const TABS = [
  { value: '/home', label: 'Home', icon: <House />, tone: 'sunset' as Tone },
  { value: '/explore', label: 'Explore', icon: <Compass />, tone: 'sea' as Tone },
  { value: '/saved', label: 'Saved', icon: <Bookmark />, tone: 'forest' as Tone },
  { value: '/me', label: 'Profile', icon: <User />, tone: 'dusk' as Tone },
]

export function BottomNavExhibit() {
  const [tab, setTab] = React.useState('/home')
  const current = TABS.find((t) => t.value === tab) ?? TABS[0]
  return (
    <PhoneStage
      label="Bottom nav demo — tap a tab, scroll to shrink the bar"
      footer="Tap a tab. Scroll to shrink the bar."
    >
      <PhoneScreen resetKey={tab}>
        <AppBar behavior="flow" glass={false}>
          <AppBarTitle size="lg">{current.label}</AppBarTitle>
          <AppBarActions>
            <Button variant="ghost" size="icon" aria-label="Search">
              <Search />
            </Button>
          </AppBarActions>
        </AppBar>
        <div className="flex-1 space-y-3 px-4 pb-4">
          {Array.from({ length: 7 }, (_, i) => (
            <Photo
              key={i}
              tone={TABS[(TABS.indexOf(current) + i) % TABS.length].tone}
              className="flex h-36 items-end rounded-card p-3"
            >
              <span className="relative z-raised text-label font-semibold text-white drop-shadow">
                {PLACES[i % PLACES.length].name}
              </span>
            </Photo>
          ))}
        </div>
        <BottomNav value={tab} onValueChange={setTab}>
          {TABS.map((t) => (
            <BottomNavItem key={t.value} value={t.value} label={t.label} icon={t.icon} />
          ))}
        </BottomNav>
      </PhoneScreen>
    </PhoneStage>
  )
}

/* ── Page transition ────────────────────────────────────────────────── */

// 같은 두 페이지(목록 ↔ 상세)에 규칙만 바꿔 끼운다 — 세 효과가 그대로 비교된다.
const EFFECTS = { drill: 'Drill', sheet: 'Sheet', hero: 'Hero' } as const
type Effect = keyof typeof EFFECTS

function PlaceListPage({
  onOpen,
  heroKeys,
}: {
  onOpen: (index: number) => void
  heroKeys?: boolean
}) {
  return (
    <>
      <AppBar behavior="reveal">
        <AppBarTitle size="lg">Places</AppBarTitle>
      </AppBar>
      <ul className="px-3 pb-6">
        {PLACE_ROWS.map((p, i) => (
          <li key={i}>
            <PlaceRowButton
              place={p}
              onClick={() => onOpen(i)}
              heroKey={heroKeys ? `place-${i}` : undefined}
            />
          </li>
        ))}
      </ul>
    </>
  )
}

function PlaceDetailPage({
  index,
  onBack,
  variant,
}: {
  index: number
  onBack: () => void
  variant: Effect
}) {
  const place = PLACE_ROWS[index % PLACE_ROWS.length]
  return (
    <>
      {variant === 'sheet' ? (
        <AppBar behavior="pinned" glass={false}>
          <AppBarTitle>{place.name}</AppBarTitle>
          <AppBarActions>
            <AppBarBackButton icon="close" onClick={onBack} />
          </AppBarActions>
        </AppBar>
      ) : (
        <AppBar behavior="reveal">
          <AppBarBackButton onClick={onBack} />
          <AppBarTitle>{place.name}</AppBarTitle>
          <AppBarActions>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Share"
              onClick={() => toast('Link copied')}
            >
              <Share />
            </Button>
          </AppBarActions>
        </AppBar>
      )}
      <Photo
        tone={place.tone}
        className="h-56 shrink-0"
        data-hero-enter-key={variant === 'hero' ? `place-${index}` : undefined}
        data-hero-radius={variant === 'hero' ? 0 : undefined}
      />
      <div className="space-y-4 px-5 pt-4 pb-8">
        <div>
          <h4 className="text-title-lg text-foreground">{place.name}</h4>
          <p className="mt-1 flex items-center gap-1 text-caption text-muted-foreground">
            <MapPin className="size-3" /> {place.area}
          </p>
        </div>
        <p className="text-body-sm text-soft-foreground">
          {variant === 'hero'
            ? 'The photo came along from the row. Everything else faded in around it.'
            : variant === 'sheet'
              ? 'The list is still underneath, dimmed and blurred. Close this and it is exactly where you left it.'
              : 'The list you came from is still there underneath. Go back and it is exactly where you left it.'}
        </p>
        {PLACES.filter((p) => p !== place)
          .slice(0, 3)
          .map((p) => (
            <PlaceRow key={p.name} place={p} />
          ))}
      </div>
    </>
  )
}

export function PageTransitionExhibit() {
  const [effect, setEffect] = React.useState<Effect>('drill')
  const router = useMiniRouter('/places')
  const index = router.path.startsWith('/places/')
    ? Number(router.path.slice('/places/'.length))
    : null

  const config = React.useMemo<PageTransitionConfig>(
    () => ({
      transitions: [
        effect === 'hero'
          ? // the element keyed data-hero-exit-key on the list and data-hero-enter-key on the detail morphs across
            {
              from: '/places',
              to: '/places/*',
              transition: hero({ type: 'fade', variant: 'smooth' }),
            }
          : // list → detail: entering /places/* is forward, leaving is backward
            {
              on: '/places/**',
              except: '/places',
              transition: effect === 'sheet' ? sheet({ type: 'blur' }) : drill(),
            },
      ],
    }),
    [effect]
  )

  return (
    <MobileShell
      label="Page transition demo — open a place, then go back"
      path={router.path}
      config={config}
      footer={
        <SegmentedControl<Effect>
          aria-label="List to detail effect"
          value={effect}
          onValueChange={setEffect}
          options={(Object.keys(EFFECTS) as Effect[]).map((key) => ({
            label: EFFECTS[key],
            value: key,
          }))}
        />
      }
    >
      {index === null ? (
        <PlaceListPage onOpen={(i) => router.push(`/places/${i}`)} heroKeys={effect === 'hero'} />
      ) : (
        <PlaceDetailPage index={index} onBack={router.back} variant={effect} />
      )}
    </MobileShell>
  )
}

/* ── Bottom sheet ───────────────────────────────────────────────────── */

const AREAS = ['Jeju', 'Seogwipo', 'Udo', 'Hallim']
const SORTS = ['Closest first', 'Top rated', 'Newest', 'Most saved']
const NO_TRANSITIONS: PageTransitionConfig = { transitions: [] }

export function BottomSheetExhibit() {
  return (
    <MobileShell
      label="Bottom sheet demo — open the filters, then drag the handle down"
      path="/places"
      config={NO_TRANSITIONS}
      footer="Open the filters. Drag the handle down, or tap it, to close."
    >
      <BottomSheetScreen />
    </MobileShell>
  )
}

/** 시트는 body 가 아니라 폰 화면으로 포털된다 — 스크림도 기기 안에서만 어두워진다. */
function BottomSheetScreen() {
  const screen = usePhoneScreen()
  const [filters, setFilters] = React.useState(false)
  const [areas, setAreas] = React.useState<string[]>(['Jeju'])
  const [sort, setSort] = React.useState(SORTS[0])
  const [actionFor, setActionFor] = React.useState<number | null>(null)
  const target = actionFor === null ? null : PLACE_ROWS[actionFor % PLACE_ROWS.length]
  const toggleArea = (area: string) =>
    setAreas((list) => (list.includes(area) ? list.filter((a) => a !== area) : [...list, area]))
  return (
    <>
      <AppBar behavior="pinned">
        <AppBarTitle size="lg">Places</AppBarTitle>
        <AppBarActions>
          <Button variant="ghost" size="icon" aria-label="Filters" onClick={() => setFilters(true)}>
            <SlidersHorizontal />
          </Button>
        </AppBarActions>
      </AppBar>
      {/* 스크롤러의 flex 열 안이라 shrink-0 — 안 주면 긴 목록에 눌려 칩이 잘린다 */}
      <div className="flex shrink-0 gap-2 overflow-x-clip px-4 pb-3">
        {AREAS.map((area) => (
          <Chip
            key={area}
            size="sm"
            selected={areas.includes(area)}
            onClick={() => toggleArea(area)}
          >
            {area}
          </Chip>
        ))}
      </div>
      <ul className="px-3 pb-6">
        {PLACE_ROWS.map((p, i) => (
          <li key={i} className="flex items-center gap-1 rounded-card px-2 py-2">
            <PlaceRow place={p} />
            <Button
              variant="ghost"
              size="icon"
              aria-label={`More about ${p.name}`}
              onClick={() => setActionFor(i)}
            >
              <Ellipsis />
            </Button>
          </li>
        ))}
      </ul>

      <BottomSheet open={filters} onOpenChange={setFilters}>
        <BottomSheetContent container={screen ?? undefined}>
          <BottomSheetHeader>
            <BottomSheetTitle>Filters</BottomSheetTitle>
            <BottomSheetDescription>Drag the handle down to dismiss.</BottomSheetDescription>
          </BottomSheetHeader>
          <div className="phone-scroll min-h-0 flex-1 space-y-5 overflow-y-auto px-5 pb-2">
            <section>
              <p className="mb-2 text-caption font-semibold text-muted-foreground">Area</p>
              <div className="flex flex-wrap gap-2">
                {AREAS.map((area) => (
                  <Chip
                    key={area}
                    size="sm"
                    selected={areas.includes(area)}
                    onClick={() => toggleArea(area)}
                  >
                    {area}
                  </Chip>
                ))}
              </div>
            </section>
            <section>
              <p className="mb-1 text-caption font-semibold text-muted-foreground">Sort by</p>
              <ul className="-mx-2">
                {SORTS.map((option) => (
                  <li key={option}>
                    <button
                      type="button"
                      onClick={() => setSort(option)}
                      className="flex w-full items-center justify-between rounded-control px-2 py-2.5 text-left text-label text-foreground transition-colors duration-fast hover:bg-accent"
                    >
                      {option}
                      {option === sort ? <Check className="size-4 text-primary" /> : null}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          </div>
          <BottomSheetFooter>
            <Button
              onClick={() => {
                setFilters(false)
                toast.success(`${areas.length ? areas.join(', ') : 'Everywhere'} · ${sort}`)
              }}
            >
              Show places
            </Button>
          </BottomSheetFooter>
        </BottomSheetContent>
      </BottomSheet>

      <BottomSheet open={actionFor !== null} onOpenChange={(open) => !open && setActionFor(null)}>
        <BottomSheetContent container={screen ?? undefined}>
          {target ? (
            <>
              <BottomSheetHeader>
                <BottomSheetTitle>{target.name}</BottomSheetTitle>
                <BottomSheetDescription>{target.area}</BottomSheetDescription>
              </BottomSheetHeader>
              <div className="grid gap-1 px-3 pb-4">
                {(
                  [
                    ['Share', Share],
                    ['Save', Bookmark],
                    ['Directions', MapPin],
                  ] as const
                ).map(([label, Icon]) => (
                  <BottomSheetClose key={label} asChild>
                    <Button
                      variant="ghost"
                      className="justify-start"
                      onClick={() => toast(`${label} · ${target.name}`)}
                    >
                      <Icon />
                      {label}
                    </Button>
                  </BottomSheetClose>
                ))}
              </div>
            </>
          ) : null}
        </BottomSheetContent>
      </BottomSheet>
    </>
  )
}

/* ── Pull to refresh ────────────────────────────────────────────────── */

type Note = { id: number; who: string; text: string; time: string; tone: Tone; unread: boolean }

const NOTES: Omit<Note, 'id'>[] = [
  { who: 'Mina', text: 'liked your photo from Hyeopjae', time: '2m', tone: 'sea', unread: true },
  { who: 'Joon', text: 'commented: “Save me a seat!”', time: '14m', tone: 'sunset', unread: true },
  { who: 'Travel club', text: 'posted a new itinerary', time: '1h', tone: 'forest', unread: false },
  { who: 'Sora', text: 'started following you', time: '3h', tone: 'dusk', unread: false },
  { who: 'Hana', text: 'shared “Night market” with you', time: '5h', tone: 'dusk', unread: false },
  { who: 'Minjae', text: 'mentioned you in a review', time: '1d', tone: 'sunset', unread: false },
  { who: 'Yuna', text: 'liked your comment', time: '2d', tone: 'sea', unread: false },
  {
    who: 'Travel club',
    text: 'invited you to Busan weekend',
    time: '3d',
    tone: 'forest',
    unread: false,
  },
]
const INCOMING: Omit<Note, 'id'>[] = [
  {
    who: 'Daeun',
    text: 'replied: “Sunrise was unreal”',
    time: 'now',
    tone: 'sunset',
    unread: true,
  },
  { who: 'Joon', text: 'added you to “Jeju spring”', time: 'now', tone: 'sea', unread: true },
  { who: 'Mina', text: 'liked your story', time: 'now', tone: 'dusk', unread: true },
]

export function PullToRefreshExhibit() {
  const [notes, setNotes] = React.useState<Note[]>(() => NOTES.map((n, id) => ({ ...n, id })))
  const next = React.useRef(0)
  const refresh = () =>
    new Promise<void>((done) =>
      setTimeout(() => {
        const incoming = INCOMING[next.current % INCOMING.length]
        next.current += 1
        setNotes((list) => [{ ...incoming, id: Date.now() }, ...list])
        done()
      }, 1100)
    )
  return (
    <PhoneStage
      label="Pull to refresh demo — drag down from the top"
      footer="Drag down from the top with a finger or the mouse."
    >
      <PhoneScreen onRefresh={refresh}>
        <AppBar behavior="pinned">
          <AppBarTitle size="lg">Activity</AppBarTitle>
          <AppBarActions>
            <Button variant="ghost" size="icon" aria-label="Messages">
              <MessageCircle />
            </Button>
          </AppBarActions>
        </AppBar>
        <ul className="px-4 pb-8">
          {notes.map((note) => (
            <li
              key={note.id}
              className="flex items-center gap-3 border-b border-border py-3 last:border-0 animate-in fade-in-0 slide-in-from-top-2"
            >
              <Photo tone={note.tone} className="size-10 shrink-0 rounded-full" />
              <p className="min-w-0 flex-1 text-body-sm text-soft-foreground">
                <span className="font-semibold text-foreground">{note.who}</span> {note.text}
                <span className="ml-1 text-caption text-subtle-foreground">{note.time}</span>
              </p>
              {note.unread && (
                <span className="size-2 shrink-0 rounded-full bg-primary" aria-label="Unread" />
              )}
            </li>
          ))}
        </ul>
      </PhoneScreen>
    </PhoneStage>
  )
}

/* ── Glass ──────────────────────────────────────────────────────────── */

const MATERIALS: { variant: GlassVariant; name: string; use: string }[] = [
  { variant: 'morphing', name: 'Morphing', use: 'Menus, tab bar, floating buttons' },
  { variant: 'blur', name: 'Blur', use: 'Strong full-surface blur' },
  { variant: 'frosted', name: 'Frosted', use: 'Cards over photos' },
  { variant: 'fade', name: 'Fade', use: 'App bars — no edge line' },
]

/** 유리 재질 4종을 굴절이 잘 보이는 사진 위에 띄운다. 알약 렌즈는 끌어서(또는 ←/→) 움직인다. */
export function GlassExhibit() {
  const track = React.useRef<HTMLDivElement>(null)
  const [x, setX] = React.useState(0.5)
  const grab = React.useRef<{ id: number; offset: number } | null>(null)
  const clamp = (v: number) => Math.min(0.88, Math.max(0.12, v))

  return (
    <Photo tone="sunset" className="w-full rounded-card">
      <div className="relative z-raised p-5 sm:p-8">
        <p
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 text-center text-[clamp(56px,11vw,132px)] leading-none font-bold tracking-tight text-white/85 select-none"
        >
          Refract
        </p>
        <div className="relative grid grid-cols-2 gap-3 md:grid-cols-4">
          {MATERIALS.map((m) => (
            <div
              key={m.variant}
              className="relative isolate flex h-36 flex-col justify-end rounded-card p-4"
            >
              <Glass variant={m.variant} shape="panel" />
              <span className="relative z-raised text-title-sm text-foreground">{m.name}</span>
              <span className="relative z-raised text-caption text-soft-foreground">{m.use}</span>
            </div>
          ))}
        </div>
        <div ref={track} className="relative mt-24 h-16 sm:mt-28">
          <GlassButton
            aria-label="Glass lens. Drag it, or use the left and right arrow keys."
            className="absolute top-1/2 h-14 w-40 -translate-x-1/2 -translate-y-1/2 cursor-grab touch-none text-label font-semibold active:cursor-grabbing"
            style={{ left: `${x * 100}%` }}
            onPointerDown={(e) => {
              const rect = e.currentTarget.getBoundingClientRect()
              grab.current = { id: e.pointerId, offset: e.clientX - (rect.left + rect.width / 2) }
              e.currentTarget.setPointerCapture(e.pointerId)
            }}
            onPointerMove={(e) => {
              const box = track.current?.getBoundingClientRect()
              if (!grab.current || grab.current.id !== e.pointerId || !box) return
              setX(clamp((e.clientX - grab.current.offset - box.left) / box.width))
            }}
            onPointerUp={() => (grab.current = null)}
            onPointerCancel={() => (grab.current = null)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowLeft') setX((v) => clamp(v - 0.05))
              if (e.key === 'ArrowRight') setX((v) => clamp(v + 0.05))
            }}
          >
            <Heart className="size-4" /> Drag me
          </GlassButton>
        </div>
      </div>
    </Photo>
  )
}

/* ── Overview hero — the whole shell in one phone ──────────────────── */

// 쉘의 전환 규칙 — 탭은 순서대로 슬라이드, 행을 열면 상세가 쉘 전체 위로 드릴인, 홈의 사진은 hero 로 이어지고,
// 글쓰기는 시트로 뜬다. 뒤로가기는 각각을 거꾸로 돈다.
const SHELL_TRANSITIONS: PageTransitionConfig = {
  transitions: [
    { on: '/p/**', transition: drill() },
    { from: '/home', to: '/photo/*', transition: hero({ type: 'fade', variant: 'smooth' }) },
    { on: '/compose', transition: sheet({ type: 'blur' }) },
    { ordered: TABS.map((t) => t.value), transition: slide() },
  ],
}

const isTab = (path: string) => TABS.some((t) => t.value === path)

export function AppShellExhibit() {
  const router = useMiniRouter('/home')
  const { path } = router
  const [liked, setLiked] = React.useState(false)
  const placeIndex = /^\/(p|photo)\//.test(path) ? Number(path.split('/')[2]) : null
  const place = placeIndex === null ? null : PLACES[placeIndex % PLACES.length]
  const refresh = () =>
    new Promise<void>((done) =>
      setTimeout(() => {
        toast.success('Feed updated')
        done()
      }, 900)
    )

  return (
    <MobileShell
      label="Comwit UI app shell — scroll, pull, switch tabs, open a photo, write a post"
      path={path}
      // 탭들은 한 쉘(고정 키)을 공유한다 — 앱바·탭바가 살아남고 안쪽 경계만 슬라이드한다.
      routeKey={isTab(path) ? 'tabs' : undefined}
      config={SHELL_TRANSITIONS}
      onRefresh={refresh}
    >
      {path === '/compose' ? (
        <ComposePage onClose={router.back} />
      ) : place && placeIndex !== null && path.startsWith('/photo/') ? (
        <PhotoPage place={place} index={placeIndex} onBack={router.back} />
      ) : place ? (
        <PlacePage place={place} onBack={router.back} />
      ) : (
        <TabsLayout
          tab={path}
          onTabChange={router.replace}
          onOpenPlace={(i) => router.push(`/p/${i}`)}
          onOpenPhoto={(i) => router.push(`/photo/${i}`)}
          onCompose={() => router.push('/compose')}
          liked={liked}
          onLike={() => setLiked((v) => !v)}
        />
      )}
    </MobileShell>
  )
}

// 임시 작업 — 시트로 올라오고, 뒤의 쉘은 물러나 흐려진다.
function ComposePage({ onClose }: { onClose: () => void }) {
  return (
    <>
      <AppBar behavior="pinned" glass={false}>
        <AppBarTitle>New post</AppBarTitle>
        <AppBarActions>
          <AppBarBackButton icon="close" onClick={onClose} />
        </AppBarActions>
      </AppBar>
      <div className="flex flex-1 flex-col gap-3 px-4 pb-6">
        <Textarea placeholder="Where did you go today?" className="min-h-40 flex-1" />
        <Button
          onClick={() => {
            toast.success('Posted')
            onClose()
          }}
        >
          Post
        </Button>
      </div>
    </>
  )
}

// 홈 카드의 사진이 그대로 이어진다(hero) — 같은 키를 단 요소가 두 페이지를 잇고 나머지는 페이드한다.
function PhotoPage({
  place,
  index,
  onBack,
}: {
  place: (typeof PLACES)[number]
  index: number
  onBack: () => void
}) {
  return (
    <>
      <FloatingBackButton onClick={onBack} style={{ left: 12, top: 46 }} />
      <Photo
        tone={place.tone}
        className="h-72 shrink-0"
        data-hero-enter-key={`photo-${index}`}
        data-hero-radius={0}
      />
      <div className="space-y-4 px-5 pt-4 pb-8">
        <div>
          <h4 className="text-title-lg text-foreground">{place.name}</h4>
          <p className="mt-1 flex items-center gap-1 text-caption text-muted-foreground">
            <MapPin className="size-3" /> {place.area}
          </p>
        </div>
        <p className="text-body-sm text-soft-foreground">
          The photo travelled here from its card. Go back and it settles into the feed again.
        </p>
        <div className="flex gap-2">
          {['Save', 'Directions', 'Hours'].map((c) => (
            <Chip key={c} size="sm" onClick={() => toast(c)}>
              {c}
            </Chip>
          ))}
        </div>
        {PLACES.filter((p) => p !== place)
          .slice(0, 3)
          .map((p) => (
            <PlaceRow key={p.name} place={p} />
          ))}
      </div>
    </>
  )
}

// 상세는 탭 쉘 밖의 라우트 — 바깥 경계의 key 가 바뀌어 앱바·탭바까지 함께 드릴인한다.
function PlacePage({ place, onBack }: { place: (typeof PLACES)[number]; onBack: () => void }) {
  return (
    <>
      <AppBar behavior="reveal">
        <AppBarBackButton onClick={onBack} />
        <AppBarTitle>{place.name}</AppBarTitle>
        <AppBarActions>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Share"
            onClick={() => toast('Link copied')}
          >
            <Share />
          </Button>
        </AppBarActions>
      </AppBar>
      <Photo tone={place.tone} className="h-60 shrink-0" />
      <div className="space-y-4 px-5 pt-4 pb-8">
        <div>
          <h4 className="text-title-lg text-foreground">{place.name}</h4>
          <p className="mt-1 flex items-center gap-1 text-caption text-muted-foreground">
            <MapPin className="size-3" /> {place.area}
          </p>
        </div>
        <p className="text-body-sm text-soft-foreground">
          Drilled in over the whole shell. Go back and the list is still scrolled where you left it.
        </p>
        <div className="flex gap-2">
          {['Save', 'Directions', 'Hours'].map((c) => (
            <Chip key={c} size="sm" onClick={() => toast(c)}>
              {c}
            </Chip>
          ))}
        </div>
        {PLACES.filter((p) => p !== place)
          .slice(0, 3)
          .map((p) => (
            <PlaceRow key={p.name} place={p} />
          ))}
      </div>
    </>
  )
}

// 탭 쉘 — 탭바만 살아남고, 페이지(앱바 포함)가 탭 순서대로 슬라이드한다. 앱바는 페이지 안에 있으니 페이지와
// 함께 움직이고, 안쪽 경계 위에는 아무것도 없어 나가는 페이지가 정확히 제자리에 머문다.
function TabsLayout({
  tab,
  onTabChange,
  onOpenPlace,
  onOpenPhoto,
  onCompose,
  liked,
  onLike,
}: {
  tab: string
  onTabChange: (tab: string) => void
  onOpenPlace: (index: number) => void
  onOpenPhoto: (index: number) => void
  onCompose: () => void
  liked: boolean
  onLike: () => void
}) {
  const current = TABS.find((t) => t.value === tab) ?? TABS[0]
  return (
    <>
      <PageBoundary path={tab} className="flex min-h-full flex-1 flex-col bg-background">
        <AppBar behavior="reveal">
          <AppBarTitle size="lg">{current.label}</AppBarTitle>
          <AppBarActions>
            <Button variant="ghost" size="icon" aria-label="New post" onClick={onCompose}>
              <PenLine />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Notifications"
              onClick={() => toast('No new notifications')}
            >
              <Bell />
            </Button>
          </AppBarActions>
        </AppBar>
        <div className="flex-1 space-y-4 px-4 pb-4">
          {tab === '/home' ? (
            <>
              <div className="flex gap-2 overflow-x-clip">
                {['For you', 'Nearby', 'Trending'].map((c, i) => (
                  <Chip key={c} size="sm" selected={i === 0} onClick={() => toast(c)}>
                    {c}
                  </Chip>
                ))}
              </div>
              {PLACES.map((p, i) => (
                <div key={i} className="overflow-hidden rounded-card bg-card shadow-card">
                  {/* 사진을 누르면 hero — 이 요소가 상세의 사진으로 이어진다 */}
                  <button
                    type="button"
                    aria-label={`Open photo of ${p.name}`}
                    onClick={() => onOpenPhoto(i)}
                    className="block w-full text-left"
                  >
                    <Photo
                      tone={p.tone}
                      className="h-40"
                      data-hero-exit-key={`photo-${i}`}
                      data-hero-radius={CARD_RADIUS}
                    />
                  </button>
                  <div className="flex items-center justify-between gap-3 p-3">
                    {/* 제목을 누르면 drill — 상세가 쉘 위로 밀려 들어온다 */}
                    <button
                      type="button"
                      onClick={() => onOpenPlace(i)}
                      className="flex min-w-0 flex-1 text-left"
                    >
                      <PlaceRowText place={p} />
                    </button>
                    <GlassButton
                      shape="circle"
                      shadow={false}
                      aria-label="Like"
                      aria-pressed={i === 0 && liked}
                      onClick={() => i === 0 && onLike()}
                      className="size-10 shrink-0"
                    >
                      <Heart
                        className={cn(
                          'size-4',
                          i === 0 && liked && 'fill-destructive text-destructive'
                        )}
                      />
                    </GlassButton>
                  </div>
                </div>
              ))}
            </>
          ) : (
            <ul className="-mx-2">
              {(tab === '/explore' ? PLACE_ROWS : PLACES.slice(0, 3)).map((p, i) => (
                <li key={i}>
                  <PlaceRowButton place={p} onClick={() => onOpenPlace(i)} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </PageBoundary>
      <BottomNav value={tab} onValueChange={onTabChange}>
        {TABS.map((t) => (
          <BottomNavItem key={t.value} value={t.value} label={t.label} icon={t.icon} />
        ))}
      </BottomNav>
    </>
  )
}

/* ── Chat ───────────────────────────────────────────────────────────── */

type ChatNote = { id: number; from: 'me' | 'ava' | 'system'; text: string; time?: string }
type ChatTurn = { id: number; role: 'user' | 'assistant'; text: string }

const CHAT_THREAD: ChatNote[] = [
  { id: 1, from: 'system', text: 'Yesterday' },
  { id: 2, from: 'ava', text: 'Are we still on for the coast road on Saturday?', time: '6:10 PM' },
  { id: 3, from: 'me', text: 'Yes! I booked the car for 9.', time: '6:12 PM' },
  {
    id: 4,
    from: 'ava',
    text: 'Perfect. I found a noodle place near the harbor that opens at eleven.',
    time: '6:12 PM',
  },
  { id: 5, from: 'me', text: 'Send me the pin?', time: '6:14 PM' },
  { id: 6, from: 'ava', text: 'Sent. It is the one with the blue roof.', time: '6:15 PM' },
  { id: 7, from: 'system', text: 'Today' },
  {
    id: 8,
    from: 'ava',
    text: 'Morning! Weather looks clear until the afternoon.',
    time: '8:02 AM',
  },
  { id: 9, from: 'me', text: 'Great, I will bring the good camera.', time: '8:05 AM' },
  { id: 10, from: 'ava', text: 'And one book too many, knowing you.', time: '8:05 AM' },
  { id: 11, from: 'me', text: 'Two, actually.', time: '8:06 AM' },
]
const CHAT_REPLIES = [
  'Ha. See you at nine then.',
  'I will grab coffee for both of us on the way.',
  'Sunrise peak first, then the harbor?',
  'Sounds good to me.',
]
const CHAT_ANSWER =
  'Day one is the east: land, pick up the car and drive to Seongsan for the sunrise peak the next morning, so stay nearby. Day two is Hallasan by the Yeongsil trail, which is the shorter route with the better views, and grilled black pork in the evening. Day three is the west coast: the Suwolbong cliffs, a slow lunch of abalone porridge in Hallim, and the flight home from Jeju City.'
const clock = () => new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })

function MessengerScreen() {
  const [messages, setMessages] = React.useState<ChatNote[]>(CHAT_THREAD)
  const [typing, setTyping] = React.useState(false)
  const next = React.useRef(0)
  const timer = React.useRef(0)
  React.useEffect(() => () => window.clearTimeout(timer.current), [])
  const send = (text: string) => {
    setMessages((m) => [...m, { id: Date.now(), from: 'me', text, time: clock() }])
    setTyping(true)
    timer.current = window.setTimeout(() => {
      setTyping(false)
      setMessages((m) => [
        ...m,
        {
          id: Date.now(),
          from: 'ava',
          text: CHAT_REPLIES[next.current++ % CHAT_REPLIES.length],
          time: clock(),
        },
      ])
    }, 1200)
  }
  const ava = (
    <Avatar className="size-7">
      <AvatarFallback>AC</AvatarFallback>
    </Avatar>
  )
  return (
    <Chat mode="messenger" className="h-auto flex-1">
      <ChatHeader>
        <Avatar>
          <AvatarFallback>AC</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <ChatTitle>Ava Chen</ChatTitle>
          <ChatDescription>Active now</ChatDescription>
        </div>
        <ChatHeaderActions>
          <Button variant="ghost" size="icon" aria-label="Call">
            <Phone />
          </Button>
        </ChatHeaderActions>
      </ChatHeader>
      <ChatMessages
        items={messages}
        isOwn={(m) => m.from === 'me'}
        footer={
          typing ? (
            <ChatMessage avatar={ava}>
              <ChatTyping />
            </ChatMessage>
          ) : null
        }
      >
        {(m) =>
          m.from === 'system' ? (
            <ChatDivider>{m.text}</ChatDivider>
          ) : (
            <ChatMessage
              align={m.from === 'me' ? 'end' : 'start'}
              avatar={m.from === 'ava' ? ava : undefined}
            >
              <ChatBubble>{m.text}</ChatBubble>
              <ChatMessageMeta>{m.time}</ChatMessageMeta>
            </ChatMessage>
          )
        }
      </ChatMessages>
      <ChatComposer placeholder="Message Ava" onSend={send} className="pb-7" />
    </Chat>
  )
}

function AssistantScreen() {
  const [turns, setTurns] = React.useState<ChatTurn[]>([
    {
      id: 1,
      role: 'user',
      text: 'Plan three days in Jeju for two people who like hiking and seafood.',
    },
    { id: 2, role: 'assistant', text: CHAT_ANSWER },
  ])
  const [pending, setPending] = React.useState(false)
  const timer = React.useRef(0)
  const stop = React.useCallback(() => {
    window.clearInterval(timer.current)
    window.clearTimeout(timer.current)
    setPending(false)
  }, [])
  React.useEffect(() => stop, [stop])
  const send = (text: string) => {
    const id = Date.now()
    setTurns((t) => [...t, { id, role: 'user', text }])
    setPending(true)
    const words = CHAT_ANSWER.split(' ')
    let count = 0
    timer.current = window.setTimeout(() => {
      setTurns((t) => [...t, { id: id + 1, role: 'assistant', text: '' }])
      timer.current = window.setInterval(() => {
        count += 1
        setTurns((t) =>
          t.map((m) => (m.id === id + 1 ? { ...m, text: words.slice(0, count).join(' ') } : m))
        )
        if (count >= words.length) stop()
      }, 45)
    }, 700)
  }
  const waiting = pending && turns[turns.length - 1]?.role === 'user'
  return (
    <Chat mode="assistant" className="h-auto flex-1">
      <ChatHeader>
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-surface text-primary-ink">
          <Sparkles className="size-4" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <ChatTitle>Trip planner</ChatTitle>
          <ChatDescription>Your message rises, the answer streams</ChatDescription>
        </div>
      </ChatHeader>
      <ChatMessages
        items={turns}
        footer={
          waiting ? (
            <ChatMessage>
              <ChatTyping />
            </ChatMessage>
          ) : null
        }
      >
        {(turn) => (
          <ChatMessage align={turn.role === 'user' ? 'end' : 'start'}>
            <ChatBubble>{turn.text}</ChatBubble>
          </ChatMessage>
        )}
      </ChatMessages>
      <ChatComposer
        placeholder="Ask anything"
        onSend={send}
        pending={pending}
        onStop={stop}
        className="pb-7"
      />
    </Chat>
  )
}

/** 두 스크롤 모드를 한 폰에서 — 메신저(바닥 고정)와 어시스턴트(내 메시지 상단 고정 + 스트리밍). */
export function ChatExhibit() {
  const [mode, setMode] = React.useState<ChatMode>('messenger')
  return (
    <PhoneStage
      label="Chat demo — send a message"
      footer={
        <SegmentedControl
          value={mode}
          onValueChange={(v) => setMode(v as ChatMode)}
          options={[
            { value: 'messenger', label: 'Messenger' },
            { value: 'assistant', label: 'Assistant' },
          ]}
          aria-label="Chat mode"
        />
      }
    >
      {mode === 'messenger' ? <MessengerScreen /> : <AssistantScreen />}
    </PhoneStage>
  )
}

/** 갤러리 카드에서 스펙 예시 대신 쓰는 전시물 */
export const EXHIBITS: Record<string, React.ComponentType> = {
  'app-bar': AppBarExhibit,
  'bottom-nav': BottomNavExhibit,
  'page-transition': PageTransitionExhibit,
  'bottom-sheet': BottomSheetExhibit,
  'pull-to-refresh': PullToRefreshExhibit,
  chat: ChatExhibit,
  glass: GlassExhibit,
}
