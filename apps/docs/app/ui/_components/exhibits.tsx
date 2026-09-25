'use client'

import * as React from 'react'
import {
  Archive,
  ArrowLeft,
  Bell,
  BatteryFull,
  Check,
  Circle,
  Clock,
  CloudUpload,
  Film,
  FolderPlus,
  Heart,
  Image as ImageIcon,
  LayoutGrid,
  Maximize2,
  MoreVertical,
  Phone,
  Play,
  Plus,
  Search,
  SignalHigh,
  Sparkles,
  Trash2,
  Upload,
  Wifi,
} from 'lucide-react'
import { toast } from '@comwit/ui-templates/toast'
import {
  AppBar,
  AppBarActions,
  AppBarBackButton,
  AppBarTitle,
  type AppBarBehavior,
} from '@comwit/ui-templates/app-bar'
import { BottomNav, BottomNavItem } from '@comwit/ui-templates/bottom-nav'
import {
  PageBoundary,
  PageTransition,
  axis,
  drill,
  fade,
  hero,
  sheet,
  zoom,
  type PageTransitionConfig,
} from '@comwit/ui-templates/page-transition'
import {
  BottomSheet,
  BottomSheetClose,
  BottomSheetContent,
  BottomSheetDescription,
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
import { ScrollChromeProvider } from '@comwit/ui'
import { cn } from '@comwit/ui-templates/lib/utils'
import {
  COLLECTIONS,
  PHOTOS,
  collectionById,
  collectionPhotos,
  photoById,
  type Collection,
  type Photo,
} from './photos-data'

/* ── Device ─────────────────────────────────────────────────────────── */

// 폰 화면 요소. 시트·스크림처럼 body 로 포털되는 오버레이가 기기 안에 뜨도록 `container` 로 넘긴다.
const PhoneScreenContext = React.createContext<HTMLDivElement | null>(null)
export const usePhoneScreen = () => React.useContext(PhoneScreenContext)
/** 스크롤러 높이(px): 화면 592 − 상태바 34. 풀스크린 캔버스가 이 값을 쓴다. */
const SCREEN_H = 558

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
 * 폰 안의 앱 쉘: 스크롤러 + 전환 프로바이더 + 라우트 경계 하나. `path` 가 바뀌면 경계(key)가 바뀌고,
 * 나가는 페이지는 엔진이 붙잡아 애니메이션한다. 살아남는 탭 쉘은 `routeKey` 를 고정하고 안쪽에 경계를 하나 더 둔다.
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

/* ── Photos — the app every phone demo runs (after ssgoi's Google Photos showcase) ── */

function Img(props: React.ComponentProps<'img'>) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img alt="" decoding="async" {...props} />
}

/** 4색 바람개비 로고. */
function Pinwheel({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d="M12 12a6 6 0 0 0-6-6 6 6 0 0 0 6 6Z" fill="#EA4335" />
      <path d="M12 12a6 6 0 0 1 6-6 6 6 0 0 1-6 6Z" fill="#FBBC04" />
      <path d="M12 12a6 6 0 0 1 6 6 6 6 0 0 1-6-6Z" fill="#4285F4" />
      <path d="M12 12a6 6 0 0 0-6 6 6 6 0 0 0 6-6Z" fill="#34A853" />
    </svg>
  )
}

const TABS = [
  { value: '/', label: 'Photos', icon: <ImageIcon /> },
  { value: '/collections', label: 'Collections', icon: <LayoutGrid /> },
  { value: '/create', label: 'Create', icon: <Sparkles /> },
]
const isTab = (path: string) => TABS.some((t) => t.value === path)
/** 탭바의 네 번째 칸. 앱 쉘에서는 페이지가 아니라 검색 시트를 연다. */
const SEARCH_TAB = { value: '/search', label: 'Search', icon: <Search /> }
const NAV_TABS = [...TABS, SEARCH_TAB]

