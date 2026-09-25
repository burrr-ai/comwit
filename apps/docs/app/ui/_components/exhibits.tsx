'use client'

import * as React from 'react'
import {
  Bell,
  Bookmark,
  Camera,
  Check,
  ChevronRight,
  Compass,
  CreditCard,
  Ellipsis,
  Hash,
  Heart,
  HelpCircle,
  House,
  ImagePlus,
  MapPin,
  MessageCircle,
  Navigation,
  PenLine,
  Phone,
  Search,
  Settings,
  Share,
  SignalHigh,
  SlidersHorizontal,
  Smile,
  Sparkles,
  Star,
  User,
  Wifi,
  BatteryFull,
  X,
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
import { DragScroller } from '@comwit/ui-templates/drag-scroller'
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
import { Input } from '@comwit/ui-templates/input'
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
  // 스크롤러는 flex 컨테이너가 아니다 — 안의 페이지가 콘텐츠만큼 자라야 sticky 앱바·탭바가 제 흐름 위치를 갖는다.
  // (flex-1 · basis 0 체인은 페이지 상자를 뷰포트 높이에 고정해 콘텐츠가 넘치고, 탭바가 콘텐츠 중간에 남는다.)
  return (
    <ScrollChromeProvider scrollRef={scrollRef} resetKey={resetKey}>
      <PullToRefresh
        ref={scrollRef}
        enabled={Boolean(onRefresh)}
        onRefresh={onRefresh ?? (() => undefined)}
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
 * 페이지는 언제나 화면 높이 이상(min-h-full)이라 나가는 동안에도 하단 탭바·액션바가 바닥에 머문다.
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
        {/* 쉘은 최소 화면 높이(min-h-full)에서 콘텐츠만큼 자란다. 페이지는 flex-1 로 짧을 때만 화면을 채운다. */}
        <PageTransition config={config} className="flex min-h-full flex-col">
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

/* ── Jeju weekend — the app every phone demo runs ───────────────────── */

type Tone = 'sunset' | 'sea' | 'forest' | 'dusk' | 'sand' | 'lava'

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

type Place = {
  name: string
  area: string
  tone: Tone
  tag: string
  rating: number
  reviews: number
  distance: string
  hours: string
  blurb: string
}

const PLACES: Place[] = [
  {
    name: 'Seongsan sunrise peak',
    area: 'Seongsan',
    tone: 'sunset',
    tag: 'Sunrise',
    rating: 4.9,
    reviews: 2140,
    distance: '24 min',
    hours: 'Opens 5:30 AM',
    blurb:
      'A tuff cone that rises straight out of the sea. Climb the stairs before dawn and the whole east coast turns gold under you.',
  },
  {
    name: 'Hyeopjae beach',
    area: 'Hallim',
    tone: 'sea',
    tag: 'Beach',
    rating: 4.8,
    reviews: 1320,
    distance: '38 min',
    hours: 'Open all day',
    blurb:
      'White shell sand and water so shallow it stays turquoise for a hundred meters. Biyangdo island floats right in front.',
  },
  {
    name: 'Bijarim forest',
    area: 'Gujwa',
    tone: 'forest',
    tag: 'Walk',
    rating: 4.7,
    reviews: 860,
    distance: '31 min',
    hours: 'Closes 6 PM',
    blurb:
      'A flat loop under 500-year-old nutmeg trees. The red volcanic path is soft, quiet and shaded even at noon.',
  },
  {
    name: 'Dongmun night market',
    area: 'Jeju City',
    tone: 'dusk',
    tag: 'Food',
    rating: 4.5,
    reviews: 3010,
    distance: '12 min',
    hours: 'Opens 6 PM',
    blurb:
      'Grilled black pork skewers, tangerine juice and steak cubes with cheese. Go hungry and go early: the lines start at seven.',
  },
  {
    name: 'Udo island ferry',
    area: 'Seongsan',
    tone: 'sea',
    tag: 'Day trip',
    rating: 4.6,
    reviews: 540,
    distance: '26 min',
    hours: 'Last boat 5 PM',
    blurb:
      'Fifteen minutes across and you are on a slower island. Rent a scooter, eat peanut ice cream, watch the lighthouse.',
  },
  {
    name: 'Hallasan Yeongsil trail',
    area: 'Seogwipo',
    tone: 'forest',
    tag: 'Hike',
    rating: 4.9,
    reviews: 1980,
    distance: '52 min',
    hours: 'Entry until 1 PM',
    blurb:
      'The short way up the mountain: pillars, meadows and a view of the southern coast. Bring water, the last stretch is bare.',
  },
  {
    name: 'Sanbangsan hot spring',
    area: 'Andeok',
    tone: 'sand',
    tag: 'Relax',
    rating: 4.4,
    reviews: 410,
    distance: '47 min',
    hours: 'Closes 10 PM',
    blurb:
      'Carbonated spring water at the foot of a dome-shaped mountain. The outdoor pool faces the sea and Hyeongjeseom island.',
  },
  {
    name: 'Jusangjeolli cliffs',
    area: 'Jungmun',
    tone: 'lava',
    tag: 'View',
    rating: 4.7,
    reviews: 1120,
    distance: '40 min',
    hours: 'Closes 6 PM',
    blurb:
      'Hexagonal basalt columns stacked like organ pipes where lava met the sea. Waves break white against them all day.',
  },
]
const CATEGORIES = ['For you', 'Beaches', 'Hikes', 'Food', 'Day trips', 'Relax']

const Stars = ({ rating, className }: { rating: number; className?: string }) => (
  <span className={cn('inline-flex items-center gap-1 text-caption text-foreground', className)}>
    <Star className="size-3 fill-current" aria-hidden="true" />
    {rating.toFixed(1)}
  </span>
)

/** 에어비앤비식 검색 필 — 카드가 아니라 버튼이다. */
function SearchPill({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mx-4 mb-3 flex h-12 shrink-0 items-center gap-3 rounded-pill border border-border bg-card px-4 text-left shadow-card transition-colors duration-fast hover:bg-accent"
    >
      <Search className="size-4 text-foreground" aria-hidden="true" />
      <span className="flex-1 text-label font-medium text-foreground">Where to next?</span>
      <span className="text-caption text-muted-foreground">Jeju · Any week</span>
    </button>
  )
}

/** 가로 카테고리 레일 — 드래그·플릭·휠은 DragScroller 가 갖는다. */
function CategoryRail({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <DragScroller trackClassName="gap-2 px-4 pb-3">
      {CATEGORIES.map((c) => (
        <Chip
          key={c}
          size="sm"
          selected={c === value}
          onClick={() => onChange(c)}
          className="shrink-0"
        >
          {c}
        </Chip>
      ))}
    </DragScroller>
  )
}

/** 피드 카드 — 사진 위 태그·하트, 아래 제목·별점·거리. */
function PlaceCard({
  place,
  onOpen,
  liked,
  onLike,
}: {
  place: Place
  onOpen: () => void
  liked: boolean
  onLike: () => void
}) {
  return (
    <article className="overflow-hidden rounded-card bg-card shadow-card">
      <div className="relative">
        <button
          type="button"
          aria-label={`Open ${place.name}`}
          onClick={onOpen}
          className="block w-full text-left"
        >
          <Photo tone={place.tone} className="h-44" />
        </button>
        <span className="pointer-events-none absolute top-3 left-3 rounded-pill bg-black/45 px-2.5 py-1 text-micro font-semibold text-white backdrop-blur">
          {place.tag}
        </span>
        <GlassButton
          shape="circle"
          shadow={false}
          aria-label={liked ? 'Remove from saved' : 'Save'}
          aria-pressed={liked}
          onClick={onLike}
          className="absolute top-2.5 right-2.5 size-9"
        >
          <Heart className={cn('size-4', liked && 'fill-destructive text-destructive')} />
        </GlassButton>
      </div>
      <button type="button" onClick={onOpen} className="block w-full px-3.5 py-3 text-left">
        <div className="flex items-start justify-between gap-3">
          <span className="min-w-0 truncate text-label font-semibold text-foreground">
            {place.name}
          </span>
          <Stars rating={place.rating} className="shrink-0" />
        </div>
        <p className="mt-0.5 text-caption text-muted-foreground">
          {place.area} · {place.distance} away
        </p>
        <p className="mt-1 text-caption text-soft-foreground">{place.hours}</p>
      </button>
    </article>
  )
}

/** 목록 행 — 썸네일·제목·별점·지역. trailing 으로 오른쪽 슬롯을 바꾼다(기본 셰브론). */
function PlaceRow({
  place,
  onClick,
  trailing,
  className,
}: {
  place: Place
  onClick?: () => void
  trailing?: React.ReactNode
  className?: string
}) {
  const inner = (
    <>
      <Photo tone={place.tone} className="size-16 shrink-0 rounded-control" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-label font-semibold text-foreground">
          {place.name}
        </span>
        <span className="mt-0.5 flex items-center gap-1.5 text-caption text-muted-foreground">
          <Stars rating={place.rating} />
          <span aria-hidden="true">·</span>
          <span className="truncate">{place.area}</span>
        </span>
        <span className="mt-0.5 block text-caption text-soft-foreground">{place.hours}</span>
      </span>
    </>
  )
  if (!onClick)
    return (
      <div className={cn('flex items-center gap-3 px-2 py-2', className)}>
        {inner}
        {trailing}
      </div>
    )
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-3 rounded-card px-2 py-2 text-left transition-colors duration-fast hover:bg-accent',
        className
      )}
    >
      {inner}
      {trailing ?? <ChevronRight className="size-4 shrink-0 text-subtle-foreground" />}
    </button>
  )
}

