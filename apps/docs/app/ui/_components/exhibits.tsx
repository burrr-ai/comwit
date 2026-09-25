'use client'

import * as React from 'react'
import {
  Bell,
  Bookmark,
  ChevronRight,
  Compass,
  Heart,
  House,
  MapPin,
  MessageCircle,
  PenLine,
  Phone,
  Search,
  Share,
  SignalHigh,
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
  fade,
  sheet,
  slide,
  type PageTransitionConfig,
} from '@comwit/ui-templates/page-transition'
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
import { ScrollChromeProvider } from '@comwit/ui-templates/hooks'
import { cn } from '@comwit/ui-templates/lib/utils'

/* ── Device ─────────────────────────────────────────────────────────── */

export function PhoneFrame({
  children,
  label,
  className,
}: {
  children: React.ReactNode
  label: string
  className?: string
}) {
  return (
    <div className={cn('phone', className)} role="group" aria-label={label}>
      <div className="phone-screen">
        <div className="phone-status" aria-hidden="true">
          <span>9:41</span>
          <span className="phone-island" />
          <span className="flex items-center gap-1">
            <SignalHigh className="size-3.5" strokeWidth={2.5} />
            <Wifi className="size-3.5" strokeWidth={2.5} />
            <BatteryFull className="size-4" strokeWidth={2} />
          </span>
        </div>
        {children}
        <div className="phone-home" aria-hidden="true" />
      </div>
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

type Tone = 'sunset' | 'sea' | 'forest' | 'dusk'

function Photo({
  tone,
  className,
  children,
}: {
  tone: Tone
  className?: string
  children?: React.ReactNode
}) {
  return (
    <div data-tone={tone} className={cn('ui-photo', className)}>
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

function PlaceRow({ place }: { place: (typeof PLACES)[number] }) {
  return (
    <div className="flex items-center gap-3">
      <Photo tone={place.tone} className="size-14 shrink-0 rounded-control" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-label font-semibold text-foreground">{place.name}</p>
        <p className="flex items-center gap-1 text-caption text-muted-foreground">
          <MapPin className="size-3" /> {place.area}
        </p>
      </div>
    </div>
  )
}

/* ── App bar ────────────────────────────────────────────────────────── */

type BarMode = AppBarBehavior | 'hero'

export function AppBarExhibit() {
  const [mode, setMode] = React.useState<BarMode>('reveal')
  return (
    <div className="flex flex-col items-center gap-5">
      <PhoneFrame label="App bar demo — scroll inside the phone">
        <PhoneScreen resetKey={mode}>
          {mode === 'hero' ? (
            <>
              <FloatingBackButton onClick={() => toast('Back')} style={{ left: 22, top: 56 }} />
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
              {[...PLACES, ...PLACES].map((place, i) => (
                <PlaceRow key={i} place={place} />
              ))}
            </div>
          </div>
        </PhoneScreen>
      </PhoneFrame>
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
    </div>
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
    <div className="flex flex-col items-center gap-5">
      <PhoneFrame label="Bottom nav demo — tap a tab, scroll to shrink the bar">
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
      </PhoneFrame>
      <p className="text-caption text-muted-foreground">Tap a tab. Scroll to shrink the bar.</p>
    </div>
  )
}

/* ── Page transition ────────────────────────────────────────────────── */

// A state stack stands in for the router: the last entry is the current path.
const EFFECTS = {
  parallax: { label: 'Drill', make: () => drill() },
  slide: { label: 'Drill · slide', make: () => drill({ type: 'slide' }) },
  fade: { label: 'Fade', make: () => fade() },
} as const
type Effect = keyof typeof EFFECTS

export function PageTransitionExhibit() {
  const [effect, setEffect] = React.useState<Effect>('parallax')
  const [stack, setStack] = React.useState<string[]>(['/places'])
  const path = stack[stack.length - 1]
  const push = (next: string) => setStack((s) => [...s, next])
  const back = () => setStack((s) => (s.length > 1 ? s.slice(0, -1) : s))
  // 리뷰 화면은 스택에서 바로 아래의 상세(/places/:i)가 대상이다.
  const placePath = [...stack].reverse().find((p) => p.startsWith('/places/'))
  const place = PLACES[Number(placePath?.split('/')[2] ?? 0) % PLACES.length]

  const config = React.useMemo<PageTransitionConfig>(
    () => ({
      transitions: [
        // list → detail: entering /places/* is forward, leaving is backward
        { on: '/places/**', except: '/places', transition: EFFECTS[effect].make() },
        // a temporary task rises over whatever page is underneath
        { on: '/review', transition: sheet({ type: 'blur' }) },
      ],
    }),
    [effect]
  )

  return (
    <div className="flex flex-col items-center gap-5">
      <PhoneFrame label="Page transition demo — open a place, write a review, go back">
        <PhoneScreen resetKey={path} resetScroll={false}>
          <PageTransition config={config} className="flex min-h-full flex-1 flex-col">
            {path === '/review' ? (
              <PageBoundary
                path="/review"
                className="flex min-h-full flex-1 flex-col bg-background"
              >
                <AppBar behavior="pinned" glass={false}>
                  <AppBarTitle>Write a review</AppBarTitle>
                  <AppBarActions>
                    <AppBarBackButton icon="close" onClick={back} />
                  </AppBarActions>
                </AppBar>
                <div className="flex flex-1 flex-col gap-3 px-4 pb-6">
                  <p className="text-caption text-muted-foreground">{place.name}</p>
                  <Textarea placeholder="How was it?" className="min-h-40 flex-1" />
                  <Button
                    onClick={() => {
                      toast.success('Review posted')
                      back()
                    }}
                  >
                    Post review
                  </Button>
                </div>
              </PageBoundary>
            ) : path.startsWith('/places/') ? (
              <PageBoundary path={path} className="flex min-h-full flex-1 flex-col bg-background">
                <AppBar behavior="reveal">
                  <AppBarBackButton onClick={back} />
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
                <Photo tone={place.tone} className="h-56 shrink-0" />
                <div className="space-y-4 px-5 pt-4 pb-8">
                  <div>
                    <h4 className="text-title-lg text-foreground">{place.name}</h4>
                    <p className="mt-1 flex items-center gap-1 text-caption text-muted-foreground">
                      <MapPin className="size-3" /> {place.area}
                    </p>
                  </div>
                  <p className="text-body-sm text-soft-foreground">
                    The page you came from is still there underneath. Go back and the list is
                    exactly where you left it.
                  </p>
                  <Button variant="secondary" className="w-full" onClick={() => push('/review')}>
                    <PenLine /> Write a review
                  </Button>
                  {PLACES.filter((p) => p !== place)
                    .slice(0, 3)
                    .map((p) => (
                      <PlaceRow key={p.name} place={p} />
                    ))}
                </div>
              </PageBoundary>
            ) : (
              <PageBoundary
                path="/places"
                className="flex min-h-full flex-1 flex-col bg-background"
              >
                <AppBar behavior="reveal">
                  <AppBarTitle size="lg">Places</AppBarTitle>
                  <AppBarActions>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Write a review"
                      onClick={() => push('/review')}
                    >
                      <PenLine />
                    </Button>
                  </AppBarActions>
                </AppBar>
                <ul className="px-3 pb-6">
                  {[...PLACES, ...PLACES].map((p, i) => (
                    <li key={i}>
                      <button
                        type="button"
                        onClick={() => push(`/places/${i % PLACES.length}`)}
                        className="flex w-full items-center gap-3 rounded-card px-2 py-2 text-left transition-colors duration-fast hover:bg-accent"
                      >
                        <Photo tone={p.tone} className="size-14 shrink-0 rounded-control" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-label font-semibold text-foreground">
                            {p.name}
                          </span>
                          <span className="flex items-center gap-1 text-caption text-muted-foreground">
                            <MapPin className="size-3" /> {p.area}
                          </span>
                        </span>
                        <ChevronRight className="size-4 shrink-0 text-subtle-foreground" />
                      </button>
                    </li>
                  ))}
                </ul>
              </PageBoundary>
            )}
          </PageTransition>
        </PhoneScreen>
      </PhoneFrame>
      <SegmentedControl<Effect>
        aria-label="List to detail effect"
        value={effect}
        onValueChange={setEffect}
        options={(Object.keys(EFFECTS) as Effect[]).map((key) => ({
          label: EFFECTS[key].label,
          value: key,
        }))}
      />
    </div>
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
    <div className="flex flex-col items-center gap-5">
      <PhoneFrame label="Pull to refresh demo — drag down from the top">
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
      </PhoneFrame>
      <p className="text-caption text-muted-foreground">
        Drag down from the top with a finger or the mouse.
      </p>
    </div>
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

// 쉘의 전환 규칙 — 탭은 순서대로 슬라이드, 카드를 열면 상세가 쉘 전체 위로 드릴인.
const SHELL_TRANSITIONS: PageTransitionConfig = {
  transitions: [
    { on: '/p/**', transition: drill() },
    { ordered: TABS.map((t) => t.value), transition: slide() },
  ],
}

export function AppShellExhibit() {
  const [tab, setTab] = React.useState('/home')
  const [detail, setDetail] = React.useState<number | null>(null)
  const [liked, setLiked] = React.useState(false)
  const current = TABS.find((t) => t.value === tab) ?? TABS[0]
  const path = detail === null ? tab : `/p/${detail}`
  const place = detail === null ? null : PLACES[detail % PLACES.length]
  return (
    <PhoneFrame label="Comwit UI app shell — scroll, pull, switch tabs and open a card">
      <PhoneScreen
        resetKey={path}
        resetScroll={false}
        onRefresh={() =>
          new Promise<void>((done) =>
            setTimeout(() => {
              toast.success('Feed updated')
              done()
            }, 900)
          )
        }
      >
        <PageTransition config={SHELL_TRANSITIONS} className="flex min-h-full flex-1 flex-col">
          {place ? (
            // 상세는 탭 쉘 밖의 라우트 — 바깥 경계의 key 가 바뀌어 앱바·탭바까지 함께 드릴인한다.
            <PageBoundary path={path} className="flex min-h-full flex-1 flex-col bg-background">
              <AppBar behavior="reveal">
                <AppBarBackButton onClick={() => setDetail(null)} />
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
                  Drilled in over the whole shell. Go back and the feed is still scrolled where you
                  left it.
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
            </PageBoundary>
          ) : (
            // 탭 쉘 — routeKey 를 고정해 앱바·탭바는 살아남고, 안쪽 경계만 탭 순서대로 슬라이드한다.
            <PageBoundary path={path} routeKey="tabs" className="flex min-h-full flex-1 flex-col">
              <AppBar behavior="reveal">
                <AppBarTitle size="lg">{current.label}</AppBarTitle>
                <AppBarActions>
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
              <PageBoundary path={path} className="flex-1 space-y-4 bg-background px-4 pb-4">
                <div className="flex gap-2 overflow-hidden">
                  {['For you', 'Nearby', 'Trending'].map((c, i) => (
                    <Chip key={c} size="sm" selected={i === 0} onClick={() => toast(c)}>
                      {c}
                    </Chip>
                  ))}
                </div>
                {PLACES.map((p, i) => (
                  <div key={i} className="overflow-hidden rounded-card bg-card shadow-card">
                    <button
                      type="button"
                      aria-label={`Open ${p.name}`}
                      onClick={() => setDetail(i)}
                      className="block w-full text-left"
                    >
                      <Photo
                        tone={TABS[(TABS.indexOf(current) + i) % TABS.length].tone}
                        className="h-40"
                      />
                    </button>
                    <div className="flex items-center justify-between gap-3 p-3">
                      <PlaceRowText place={p} />
                      <GlassButton
                        shape="circle"
                        shadow={false}
                        aria-label="Like"
                        aria-pressed={i === 0 && liked}
                        onClick={() => i === 0 && setLiked((v) => !v)}
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
              </PageBoundary>
              <BottomNav value={tab} onValueChange={setTab}>
                {TABS.map((t) => (
                  <BottomNavItem key={t.value} value={t.value} label={t.label} icon={t.icon} />
                ))}
              </BottomNav>
            </PageBoundary>
          )}
        </PageTransition>
      </PhoneScreen>
    </PhoneFrame>
  )
}

function PlaceRowText({ place }: { place: (typeof PLACES)[number] }) {
  return (
    <div className="min-w-0">
      <p className="truncate text-label font-semibold text-foreground">{place.name}</p>
      <p className="flex items-center gap-1 text-caption text-muted-foreground">
        <MapPin className="size-3" /> {place.area}
      </p>
    </div>
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
    <div className="flex flex-col items-center gap-5">
      <SegmentedControl
        value={mode}
        onValueChange={(v) => setMode(v as ChatMode)}
        options={[
          { value: 'messenger', label: 'Messenger' },
          { value: 'assistant', label: 'Assistant' },
        ]}
        aria-label="Chat mode"
      />
      <PhoneFrame label="Chat demo — send a message">
        {mode === 'messenger' ? <MessengerScreen /> : <AssistantScreen />}
      </PhoneFrame>
      <p className="text-caption text-muted-foreground">
        {mode === 'messenger'
          ? 'Send a message. Ava replies, and the list stays at the bottom.'
          : 'Send a message. It rises to the top and the answer streams in below.'}
      </p>
    </div>
  )
}

/** 갤러리 카드에서 스펙 예시 대신 쓰는 전시물 */
export const EXHIBITS: Record<string, React.ComponentType> = {
  'app-bar': AppBarExhibit,
  'bottom-nav': BottomNavExhibit,
  'page-transition': PageTransitionExhibit,
  'pull-to-refresh': PullToRefreshExhibit,
  chat: ChatExhibit,
  glass: GlassExhibit,
}