/** 탭 쉘의 상단 바 — 로고 · 추가 · 알림 · 프로필. */
function TopAppBar({
  onAdd,
  behavior = 'pinned',
}: {
  onAdd?: () => void
  behavior?: AppBarBehavior
}) {
  return (
    <AppBar behavior={behavior}>
      <Pinwheel className="ml-1 size-7 shrink-0" />
      <AppBarTitle className="text-label font-medium text-soft-foreground">Photos</AppBarTitle>
      <AppBarActions>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Add"
          onClick={onAdd ?? (() => toast('Add'))}
        >
          <Plus />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Notifications"
          className="relative"
          onClick={() => toast('Backup complete')}
        >
          <Bell />
          <span className="absolute top-2 right-2.5 size-2 rounded-full bg-destructive" />
        </Button>
        <button
          type="button"
          aria-label="Account"
          onClick={() => toast('Account')}
          className="ml-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-caption font-semibold text-primary-foreground"
        >
          D
        </button>
      </AppBarActions>
    </AppBar>
  )
}

/** 유리 캡슐 탭바(BottomNav) — 세 탭 + 검색. 검색은 선택 값을 바꾸지 않고 시트를 연다. */
function PhotosNav({
  value,
  onChange,
  onSearch,
}: {
  value: string
  onChange: (path: string) => void
  onSearch: () => void
}) {
  return (
    <BottomNav
      aria-label="Sections"
      value={value}
      onValueChange={(next) => (next === SEARCH_TAB.value ? onSearch() : onChange(next))}
    >
      {NAV_TABS.map((t) => (
        <BottomNavItem key={t.value} value={t.value} label={t.label} icon={t.icon} />
      ))}
    </BottomNav>
  )
}

/** 3열 정사각 그리드. 각 사진이 hero/zoom 의 출발 쪽 키를 단다. */
function PhotoGrid({
  photos,
  onOpen,
  keyed = true,
}: {
  photos: Photo[]
  onOpen: (photo: Photo) => void
  keyed?: boolean
}) {
  return (
    <div className="grid grid-cols-3 gap-[2px] bg-background">
      {photos.map((p) => (
        <button
          key={p.id}
          type="button"
          aria-label={p.description ?? p.takenAt}
          onClick={() => onOpen(p)}
          className="relative block aspect-square bg-muted"
        >
          <Img
            src={p.thumb}
            width={p.width}
            height={p.height}
            loading="lazy"
            className="h-full w-full object-cover"
            data-hero-exit-key={keyed ? p.id : undefined}
            data-zoom-exit-key={keyed ? p.id : undefined}
          />
        </button>
      ))}
    </div>
  )
}

function PhotosTab({ onOpen }: { onOpen: (photo: Photo) => void }) {
  return <PhotoGrid photos={PHOTOS} onOpen={onOpen} />
}

/** 컬렉션 카드 — 2×2 미니 그리드, 이름, 개수. */
function CollectionCard({ collection, onOpen }: { collection: Collection; onOpen: () => void }) {
  const covers = collectionPhotos(collection).slice(0, 4)
  return (
    <button type="button" onClick={onOpen} className="flex flex-col gap-2 text-left">
      <div className="grid aspect-square w-full grid-cols-2 grid-rows-2 gap-[2px] overflow-hidden rounded-card bg-muted">
        {covers.map((p) => (
          <Img key={p.id} src={p.thumb} loading="lazy" className="h-full w-full object-cover" />
        ))}
        {Array.from({ length: Math.max(0, 4 - covers.length) }, (_, i) => (
          <div key={i} className="bg-muted" />
        ))}
      </div>
      <div className="px-1">
        <p className="truncate text-label font-medium text-foreground">{collection.name}</p>
        <p className="text-caption text-muted-foreground">{collection.photoIds.length}</p>
      </div>
    </button>
  )
}

const UTILITIES = [
  ['Favorites', Heart],
  ['Trash', Trash2],
  ['Videos', Film],
  ['Archive', Archive],
] as const

