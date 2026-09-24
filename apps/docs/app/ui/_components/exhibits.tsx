'use client'

import * as React from 'react'
import {
  Bell,
  Bookmark,
  Compass,
  Heart,
  House,
  MapPin,
  MessageCircle,
  Search,
  Share,
  SignalHigh,
  User,
  Wifi,
  BatteryFull,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  AppBar,
  AppBarActions,
  AppBarBackButton,
  AppBarTitle,
  FloatingBackButton,
  type AppBarBehavior,
} from '@comwit/ui-templates/app-bar'
import { BottomNav, BottomNavItem } from '@comwit/ui-templates/bottom-nav'
import { PullToRefresh } from '@comwit/ui-templates/pull-to-refresh'
import { Glass, GlassButton, type GlassVariant } from '@comwit/ui-templates/glass'
import { SegmentedControl } from '@comwit/ui-templates/segmented-control'
import { Button } from '@comwit/ui-templates/button'
import { Chip } from '@comwit/ui-templates/chip'
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
}: {
  children: React.ReactNode
  onRefresh?: () => Promise<unknown>
  resetKey?: unknown
}) {
  const scrollRef = React.useRef<HTMLDivElement>(null)
  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 })
  }, [resetKey])
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

const TABS = [
  { value: 'home', label: 'Home', icon: <House />, tone: 'sunset' as Tone },
  { value: 'explore', label: 'Explore', icon: <Compass />, tone: 'sea' as Tone },
  { value: 'saved', label: 'Saved', icon: <Bookmark />, tone: 'forest' as Tone },
  { value: 'me', label: 'Profile', icon: <User />, tone: 'dusk' as Tone },
]

export function BottomNavExhibit() {
  const [tab, setTab] = React.useState('home')
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

export function AppShellExhibit() {
  const [tab, setTab] = React.useState('home')
  const [liked, setLiked] = React.useState(false)
  const current = TABS.find((t) => t.value === tab) ?? TABS[0]
  return (
    <PhoneFrame label="Comwit UI app shell — scroll, pull, and tap">
      <PhoneScreen
        resetKey={tab}
        onRefresh={() =>
          new Promise<void>((done) =>
            setTimeout(() => {
              toast.success('Feed updated')
              done()
            }, 900)
          )
        }
      >
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
        <div className="flex-1 space-y-4 px-4 pb-4">
          <div className="flex gap-2 overflow-hidden">
            {['For you', 'Nearby', 'Trending'].map((c, i) => (
              <Chip key={c} size="sm" selected={i === 0} onClick={() => toast(c)}>
                {c}
              </Chip>
            ))}
          </div>
          {PLACES.map((place, i) => (
            <div key={i} className="overflow-hidden rounded-card bg-card shadow-card">
              <Photo tone={TABS[(TABS.indexOf(current) + i) % TABS.length].tone} className="h-40" />
              <div className="flex items-center justify-between gap-3 p-3">
                <PlaceRowText place={place} />
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
        </div>
        <BottomNav value={tab} onValueChange={setTab}>
          {TABS.map((t) => (
            <BottomNavItem key={t.value} value={t.value} label={t.label} icon={t.icon} />
          ))}
        </BottomNav>
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

/** 갤러리 카드에서 스펙 예시 대신 쓰는 전시물 */
export const EXHIBITS: Record<string, React.ComponentType> = {
  'app-bar': AppBarExhibit,
  'bottom-nav': BottomNavExhibit,
  'pull-to-refresh': PullToRefreshExhibit,
  glass: GlassExhibit,
}