function SectionTitle({
  children,
  action,
}: {
  children: React.ReactNode
  action?: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between px-4 pt-1 pb-2">
      <h4 className="text-title-sm text-foreground">{children}</h4>
      {action}
    </div>
  )
}

/* ── Pages ──────────────────────────────────────────────────────────── */

/** 상세 — 풀블리드 사진 위 플로팅 버튼, 둥근 시트로 이어지는 본문, 바닥에 붙는 액션바. */
function PlaceDetailPage({
  place,
  onBack,
  close = false,
}: {
  place: Place
  onBack: () => void
  /** 시트로 떴을 때 — 뒤로가기 대신 닫기. */
  close?: boolean
}) {
  const [liked, setLiked] = React.useState(false)
  const nearby = PLACES.filter((p) => p !== place).slice(0, 3)
  return (
    <>
      <div className="relative shrink-0">
        <Photo tone={place.tone} className="h-64" />
        <div className="absolute inset-x-0 top-0 flex items-center justify-between p-3">
          <AppBarBackButton
            icon={close ? 'close' : 'back'}
            onClick={onBack}
            className={cn(close && 'size-10 rounded-full bg-background/80 backdrop-blur')}
          />
          <div className="flex gap-2">
            <GlassButton
              shape="circle"
              shadow={false}
              aria-label="Share"
              className="size-10"
              onClick={() => toast('Link copied')}
            >
              <Share className="size-4" />
            </GlassButton>
            <GlassButton
              shape="circle"
              shadow={false}
              aria-label="Save"
              aria-pressed={liked}
              className="size-10"
              onClick={() => setLiked((v) => !v)}
            >
              <Heart className={cn('size-4', liked && 'fill-destructive text-destructive')} />
            </GlassButton>
          </div>
        </div>
        <span className="absolute right-4 bottom-9 rounded-pill bg-black/50 px-2.5 py-1 text-micro font-medium text-white tabular-nums">
          1 / 24
        </span>
      </div>
      <div className="relative -mt-6 flex flex-1 flex-col rounded-t-sheet bg-background px-5 pt-5">
        <div className="flex items-start justify-between gap-3">
          <h4 className="text-title-lg text-foreground">{place.name}</h4>
          <Chip size="sm" className="shrink-0">
            {place.tag}
          </Chip>
        </div>
        <p className="mt-1 flex items-center gap-1 text-caption text-muted-foreground">
          <MapPin className="size-3" /> {place.area} · {place.distance} from you
        </p>
        <div className="mt-4 grid grid-cols-3 divide-x divide-border rounded-card border border-border py-3">
          <div className="flex flex-col items-center px-2">
            <span className="text-title-sm text-foreground">{place.rating.toFixed(1)}</span>
            <span className="mt-1 text-micro tracking-[0.25em] text-foreground">★★★★★</span>
          </div>
          <div className="flex flex-col items-center px-2 text-center">
            <Sparkles className="size-4 text-primary" aria-hidden="true" />
            <span className="mt-1 text-micro font-semibold text-foreground">Guest favorite</span>
          </div>
          <div className="flex flex-col items-center px-2">
            <span className="text-title-sm text-foreground">{place.reviews.toLocaleString()}</span>
            <span className="mt-1 text-micro text-muted-foreground">Reviews</span>
          </div>
        </div>
        <p className="mt-4 text-body-sm text-soft-foreground">{place.blurb}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {['Parking', 'Restrooms', 'Stroller friendly', 'Cafe nearby'].map((c) => (
            <Chip key={c} size="sm" onClick={() => toast(c)}>
              {c}
            </Chip>
          ))}
        </div>
        <h5 className="mt-5 text-title-sm text-foreground">Nearby</h5>
        <ul className="-mx-2 mt-1 mb-4">
          {nearby.map((p) => (
            <li key={p.name}>
              <PlaceRow place={p} onClick={() => toast(p.name)} />
            </li>
          ))}
        </ul>
        <div className="flex-1" />
      </div>
      {/* 바닥에 붙는 액션바 — 페이지가 화면 높이 이상이라 나가는 동안에도 바닥에 있다. */}
      <div className="sticky bottom-0 z-appbar flex shrink-0 items-center justify-between gap-3 border-t border-border bg-background px-5 pt-3 pb-6">
        <div>
          <p className="text-label font-semibold text-foreground">Free entry</p>
          <p className="text-caption text-muted-foreground">{place.hours}</p>
        </div>
        <Button size="lg" onClick={() => toast.success('Opening directions')}>
          <Navigation /> Directions
        </Button>
      </div>
    </>
  )
}