function CollectionsTab({ onOpen }: { onOpen: (collection: Collection) => void }) {
  return (
    <div className="space-y-4 px-gutter py-4">
      <div className="grid grid-cols-2 gap-3">
        {UTILITIES.map(([label, Icon]) => (
          <button
            key={label}
            type="button"
            onClick={() => toast(label)}
            className="flex items-center gap-3 rounded-pill bg-muted px-4 py-3 text-left text-label font-medium text-foreground transition-colors duration-fast hover:bg-accent"
          >
            <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {COLLECTIONS.map((c) => (
          <CollectionCard key={c.id} collection={c} onOpen={() => onOpen(c)} />
        ))}
      </div>
    </div>
  )
}

const TOOLS = [
  {
    label: 'Collage',
    Icon: LayoutGrid,
    tint: 'bg-info-surface text-info-surface-foreground',
    enabled: true,
  },
  {
    label: 'Highlight video',
    Icon: Sparkles,
    tint: 'bg-destructive-surface text-destructive-surface-foreground',
  },
  {
    label: 'Cinematic motion',
    Icon: Film,
    tint: 'bg-success-surface text-success-surface-foreground',
  },
  { label: 'Animation', Icon: Play, tint: 'bg-warning-surface text-warning-surface-foreground' },
]

function CreateTab({ onCollage }: { onCollage: () => void }) {
  return (
    <div className="space-y-6 px-gutter py-4">
      <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-card bg-linear-to-br from-[#8E5BE8] via-[#7B5BE8] to-[#5F76F5]">
        <span className="rounded-pill bg-white/95 px-5 py-2 text-label font-semibold text-black shadow-raised">
          Create
        </span>
        <span className="absolute -top-6 -left-6 size-24 rounded-full bg-white/10" />
        <span className="absolute -right-4 -bottom-4 size-20 rounded-full bg-white/15" />
      </div>
      <section>
        <h4 className="mb-3 text-title-md text-foreground">My tools</h4>
        <div className="grid grid-cols-2 gap-3">
          {TOOLS.map(({ label, Icon, tint, enabled }) => (
            <button
              key={label}
              type="button"
              disabled={!enabled}
              onClick={enabled ? onCollage : undefined}
              className={cn(
                'relative flex flex-col items-start gap-3 rounded-card bg-muted p-4 text-left transition-colors duration-fast',
                enabled ? 'hover:bg-accent' : 'cursor-not-allowed opacity-50'
              )}
            >
              <span className={cn('flex size-10 items-center justify-center rounded-full', tint)}>
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <span className="text-label font-medium text-foreground">{label}</span>
              {!enabled && (
                <span className="absolute top-3 right-3 rounded-pill bg-border px-2 py-0.5 text-micro font-medium text-muted-foreground">
                  Soon
                </span>
              )}
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}

/** 사진 상세 — 뒤로가기 원, 풀스크린 캔버스(hero/zoom 의 도착 쪽), 아래로 스크롤하면 메타. */
function PhotoDetailPage({ photo, onBack }: { photo: Photo; onBack: () => void }) {
  return (
    <div className="relative flex flex-1 flex-col bg-background">
      <GlassButton
        shape="circle"
        shadow={false}
        aria-label="Back"
        onClick={onBack}
        className="absolute top-3 left-3 z-raised size-10"
      >
        <ArrowLeft className="size-5" />
      </GlassButton>
      <section className="w-full bg-background py-4" style={{ height: SCREEN_H }}>
        <Img
          src={photo.src}
          width={photo.width}
          height={photo.height}
          className="block h-full w-full object-contain"
          data-hero-enter-key={photo.id}
          data-zoom-enter-key={photo.id}
        />
      </section>
      <section className="space-y-6 border-t border-border px-5 pt-8 pb-12">
        {photo.description && (
          <h4 className="text-title-md text-foreground">{photo.description}</h4>
        )}
        <dl className="grid grid-cols-[110px_1fr] gap-y-3 text-body-sm text-foreground">
          <dt className="text-muted-foreground">Date</dt>
          <dd>{photo.takenAt}</dd>
          {photo.location && (
            <>
              <dt className="text-muted-foreground">Location</dt>
              <dd>{photo.location}</dd>
            </>
          )}
          <dt className="text-muted-foreground">Dimensions</dt>
          <dd>
            {photo.width} × {photo.height}
          </dd>
          <dt className="text-muted-foreground">File size</dt>
          <dd>{photo.fileSize}</dd>
          <dt className="text-muted-foreground">Storage</dt>
          <dd>{photo.storage}</dd>
          {photo.device && (
            <>
              <dt className="text-muted-foreground">Device</dt>
              <dd>{photo.device}</dd>
            </>
          )}
        </dl>
      </section>
    </div>
  )
}

/** 컬렉션 상세 — 뒤로·더보기 바, 큰 제목과 개수, 3열 그리드. */
function CollectionDetailPage({
  collection,
  onBack,
  onOpen,
  behavior = 'pinned',
}: {
  collection: Collection
  onBack: () => void
  onOpen: (photo: Photo) => void
  behavior?: AppBarBehavior
}) {
  const photos = collectionPhotos(collection)
  return (
    <>
      <AppBar behavior={behavior}>
        <AppBarBackButton onClick={onBack} />
        <AppBarActions>
          <Button variant="ghost" size="icon" aria-label="More" onClick={() => toast('More')}>
            <MoreVertical />
          </Button>
        </AppBarActions>
      </AppBar>
      <div className="px-5 pb-4">
        <h4 className="text-display-sm text-foreground">{collection.name}</h4>
        <p className="mt-1 text-caption text-muted-foreground">{photos.length} items</p>
      </div>
      <PhotoGrid photos={photos} onOpen={onOpen} />
    </>
  )
}

const COLLAGE_SECTIONS = ['Today', 'Yesterday', 'Thursday'] as const

/** 콜라주 만들기 — Create 탭 위로 시트로 올라온다. 사진을 눌러 고르고 Create. */
function CollagePage({ onClose }: { onClose: () => void }) {
  const [picked, setPicked] = React.useState<string[]>([])
  const toggle = (id: string) =>
    setPicked((list) =>
      list.includes(id) ? list.filter((x) => x !== id) : list.length < 6 ? [...list, id] : list
    )
  const sections = COLLAGE_SECTIONS.map((label, i) => ({
    label,
    photos: PHOTOS.slice(i * 6, i * 6 + 6),
  }))
  return (
    <div className="relative flex flex-1 flex-col bg-background">
      <AppBar behavior="pinned">
        <Button variant="ghost" size="sm" onClick={onClose}>
          Cancel
        </Button>
        <AppBarTitle className="flex-1 text-center">New collage</AppBarTitle>
        <AppBarActions className="pl-0">
          <Button
            variant="ghost"
            size="sm"
            disabled={picked.length === 0}
            onClick={() => {
              toast.success(`Collage of ${picked.length} photos created`)
              onClose()
            }}
          >
            Create
          </Button>
        </AppBarActions>
      </AppBar>
      <div className="px-gutter">
        <p className="text-center text-caption text-muted-foreground">Select 1–6 photos</p>
        <div className="mt-3 flex h-11 items-center gap-2 rounded-pill bg-muted px-4 text-label text-muted-foreground">
          <Search className="size-4" aria-hidden="true" />
          Search your photos
        </div>
      </div>
      <div className="flex-1 pb-24">
        {sections.map(({ label, photos }) => (
          <section key={label} className="mt-5">
            <div className="flex items-center gap-3 px-4 pb-3">
              <Circle
                className="size-5 text-subtle-foreground"
                strokeWidth={1.75}
                aria-hidden="true"
              />
              <h4 className="text-title-md text-foreground">{label}</h4>
            </div>
            <div className="grid grid-cols-3 gap-[2px] bg-background">
              {photos.map((p) => {
                const on = picked.includes(p.id)
                return (
                  <button
                    key={p.id}
                    type="button"
                    aria-pressed={on}
                    aria-label={p.description ?? p.takenAt}
                    onClick={() => toggle(p.id)}
                    className="relative aspect-square bg-muted"
                  >
                    <Img
                      src={p.thumb}
                      loading="lazy"
                      className={cn(
                        'h-full w-full object-cover transition-transform duration-fast',
                        on && 'scale-90'
                      )}
                    />
                    <span
                      className={cn(
                        'absolute top-2 left-2 flex size-5 items-center justify-center rounded-full border-2 border-white/90 shadow-raised',
                        on ? 'bg-primary text-primary-foreground' : 'bg-black/10'
                      )}
                    >
                      {on && <Check className="size-3" strokeWidth={3} aria-hidden="true" />}
                    </span>
                  </button>
                )
              })}
            </div>
          </section>
        ))}
      </div>
      <div className="sticky bottom-0 h-0">
        <Button
          variant="secondary"
          size="icon"
          aria-label="Resize"
          onClick={() => toast('Resize')}
          className="absolute right-4 bottom-6 size-12 rounded-card shadow-raised"
        >
          <Maximize2 />
        </Button>
      </div>
    </div>
  )
}

/* ── Bottom sheets the app opens ────────────────────────────────────── */

const CREATE_ITEMS = [
  ['Album', FolderPlus],
  ['Collage', LayoutGrid],
  ['Highlight video', Sparkles],
  ['Import photos', Upload],
] as const
const SEARCH_CHIPS = ['People', 'Places', 'Things', 'Screenshots', 'Favorites']
const RECENT = [
  'Seoraksan',
  'Beach',
  'Sunsets',
  'Dogs',
  'Receipts',
  'Kyoto',
  'Whiteboard',
  'Coffee',
  'Snow',
  'Concert',
  'Passport',
  'Bike',
  'Night sky',
  'Hanok',
]

function CreateSheet({
  open,
  onOpenChange,
  onCollage,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCollage?: () => void
}) {
  const screen = usePhoneScreen()
  return (
    <BottomSheet open={open} onOpenChange={onOpenChange}>
      <BottomSheetContent container={screen ?? undefined}>
        <BottomSheetHeader>
          <BottomSheetTitle>Create new</BottomSheetTitle>
        </BottomSheetHeader>
        <div className="grid gap-1 px-3 pb-4">
          {CREATE_ITEMS.map(([label, Icon]) => (
            <BottomSheetClose key={label} asChild>
              <Button
                variant="ghost"
                className="justify-start"
                onClick={() => (label === 'Collage' && onCollage ? onCollage() : toast(label))}
              >
                <Icon />
                {label}
              </Button>
            </BottomSheetClose>
          ))}
        </div>
      </BottomSheetContent>
    </BottomSheet>
  )
}

function SearchSheet({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const screen = usePhoneScreen()
  return (
    <BottomSheet open={open} onOpenChange={onOpenChange}>
      <BottomSheetContent container={screen ?? undefined} className="h-[440px]">
        <BottomSheetHeader>
          <BottomSheetTitle>Search</BottomSheetTitle>
          <BottomSheetDescription>People, places and things in your photos</BottomSheetDescription>
        </BottomSheetHeader>
        <div className="flex shrink-0 flex-wrap gap-2 px-5 pb-3">
          {SEARCH_CHIPS.map((c) => (
            <Chip key={c} size="sm" onClick={() => toast(c)}>
              {c}
            </Chip>
          ))}
        </div>
        <p className="px-5 pb-1 text-caption font-semibold text-muted-foreground">Recent</p>
        <ul className="phone-scroll min-h-0 flex-1 overflow-y-auto px-3 pb-4">
          {RECENT.map((term) => (
            <li key={term}>
              <BottomSheetClose asChild>
                <button
                  type="button"
                  onClick={() => toast(term)}
                  className="flex w-full items-center gap-3 rounded-control px-2 py-2.5 text-left text-label text-foreground transition-colors duration-fast hover:bg-accent"
                >
                  <Clock className="size-4 text-muted-foreground" aria-hidden="true" />
                  {term}
                </button>
              </BottomSheetClose>
            </li>
          ))}
        </ul>
      </BottomSheetContent>
    </BottomSheet>
  )
}

/* ── Overview hero — the whole app in one phone ─────────────────────── */

// 전환 규칙 (ssgoi 의 Google Photos 쇼케이스 그대로):
//  탭 셋은 shared-axis(y) 로 섞이고, 컬렉션 상세는 드릴인, 콜라주는 Create 탭 위로 시트로 오르고,
//  사진 그리드 ↔ 사진 상세는 같은 키를 단 이미지가 hero 로 이어지며 주변 크롬은 페이드한다.
const APP_TRANSITIONS: PageTransitionConfig = {
  transitions: [
    {
      ordered: TABS.map((t) => t.value),
      transition: axis({ type: 'y', variant: 'non-directional' }),
    },
    { on: '/c/*', transition: drill() },
    { on: '/collage', transition: sheet() },
    { from: ['/', '/c/*', '/p/*'], to: ['/', '/c/*', '/p/*'], transition: hero({ type: 'fade' }) },
  ],
}

export function AppShellExhibit() {
  const router = useMiniRouter('/')
  const { path } = router
  const [create, setCreate] = React.useState(false)
  const [search, setSearch] = React.useState(false)
  const openPhoto = (p: Photo) => router.push(`/p/${p.id}`)

  return (
    <MobileShell
      label="Photos app — switch tabs, open a photo or a collection, make a collage"
      path={path}
      routeKey={isTab(path) ? 'tabs' : undefined}
      config={APP_TRANSITIONS}
      onRefresh={() =>
        new Promise<void>((done) =>
          setTimeout(() => {
            toast.success('Backed up')
            done()
          }, 900)
        )
      }
    >
      {path.startsWith('/p/') ? (
        <PhotoDetailPage photo={photoById(path.slice(3))} onBack={router.back} />
      ) : path.startsWith('/c/') ? (
        <CollectionDetailPage
          collection={collectionById(path.slice(3))}
          onBack={router.back}
          onOpen={openPhoto}
        />
      ) : path === '/collage' ? (
        <CollagePage onClose={router.back} />
      ) : (
        // 탭 쉘 — 상단 바와 떠 있는 탭바가 살아남고, 안쪽 경계가 탭 페이지를 바꾼다.
        // 상단 바가 안쪽 경계 위에 있으므로 경계는 자기만의 relative 부모 안에 둔다.
        <>
          <TopAppBar onAdd={() => setCreate(true)} />
          <div className="relative flex flex-1 flex-col">
            <PageBoundary path={path} className="flex-1 bg-background">
              {path === '/' ? (
                <PhotosTab onOpen={openPhoto} />
              ) : path === '/collections' ? (
                <CollectionsTab onOpen={(c) => router.push(`/c/${c.id}`)} />
              ) : (
                <CreateTab onCollage={() => router.push('/collage')} />
              )}
            </PageBoundary>
          </div>
          <PhotosNav value={path} onChange={router.replace} onSearch={() => setSearch(true)} />
          <CreateSheet
            open={create}
            onOpenChange={setCreate}
            onCollage={() => router.push('/collage')}
          />
          <SearchSheet open={search} onOpenChange={setSearch} />
        </>
      )}
    </MobileShell>
  )
}

/* ── Page transition — one photo, four ways in ──────────────────────── */

const EFFECTS = {
  hero: { label: 'Hero', rule: { from: '/', to: '/p/*', transition: hero({ type: 'fade' }) } },
  zoom: { label: 'Zoom', rule: { from: '/', to: '/p/*', transition: zoom({ type: 'expand' }) } },
  drill: { label: 'Drill', rule: { on: '/p/**', transition: drill() } },
  fade: { label: 'Fade', rule: { from: '/', to: '/p/*', transition: fade() } },
} as const
type Effect = keyof typeof EFFECTS

export function PageTransitionExhibit() {
  const [effect, setEffect] = React.useState<Effect>('hero')
  const router = useMiniRouter('/')
  const config = React.useMemo<PageTransitionConfig>(
    () => ({ transitions: [EFFECTS[effect].rule] }),
    [effect]
  )
  return (
    <MobileShell
      label="Page transition demo — open a photo, then go back"
      path={router.path}
      config={config}
      footer={
        <SegmentedControl<Effect>
          aria-label="Grid to photo effect"
          value={effect}
          onValueChange={setEffect}
          options={(Object.keys(EFFECTS) as Effect[]).map((key) => ({
            label: EFFECTS[key].label,
            value: key,
          }))}
        />
      }
    >
      {router.path.startsWith('/p/') ? (
        <PhotoDetailPage photo={photoById(router.path.slice(3))} onBack={router.back} />
      ) : (
        <>
          <TopAppBar />
          <PhotoGrid photos={PHOTOS} onOpen={(p) => router.push(`/p/${p.id}`)} />
        </>
      )}
    </MobileShell>
  )
}

/* ── Bottom sheet ───────────────────────────────────────────────────── */

const NO_TRANSITIONS: PageTransitionConfig = { transitions: [] }

export function BottomSheetExhibit() {
  const [create, setCreate] = React.useState(false)
  const [search, setSearch] = React.useState(false)
  return (
    <MobileShell
      label="Bottom sheet demo — tap + or Search, then drag the handle down"
      path="/"
      config={NO_TRANSITIONS}
      footer="Tap + or Search. Drag the handle down, or tap it, to close."
    >
      <TopAppBar onAdd={() => setCreate(true)} />
      <div className="flex-1">
        <PhotoGrid
          photos={PHOTOS}
          keyed={false}
          onOpen={(p) => toast(p.description ?? p.takenAt)}
        />
      </div>
      <PhotosNav value="/" onChange={() => undefined} onSearch={() => setSearch(true)} />
      <CreateSheet open={create} onOpenChange={setCreate} />
      <SearchSheet open={search} onOpenChange={setSearch} />
    </MobileShell>
  )
}

/* ── App bar ────────────────────────────────────────────────────────── */

type BarMode = AppBarBehavior | 'hero'

export function AppBarExhibit() {
  const [mode, setMode] = React.useState<BarMode>('reveal')
  const places = collectionById('col-place')
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
          <PhotoDetailPage photo={photoById('ph-003')} onBack={() => toast('Back')} />
        ) : (
          <CollectionDetailPage
            collection={places}
            behavior={mode}
            onBack={() => toast('Back')}
            onOpen={(p) => toast(p.description ?? p.takenAt)}
          />
        )}
      </PhoneScreen>
    </PhoneStage>
  )
}

/* ── Bottom nav ─────────────────────────────────────────────────────── */

export function BottomNavExhibit() {
  const [tab, setTab] = React.useState('/')
  return (
    <PhoneStage
      label="Bottom nav demo — tap a tab, scroll to shrink the bar"
      footer="Tap a tab. Scroll to shrink the bar."
    >
      <PhoneScreen resetKey={tab}>
        <TopAppBar behavior="flow" />
        <div className="flex-1 pb-4">
          {tab === '/' ? (
            <PhotoGrid
              photos={PHOTOS}
              keyed={false}
              onOpen={(p) => toast(p.description ?? p.takenAt)}
            />
          ) : tab === '/collections' ? (
            <CollectionsTab onOpen={(c) => toast(c.name)} />
          ) : tab === '/create' ? (
            <CreateTab onCollage={() => toast('Collage')} />
          ) : (
            <div className="space-y-4 px-gutter py-4">
              <div className="flex h-11 items-center gap-2 rounded-pill bg-muted px-4 text-label text-muted-foreground">
                <Search className="size-4" aria-hidden="true" />
                Search your photos
              </div>
              <div className="flex flex-wrap gap-2">
                {SEARCH_CHIPS.map((c) => (
                  <Chip key={c} size="sm" onClick={() => toast(c)}>
                    {c}
                  </Chip>
                ))}
              </div>
              <PhotoGrid
                photos={PHOTOS.slice(0, 9)}
                keyed={false}
                onOpen={(p) => toast(p.description ?? p.takenAt)}
              />
            </div>
          )}
        </div>
        <BottomNav value={tab} onValueChange={setTab}>
          {NAV_TABS.map((t) => (
            <BottomNavItem key={t.value} value={t.value} label={t.label} icon={t.icon} />
          ))}
        </BottomNav>
      </PhoneScreen>
    </PhoneStage>
  )
}

/* ── Pull to refresh ────────────────────────────────────────────────── */

export function PullToRefreshExhibit() {
  const [photos, setPhotos] = React.useState<Photo[]>(() => PHOTOS.slice(3))
  const next = React.useRef(0)
  const refresh = () =>
    new Promise<void>((done) =>
      setTimeout(() => {
        const incoming = PHOTOS.slice(next.current % 3, (next.current % 3) + 1)
        next.current += 1
        setPhotos((list) => [
          ...incoming.map((p) => ({ ...p, id: `${p.id}-${Date.now()}` })),
          ...list,
        ])
        toast.success('1 photo backed up')
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
          <Pinwheel className="ml-1 size-7 shrink-0" />
          <AppBarTitle className="text-label font-medium text-soft-foreground">Photos</AppBarTitle>
          <AppBarActions>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Back up"
              onClick={() => toast('Backing up…')}
            >
              <CloudUpload />
            </Button>
          </AppBarActions>
        </AppBar>
        <p className="px-gutter pt-1 pb-2 text-title-sm text-foreground">Today</p>
        <div className="grid grid-cols-3 gap-[2px] bg-background pb-8">
          {photos.map((p) => (
            <div
              key={p.id}
              className="relative aspect-square bg-muted animate-in fade-in-0 zoom-in-95"
            >
              <Img src={p.thumb} loading="lazy" className="h-full w-full object-cover" />
            </div>
          ))}
        </div>
      </PhoneScreen>
    </PhoneStage>
  )
}

/* ── Glass ──────────────────────────────────────────────────────────── */

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