/** 글쓰기 — 시트로 올라오는 임시 작업. 닫기·발행 바, 커버 사진, 위치, 제목, 본문, 툴바. */
function ComposePage({ onClose }: { onClose: () => void }) {
  const [cover, setCover] = React.useState(false)
  const [location, setLocation] = React.useState<string | null>(null)
  return (
    <>
      <div className="flex shrink-0 items-center gap-1 border-b border-border px-2 py-2">
        <AppBarBackButton icon="close" onClick={onClose} />
        <span className="flex-1 px-1 text-title-md text-foreground">New story</span>
        <Button
          size="sm"
          onClick={() => {
            toast.success('Story published')
            onClose()
          }}
        >
          Publish
        </Button>
      </div>
      <div className="flex flex-1 flex-col px-5 pt-4 pb-4">
        {cover ? (
          <div className="relative">
            <Photo tone="sunset" className="h-40 rounded-card" />
            <Button
              variant="plain"
              size="none"
              aria-label="Remove cover photo"
              onClick={() => setCover(false)}
              className="absolute top-2 right-2 size-7 rounded-full bg-black/55 text-white"
            >
              <X className="size-3.5" />
            </Button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setCover(true)}
            className="flex h-40 flex-col items-center justify-center gap-2 rounded-card border-2 border-dashed border-border-strong bg-muted text-muted-foreground transition-colors duration-fast hover:bg-accent"
          >
            <ImagePlus className="size-6" aria-hidden="true" />
            <span className="text-label font-medium">Add a cover photo</span>
          </button>
        )}
        <div className="mt-4">
          {location ? (
            <Chip
              size="sm"
              selected
              onDelete={() => setLocation(null)}
              deleteLabel="Remove location"
            >
              <MapPin className="size-3" /> {location}
            </Chip>
          ) : (
            <Chip size="sm" onClick={() => setLocation('Seongsan, Jeju')}>
              <MapPin className="size-3" /> Add location
            </Chip>
          )}
        </div>
        <Input
          placeholder="Give your story a title"
          className="mt-3 h-12 border-0 bg-transparent px-0 text-title-lg shadow-none placeholder:text-subtle-foreground focus-visible:ring-0"
        />
        <Textarea
          placeholder="Sunrise at six, then the coast road with the windows down…"
          className="mt-1 min-h-32 flex-1 resize-none border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
        />
      </div>
      <div className="sticky bottom-0 flex shrink-0 items-center gap-1 border-t border-border bg-background px-3 pt-2 pb-5">
        {(
          [
            ['Add photo', Camera],
            ['Add location', MapPin],
            ['Add tag', Hash],
            ['Add emoji', Smile],
          ] as const
        ).map(([label, Icon]) => (
          <Button
            key={label}
            variant="ghost"
            size="icon"
            aria-label={label}
            onClick={() => toast(label)}
          >
            <Icon />
          </Button>
        ))}
      </div>
    </>
  )
}

/** 목록 페이지 — 검색 필과 카테고리 레일 아래 행 목록. */
function PlaceListPage({ onOpen }: { onOpen: (index: number) => void }) {
  const [category, setCategory] = React.useState(CATEGORIES[0])
  return (
    <>
      <AppBar behavior="reveal">
        <AppBarTitle size="lg">Places</AppBarTitle>
        <AppBarActions>
          <Button variant="ghost" size="icon" aria-label="Filters" onClick={() => toast('Filters')}>
            <SlidersHorizontal />
          </Button>
        </AppBarActions>
      </AppBar>
      <SearchPill onClick={() => toast('Search')} />
      <CategoryRail value={category} onChange={setCategory} />
      <SectionTitle>Near you</SectionTitle>
      <ul className="px-2 pb-6">
        {[...PLACES, ...PLACES].map((p, i) => (
          <li key={i}>
            <PlaceRow place={p} onClick={() => onOpen(i)} />
          </li>
        ))}
      </ul>
    </>
  )
}

/* ── App bar ────────────────────────────────────────────────────────── */

type BarMode = AppBarBehavior | 'hero'

export function AppBarExhibit() {
  const [mode, setMode] = React.useState<BarMode>('reveal')
  const place = PLACES[0]
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
        <div className="space-y-5 px-5 pt-3 pb-10">
          {mode !== 'hero' && <Photo tone="sunset" className="h-44 rounded-card" />}
          <div>
            <div className="flex items-start justify-between gap-3">
              <h4 className="text-title-lg text-foreground">Four days on the island</h4>
              <Stars rating={place.rating} className="mt-1.5 shrink-0" />
            </div>
            <p className="mt-1.5 text-body-sm text-soft-foreground">
              Scroll down and the bar slides away. Nudge up and it comes straight back.
            </p>
          </div>
          <ul className="-mx-2">
            {[...PLACES, ...PLACES].map((p, i) => (
              <li key={i}>
                <PlaceRow place={p} />
              </li>
            ))}
          </ul>
        </div>
      </PhoneScreen>
    </PhoneStage>
  )
}

/* ── Bottom nav ─────────────────────────────────────────────────────── */

// 값은 경로다 — 앱 쉘 전시물에서 페이지 전환 규칙(ordered)이 그대로 매칭한다.
const TABS = [
  { value: '/home', label: 'Home', icon: <House /> },
  { value: '/explore', label: 'Explore', icon: <Compass /> },
  { value: '/saved', label: 'Saved', icon: <Bookmark /> },
  { value: '/me', label: 'Profile', icon: <User /> },
]

export function BottomNavExhibit() {
  const [tab, setTab] = React.useState('/home')
  const [liked, setLiked] = React.useState<number | null>(null)
  const current = TABS.find((t) => t.value === tab) ?? TABS[0]
  const offset = TABS.indexOf(current) * 2
  return (
    <PhoneStage
      label="Bottom nav demo — tap a tab, scroll to shrink the bar"
      footer="Tap a tab. Scroll to shrink the bar."
    >
      <PhoneScreen resetKey={tab}>
        <AppBar behavior="flow" glass={false}>
          <AppBarTitle size="lg">{current.label}</AppBarTitle>
          <AppBarActions>
            <Button variant="ghost" size="icon" aria-label="Search" onClick={() => toast('Search')}>
              <Search />
            </Button>
          </AppBarActions>
        </AppBar>
        <div className="space-y-4 px-4 pb-4">
          {Array.from({ length: 6 }, (_, i) => PLACES[(offset + i) % PLACES.length]).map((p, i) => (
            <PlaceCard
              key={i}
              place={p}
              onOpen={() => toast(p.name)}
              liked={liked === i}
              onLike={() => setLiked((v) => (v === i ? null : i))}
            />
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

// 같은 두 페이지(목록 ↔ 상세)에 규칙만 바꿔 끼운다 — 두 효과가 그대로 비교된다.
const EFFECTS = { drill: 'Drill', sheet: 'Sheet' } as const
type Effect = keyof typeof EFFECTS

export function PageTransitionExhibit() {
  const [effect, setEffect] = React.useState<Effect>('drill')
  const router = useMiniRouter('/places')
  const index = router.path.startsWith('/places/')
    ? Number(router.path.slice('/places/'.length))
    : null

  const config = React.useMemo<PageTransitionConfig>(
    () => ({
      transitions: [
        // list → detail: entering /places/* is forward, leaving is backward
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
        <PlaceListPage onOpen={(i) => router.push(`/places/${i}`)} />
      ) : (
        <PlaceDetailPage
          place={PLACES[index % PLACES.length]}
          onBack={router.back}
          close={effect === 'sheet'}
        />
      )}
    </MobileShell>
  )
}

/* ── Bottom sheet ───────────────────────────────────────────────────── */

const AREAS = ['Jeju City', 'Seogwipo', 'Seongsan', 'Hallim']
const SORTS = ['Closest first', 'Top rated', 'Most reviewed', 'Open now']
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
  const [areas, setAreas] = React.useState<string[]>(['Jeju City'])
  const [sort, setSort] = React.useState(SORTS[0])
  const [actionFor, setActionFor] = React.useState<number | null>(null)
  const target = actionFor === null ? null : PLACES[actionFor % PLACES.length]
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
      <SearchPill onClick={() => setFilters(true)} />
      {/* 스크롤러의 flex 열 안이라 shrink-0 — 안 주면 긴 목록에 눌려 칩이 잘린다 */}
      <div className="flex shrink-0 gap-2 overflow-x-clip px-4 pb-2">
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
      <SectionTitle>{sort}</SectionTitle>
      <ul className="px-2 pb-6">
        {[...PLACES, ...PLACES].map((p, i) => (
          <li key={i}>
            <PlaceRow
              place={p}
              onClick={() => toast(p.name)}
              trailing={
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`More about ${p.name}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    setActionFor(i)
                  }}
                  asChild
                >
                  <span role="button" tabIndex={0}>
                    <Ellipsis />
                  </span>
                </Button>
              }
            />
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
              Show {areas.length ? areas.length * 6 : 24} places
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
                <BottomSheetDescription>
                  {target.area} · {target.distance} away · {target.hours}
                </BottomSheetDescription>
              </BottomSheetHeader>
              <div className="grid gap-1 px-3 pb-4">
                {(
                  [
                    ['Share', Share],
                    ['Save', Bookmark],
                    ['Directions', Navigation],
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

/* ── Overview hero — the whole app in one phone ─────────────────────── */

// 쉘의 전환 규칙 — 탭은 순서대로 슬라이드, 카드를 열면 상세가 쉘 전체 위로 드릴인, 글쓰기는 시트로 뜬다.
// 뒤로가기는 각각을 거꾸로 돈다.
const SHELL_TRANSITIONS: PageTransitionConfig = {
  transitions: [
    { on: '/p/**', transition: drill() },
    { on: '/compose', transition: sheet({ type: 'blur' }) },
    { ordered: TABS.map((t) => t.value), transition: slide() },
  ],
}

const isTab = (path: string) => TABS.some((t) => t.value === path)

export function AppShellExhibit() {
  const router = useMiniRouter('/home')
  const { path } = router
  const [saved, setSaved] = React.useState<number[]>([1, 5])
  const placeIndex = path.startsWith('/p/') ? Number(path.split('/')[2]) : null
  const place = placeIndex === null ? null : PLACES[placeIndex % PLACES.length]
  const toggleSaved = (i: number) =>
    setSaved((list) => (list.includes(i) ? list.filter((x) => x !== i) : [...list, i]))
  const refresh = () =>
    new Promise<void>((done) =>
      setTimeout(() => {
        toast.success('Feed updated')
        done()
      }, 900)
    )

  return (
    <MobileShell
      label="Comwit UI app shell — scroll, pull, switch tabs, open a card, write a story"
      path={path}
      // 탭들은 한 쉘(고정 키)을 공유한다 — 탭바가 살아남고 페이지(앱바 포함)만 슬라이드한다.
      routeKey={isTab(path) ? 'tabs' : undefined}
      config={SHELL_TRANSITIONS}
      onRefresh={refresh}
    >
      {path === '/compose' ? (
        <ComposePage onClose={router.back} />
      ) : place ? (
        <PlaceDetailPage place={place} onBack={router.back} />
      ) : (
        <TabsLayout
          tab={path}
          onTabChange={router.replace}
          onOpenPlace={(i) => router.push(`/p/${i}`)}
          onCompose={() => router.push('/compose')}
          saved={saved}
          onToggleSaved={toggleSaved}
        />
      )}
    </MobileShell>
  )
}

// 탭 쉘 — 탭바만 살아남고, 페이지(앱바 포함)가 탭 순서대로 슬라이드한다. 앱바는 페이지 안에 있으니 페이지와
// 함께 움직이고, 안쪽 경계 위에는 아무것도 없어 나가는 페이지가 정확히 제자리에 머문다.
function TabsLayout({
  tab,
  onTabChange,
  onOpenPlace,
  onCompose,
  saved,
  onToggleSaved,
}: {
  tab: string
  onTabChange: (tab: string) => void
  onOpenPlace: (index: number) => void
  onCompose: () => void
  saved: number[]
  onToggleSaved: (index: number) => void
}) {
  return (
    <>
      <PageBoundary path={tab} className="flex min-h-full flex-1 flex-col bg-background">
        {tab === '/home' ? (
          <HomeTab
            onOpenPlace={onOpenPlace}
            onCompose={onCompose}
            saved={saved}
            onToggleSaved={onToggleSaved}
          />
        ) : tab === '/explore' ? (
          <ExploreTab onOpenPlace={onOpenPlace} />
        ) : tab === '/saved' ? (
          <SavedTab saved={saved} onOpenPlace={onOpenPlace} onToggleSaved={onToggleSaved} />
        ) : (
          <ProfileTab />
        )}
      </PageBoundary>
      <BottomNav value={tab} onValueChange={onTabChange}>
        {TABS.map((t) => (
          <BottomNavItem key={t.value} value={t.value} label={t.label} icon={t.icon} />
        ))}
      </BottomNav>
    </>
  )
}

function HomeTab({
  onOpenPlace,
  onCompose,
  saved,
  onToggleSaved,
}: {
  onOpenPlace: (index: number) => void
  onCompose: () => void
  saved: number[]
  onToggleSaved: (index: number) => void
}) {
  const [category, setCategory] = React.useState(CATEGORIES[0])
  return (
    <>
      <AppBar behavior="reveal">
        <AppBarTitle size="lg">Jeju weekend</AppBarTitle>
        <AppBarActions>
          <Button variant="ghost" size="icon" aria-label="New story" onClick={onCompose}>
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
      <SearchPill onClick={() => toast('Search')} />
      <CategoryRail value={category} onChange={setCategory} />
      <div className="space-y-4 px-4 pb-4">
        {PLACES.map((p, i) => (
          <PlaceCard
            key={i}
            place={p}
            onOpen={() => onOpenPlace(i)}
            liked={saved.includes(i)}
            onLike={() => onToggleSaved(i)}
          />
        ))}
      </div>
    </>
  )
}

function ExploreTab({ onOpenPlace }: { onOpenPlace: (index: number) => void }) {
  return (
    <>
      <AppBar behavior="reveal">
        <AppBarTitle size="lg">Explore</AppBarTitle>
        <AppBarActions>
          <Button variant="ghost" size="icon" aria-label="Filters" onClick={() => toast('Filters')}>
            <SlidersHorizontal />
          </Button>
        </AppBarActions>
      </AppBar>
      <SearchPill onClick={() => toast('Search')} />
      {/* 지도 자리 — 핀 두 개 찍힌 사진 카드 */}
      <div className="px-4 pb-4">
        <Photo tone="sea" className="relative h-36 rounded-card">
          {[
            ['22%', '38%'],
            ['58%', '54%'],
            ['76%', '30%'],
          ].map(([left, top], i) => (
            <span
              key={i}
              className="absolute flex size-7 -translate-x-1/2 -translate-y-full items-center justify-center rounded-full bg-primary text-primary-foreground shadow-raised"
              style={{ left, top }}
            >
              <MapPin className="size-3.5" aria-hidden="true" />
            </span>
          ))}
          <span className="absolute right-3 bottom-3 rounded-pill bg-black/45 px-2.5 py-1 text-micro font-semibold text-white backdrop-blur">
            Open map
          </span>
        </Photo>
      </div>
      <SectionTitle
        action={
          <button
            type="button"
            className="text-caption font-medium text-primary"
            onClick={() => toast('See all')}
          >
            See all
          </button>
        }
      >
        Near you
      </SectionTitle>
      <ul className="px-2 pb-6">
        {[...PLACES, ...PLACES].map((p, i) => (
          <li key={i}>
            <PlaceRow place={p} onClick={() => onOpenPlace(i)} />
          </li>
        ))}
      </ul>
    </>
  )
}

function SavedTab({
  saved,
  onOpenPlace,
  onToggleSaved,
}: {
  saved: number[]
  onOpenPlace: (index: number) => void
  onToggleSaved: (index: number) => void
}) {
  return (
    <>
      <AppBar behavior="reveal">
        <AppBarTitle size="lg">Saved</AppBarTitle>
      </AppBar>
      {saved.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 px-8 text-center">
          <Bookmark className="size-8 text-subtle-foreground" aria-hidden="true" />
          <p className="text-title-sm text-foreground">Nothing saved yet</p>
          <p className="text-body-sm text-soft-foreground">
            Tap the heart on a place and it lands here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 px-4 pb-6">
          {saved.map((i) => {
            const p = PLACES[i % PLACES.length]
            return (
              <div key={i} className="relative">
                <button
                  type="button"
                  onClick={() => onOpenPlace(i)}
                  className="block w-full overflow-hidden rounded-card text-left"
                >
                  <Photo tone={p.tone} className="h-32" />
                  <span className="mt-2 block truncate text-label font-semibold text-foreground">
                    {p.name}
                  </span>
                  <span className="flex items-center gap-1 text-caption text-muted-foreground">
                    <Stars rating={p.rating} /> · {p.area}
                  </span>
                </button>
                <GlassButton
                  shape="circle"
                  shadow={false}
                  aria-label="Remove from saved"
                  aria-pressed
                  onClick={() => onToggleSaved(i)}
                  className="absolute top-2 right-2 size-8"
                >
                  <Heart className="size-3.5 fill-destructive text-destructive" />
                </GlassButton>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}

function ProfileTab() {
  return (
    <>
      <AppBar behavior="reveal">
        <AppBarTitle size="lg">Profile</AppBarTitle>
        <AppBarActions>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Settings"
            onClick={() => toast('Settings')}
          >
            <Settings />
          </Button>
        </AppBarActions>
      </AppBar>
      <div className="flex items-center gap-4 px-5 pt-1 pb-4">
        <Avatar className="size-16">
          <AvatarFallback>DM</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="text-title-md text-foreground">Daeseung</p>
          <p className="text-caption text-muted-foreground">Seoul · Jeju regular since 2019</p>
        </div>
      </div>
      <div className="mx-4 grid grid-cols-3 divide-x divide-border rounded-card border border-border py-3">
        {[
          ['12', 'Trips'],
          ['38', 'Reviews'],
          ['214', 'Photos'],
        ].map(([n, label]) => (
          <div key={label} className="flex flex-col items-center px-2">
            <span className="text-title-sm text-foreground">{n}</span>
            <span className="mt-0.5 text-micro text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>
      <ul className="mt-4 px-4 pb-6">
        {(
          [
            ['Notifications', Bell],
            ['Payments', CreditCard],
            ['Help', HelpCircle],
          ] as const
        ).map(([label, Icon]) => (
          <li key={label}>
            <button
              type="button"
              onClick={() => toast(label)}
              className="flex w-full items-center gap-3 rounded-card px-2 py-3 text-left text-label text-foreground transition-colors duration-fast hover:bg-accent"
            >
              <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
              <span className="flex-1">{label}</span>
              <ChevronRight className="size-4 text-subtle-foreground" />
            </button>
          </li>
        ))}
      </ul>
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
