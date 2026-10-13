'use client'

import { Copy, useCopy } from '@/i18n/copy'
import { useTranslations } from 'next-intl'

import * as React from 'react'
import {
  ArchiveIcon,
  ArrowLeftIcon,
  BellIcon,
  BatteryFullIcon,
  CheckIcon,
  CircleIcon,
  ClockIcon,
  CloudUploadIcon,
  FilmIcon,
  FolderPlusIcon,
  HeartIcon,
  ImageIcon,
  LayoutGridIcon,
  Maximize2Icon,
  MoreVerticalIcon,
  PhoneIcon,
  PlayIcon,
  PlusIcon,
  SearchIcon,
  SignalHighIcon,
  SparklesIcon,
  Trash2Icon,
  UploadIcon,
  WifiIcon,
} from '@comwit/ui/icons'
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

// Pass the phone screen as the portal container to keep sheets and scrims inside the device.
const PhoneScreenContext = React.createContext<HTMLDivElement | null>(null)
export const usePhoneScreen = () => React.useContext(PhoneScreenContext)
/** Scroller height: 592px screen minus 34px status bar. Fullscreen canvases use this value. */
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
  const localize = useCopy()

  const [screen, setScreen] = React.useState<HTMLDivElement | null>(null)
  return (
    <div className={cn('phone', className)} role="group" aria-label={localize(label)}>
      <div ref={setScreen} className="phone-screen">
        <div className="phone-status" aria-hidden="true">
          <span>9:41</span>
          <span className="phone-island" />
          <span className="flex items-center gap-1">
            <SignalHighIcon className="size-3.5" strokeWidth={2.5} />
            <WifiIcon className="size-3.5" strokeWidth={2.5} />
            <BatteryFullIcon className="size-4" strokeWidth={2} />
          </span>
        </div>
        <PhoneScreenContext.Provider value={screen}>{children}</PhoneScreenContext.Provider>
        <div className="phone-home" aria-hidden="true" />
      </div>
    </div>
  )
}

/**
 * Shared phone exhibit frame. The fixed h-9 footer keeps card heights equal whether it contains controls or a caption.
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
  const localize = useCopy()

  return (
    <div className="flex flex-col items-center gap-5">
      <PhoneFrame label={localize(label)}>{children}</PhoneFrame>
      {footer !== undefined && (
        <div className="flex h-9 items-center justify-center text-center text-caption text-muted-foreground">
          {typeof footer === 'string' ? localize(footer) : footer}
        </div>
      )}
    </div>
  )
}

/** The phone scroller shares ScrollChrome intent with its app bar and bottom navigation. */
function PhoneScreen({
  children,
  onRefresh,
  resetKey,
  resetScroll = true,
}: {
  children: React.ReactNode
  onRefresh?: () => Promise<unknown>
  resetKey?: unknown
  /** Disable when page transitions manage scroll restoration and resets themselves. */
  resetScroll?: boolean
}) {
  const scrollRef = React.useRef<HTMLDivElement>(null)
  React.useEffect(() => {
    if (resetScroll) scrollRef.current?.scrollTo({ top: 0 })
  }, [resetKey, resetScroll])
  // The scroller is not a flex container: pages grow with content so sticky app and tab bars retain their flow positions.
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
 * Minimal router substitute: path identifies the page and push/back update the stack. Real apps use the router pathname through RouteBoundary.
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
 * Phone shell: scroller, transition provider, and route boundary. Changing path replaces the boundary key while the engine animates the outgoing page. Persistent tab shells keep routeKey fixed and nest another boundary.
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
  const localize = useCopy()

  return (
    <PhoneStage label={localize(label)} footer={footer}>
      <PhoneScreen resetKey={path} resetScroll={false} onRefresh={onRefresh}>
        {/* The shell grows from min-h-full to fit content. flex-1 fills the screen only for short pages. */}
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

/** Four-color pinwheel logo. */
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
  { value: '/collections', label: 'Collections', icon: <LayoutGridIcon /> },
  { value: '/create', label: 'Create', icon: <SparklesIcon /> },
]
const isTab = (path: string) => TABS.some((t) => t.value === path)
/** The fourth tab slot opens a search sheet instead of navigating. */
const SEARCH_TAB = { value: '/search', label: 'Search', icon: <SearchIcon /> }
const NAV_TABS = [...TABS, SEARCH_TAB]

/** Tab-shell app bar: logo, add, notifications, and profile. */
function TopAppBar({
  onAdd,
  behavior = 'pinned',
}: {
  onAdd?: () => void
  behavior?: AppBarBehavior
}) {
  const localize = useCopy()

  const copy = useTranslations('Copy')

  return (
    <AppBar behavior={behavior}>
      <Pinwheel className="ml-1 size-7 shrink-0" />
      <AppBarTitle className="text-label font-medium text-soft-foreground">
        <Copy id="text164" />
      </AppBarTitle>
      <AppBarActions>
        <Button
          variant="ghost"
          size="icon"
          aria-label={copy('text165')}
          onClick={onAdd ?? (() => toast(localize('Add')))}
        >
          <PlusIcon />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label={copy('text166')}
          className="relative"
          onClick={() => toast(localize('Backup complete'))}
        >
          <BellIcon />
          <span className="absolute top-2 right-2.5 size-2 rounded-full bg-destructive" />
        </Button>
        <Button
          variant="plain"
          size="none"
          type="button"
          aria-label={copy('text167')}
          onClick={() => toast(localize('Account'))}
          className="ml-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-caption font-semibold text-primary-foreground"
        >
          D
        </Button>
      </AppBarActions>
    </AppBar>
  )
}

/** Glass BottomNav capsule: three tabs plus search. Search opens a sheet without changing the selected value. */
function PhotosNav({
  value,
  onChange,
  onSearch,
}: {
  value: string
  onChange: (path: string) => void
  onSearch: () => void
}) {
  const localize = useCopy()

  const copy = useTranslations('Copy')

  return (
    <BottomNav
      aria-label={copy('text169')}
      value={value}
      onValueChange={(next) => (next === SEARCH_TAB.value ? onSearch() : onChange(next))}
    >
      {NAV_TABS.map((t) => (
        <BottomNavItem key={t.value} value={t.value} label={localize(t.label)} icon={t.icon} />
      ))}
    </BottomNav>
  )
}

/** Three-column square grid. Each image carries the source key for hero/zoom transitions. */
function PhotoGrid({
  photos,
  onOpen,
  keyed = true,
}: {
  photos: Photo[]
  onOpen: (photo: Photo) => void
  keyed?: boolean
}) {
  const localize = useCopy()

  return (
    <div className="grid grid-cols-3 gap-[2px] bg-background">
      {photos.map((p) => (
        <Button
          variant="plain"
          size="none"
          key={p.id}
          type="button"
          aria-label={localize(p.description ?? p.takenAt)}
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
        </Button>
      ))}
    </div>
  )
}

function PhotosTab({ onOpen }: { onOpen: (photo: Photo) => void }) {
  return <PhotoGrid photos={PHOTOS} onOpen={onOpen} />
}

/** Collection card: 2x2 preview grid, name, and count. */
function CollectionCard({ collection, onOpen }: { collection: Collection; onOpen: () => void }) {
  const covers = collectionPhotos(collection).slice(0, 4)
  return (
    <Button
      variant="plain"
      size="none"
      type="button"
      onClick={onOpen}
      className="flex flex-col items-stretch gap-2 text-left"
    >
      <div className="grid aspect-square w-full grid-cols-2 grid-rows-2 gap-[2px] overflow-hidden rounded-card bg-muted">
        {covers.map((p) => (
          <Img key={p.id} src={p.thumb} loading="lazy" className="h-full w-full object-cover" />
        ))}
        {Array.from({ length: Math.max(0, 4 - covers.length) }, (_, i) => (
          <div key={i} className="bg-muted" />
        ))}
      </div>
      <div className="px-1">
        <p className="truncate text-label font-medium text-foreground">
          <Copy text={collection.name} />
        </p>
        <p className="text-caption text-muted-foreground">{collection.photoIds.length}</p>
      </div>
    </Button>
  )
}

const UTILITIES = [
  ['Favorites', HeartIcon],
  ['Trash', Trash2Icon],
  ['Videos', FilmIcon],
  ['Archive', ArchiveIcon],
] as const

function CollectionsTab({ onOpen }: { onOpen: (collection: Collection) => void }) {
  const localize = useCopy()

  return (
    <div className="space-y-4 px-gutter py-4">
      <div className="grid grid-cols-2 gap-3">
        {UTILITIES.map(([label, Icon]) => (
          <Button
            variant="plain"
            size="none"
            key={label}
            type="button"
            onClick={() => toast(localize(label))}
            className="flex items-center justify-start gap-3 rounded-pill bg-muted px-4 py-3 text-left text-label font-medium text-foreground transition-colors duration-fast hover:bg-accent"
          >
            <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
            <Copy text={label} />
          </Button>
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
    Icon: LayoutGridIcon,
    tint: 'bg-info-surface text-info-surface-foreground',
    enabled: true,
  },
  {
    label: 'Highlight video',
    Icon: SparklesIcon,
    tint: 'bg-destructive-surface text-destructive-surface-foreground',
  },
  {
    label: 'Cinematic motion',
    Icon: FilmIcon,
    tint: 'bg-success-surface text-success-surface-foreground',
  },
  {
    label: 'Animation',
    Icon: PlayIcon,
    tint: 'bg-warning-surface text-warning-surface-foreground',
  },
]

function CreateTab({ onCollage }: { onCollage: () => void }) {
  return (
    <div className="space-y-6 px-gutter py-4">
      <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-card bg-linear-to-br from-[#8E5BE8] via-[#7B5BE8] to-[#5F76F5]">
        <span className="rounded-pill bg-white/95 px-5 py-2 text-label font-semibold text-black shadow-raised">
          <Copy id="text170" />{' '}
        </span>
        <span className="absolute -top-6 -left-6 size-24 rounded-full bg-white/10" />
        <span className="absolute -right-4 -bottom-4 size-20 rounded-full bg-white/15" />
      </div>
      <section>
        <h4 className="mb-3 text-title-md text-foreground">
          <Copy id="text171" />
        </h4>
        <div className="grid grid-cols-2 gap-3">
          {TOOLS.map(({ label, Icon, tint, enabled }) => (
            <Button
              variant="plain"
              size="none"
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
              <span className="text-label font-medium text-foreground">
                <Copy text={label} />
              </span>
              {!enabled && (
                <span className="absolute top-3 right-3 rounded-pill bg-border px-2 py-0.5 text-micro font-medium text-muted-foreground">
                  <Copy id="text172" />{' '}
                </span>
              )}
            </Button>
          ))}
        </div>
      </section>
    </div>
  )
}

/** Photo detail: back button, fullscreen hero/zoom destination, and metadata below the fold. */
function PhotoDetailPage({ photo, onBack }: { photo: Photo; onBack: () => void }) {
  const copy = useTranslations('Copy')

  return (
    <div className="relative flex flex-1 flex-col bg-background">
      <GlassButton
        shape="circle"
        shadow={false}
        aria-label={copy('text173')}
        onClick={onBack}
        className="absolute top-3 left-3 z-raised size-10"
      >
        <ArrowLeftIcon className="size-5" />
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
          <h4 className="text-title-md text-foreground">
            <Copy text={photo.description} />
          </h4>
        )}
        <dl className="grid grid-cols-[110px_1fr] gap-y-3 text-body-sm text-foreground">
          <dt className="text-muted-foreground">
            <Copy id="text174" />
          </dt>
          <dd>{photo.takenAt}</dd>
          {photo.location && (
            <>
              <dt className="text-muted-foreground">
                <Copy id="text175" />
              </dt>
              <dd>
                <Copy text={photo.location} />
              </dd>
            </>
          )}
          <dt className="text-muted-foreground">
            <Copy id="text176" />
          </dt>
          <dd>
            {photo.width} × {photo.height}
          </dd>
          <dt className="text-muted-foreground">
            <Copy id="text177" />
          </dt>
          <dd>{photo.fileSize}</dd>
          <dt className="text-muted-foreground">
            <Copy id="text178" />
          </dt>
          <dd>
            <Copy text={photo.storage} />
          </dd>
          {photo.device && (
            <>
              <dt className="text-muted-foreground">
                <Copy id="text179" />
              </dt>
              <dd>{photo.device}</dd>
            </>
          )}
        </dl>
      </section>
    </div>
  )
}

/** Collection detail: back/more bar, title and count, and a three-column grid. */
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
  const localize = useCopy()

  const copy = useTranslations('Copy')

  const photos = collectionPhotos(collection)
  return (
    <>
      <AppBar behavior={behavior}>
        <AppBarBackButton onClick={onBack} />
        <AppBarActions>
          <Button
            variant="ghost"
            size="icon"
            aria-label={copy('text180')}
            onClick={() => toast(localize('More'))}
          >
            <MoreVerticalIcon />
          </Button>
        </AppBarActions>
      </AppBar>
      <div className="px-5 pb-4">
        <h4 className="text-display-sm text-foreground">
          <Copy text={collection.name} />
        </h4>
        <p className="mt-1 text-caption text-muted-foreground">
          {photos.length} <Copy id="text181" />
        </p>
      </div>
      <PhotoGrid photos={photos} onOpen={onOpen} />
    </>
  )
}

const COLLAGE_SECTIONS = ['Today', 'Yesterday', 'Thursday'] as const

/** Collage creation sheet above the Create tab. Select photos, then Create. */
function CollagePage({ onClose }: { onClose: () => void }) {
  const localize = useCopy()

  const copy = useTranslations('Copy')

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
          <Copy id="text182" />{' '}
        </Button>
        <AppBarTitle className="flex-1 text-center">
          <Copy id="text183" />
        </AppBarTitle>
        <AppBarActions className="pl-0">
          <Button
            variant="ghost"
            size="sm"
            disabled={picked.length === 0}
            onClick={() => {
              toast.success(copy('collageCreated', { count: picked.length }))
              onClose()
            }}
          >
            <Copy id="text170" />{' '}
          </Button>
        </AppBarActions>
      </AppBar>
      <div className="px-gutter">
        <p className="text-center text-caption text-muted-foreground">
          <Copy id="text184" />
        </p>
        <div className="mt-3 flex h-11 items-center gap-2 rounded-pill bg-muted px-4 text-label text-muted-foreground">
          <SearchIcon className="size-4" aria-hidden="true" />
          <Copy id="text185" />{' '}
        </div>
      </div>
      <div className="flex-1 pb-24">
        {sections.map(({ label, photos }) => (
          <section key={label} className="mt-5">
            <div className="flex items-center gap-3 px-4 pb-3">
              <CircleIcon
                className="size-5 text-subtle-foreground"
                strokeWidth={1.75}
                aria-hidden="true"
              />
              <h4 className="text-title-md text-foreground">
                <Copy text={label} />
              </h4>
            </div>
            <div className="grid grid-cols-3 gap-[2px] bg-background">
              {photos.map((p) => {
                const on = picked.includes(p.id)
                return (
                  <Button
                    variant="plain"
                    size="none"
                    key={p.id}
                    type="button"
                    aria-pressed={on}
                    aria-label={localize(p.description ?? p.takenAt)}
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
                      {on && <CheckIcon className="size-3" strokeWidth={3} aria-hidden="true" />}
                    </span>
                  </Button>
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
          aria-label={copy('text186')}
          onClick={() => toast(localize('Resize'))}
          className="absolute right-4 bottom-6 size-12 rounded-card shadow-raised"
        >
          <Maximize2Icon />
        </Button>
      </div>
    </div>
  )
}

/* ── Bottom sheets the app opens ────────────────────────────────────── */

const CREATE_ITEMS = [
  ['Album', FolderPlusIcon],
  ['Collage', LayoutGridIcon],
  ['Highlight video', SparklesIcon],
  ['Import photos', UploadIcon],
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
  const localize = useCopy()

  const screen = usePhoneScreen()
  return (
    <BottomSheet open={open} onOpenChange={onOpenChange}>
      <BottomSheetContent container={screen ?? undefined}>
        <BottomSheetHeader>
          <BottomSheetTitle>
            <Copy id="text187" />
          </BottomSheetTitle>
        </BottomSheetHeader>
        <div className="grid gap-1 px-3 pb-4">
          {CREATE_ITEMS.map(([label, Icon]) => (
            <BottomSheetClose key={label} asChild>
              <Button
                variant="ghost"
                className="justify-start"
                onClick={() =>
                  label === 'Collage' && onCollage ? onCollage() : toast(localize(label))
                }
              >
                <Icon />
                <Copy text={label} />
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
  const localize = useCopy()

  const screen = usePhoneScreen()
  return (
    <BottomSheet open={open} onOpenChange={onOpenChange}>
      <BottomSheetContent container={screen ?? undefined} className="h-[440px]">
        <BottomSheetHeader>
          <BottomSheetTitle>
            <Copy id="text188" />
          </BottomSheetTitle>
          <BottomSheetDescription>
            <Copy id="text189" />
          </BottomSheetDescription>
        </BottomSheetHeader>
        <div className="flex shrink-0 flex-wrap gap-2 px-5 pb-3">
          {SEARCH_CHIPS.map((c) => (
            <Chip key={c} size="sm" onClick={() => toast(localize(c))}>
              <Copy text={c} />
            </Chip>
          ))}
        </div>
        <p className="px-5 pb-1 text-caption font-semibold text-muted-foreground">
          <Copy id="text190" />
        </p>
        <ul className="phone-scroll min-h-0 flex-1 overflow-y-auto px-3 pb-4">
          {RECENT.map((term) => (
            <li key={term}>
              <BottomSheetClose asChild>
                <Button
                  variant="plain"
                  size="none"
                  type="button"
                  onClick={() => toast(localize(term))}
                  className="flex w-full items-center justify-start gap-3 rounded-control px-2 py-2.5 text-left text-label text-foreground transition-colors duration-fast hover:bg-accent"
                >
                  <ClockIcon className="size-4 text-muted-foreground" aria-hidden="true" />
                  <Copy text={term} />
                </Button>
              </BottomSheetClose>
            </li>
          ))}
        </ul>
      </BottomSheetContent>
    </BottomSheet>
  )
}

/* ── Overview hero — the whole app in one phone ─────────────────────── */

// Transition rules from the SSGOI Google Photos showcase:
// The three tabs share the y axis, collections drill in, and the collage sheet rises over Create.
// Matching image keys connect the grid and photo detail through a hero transition while surrounding controls fade.
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
  const copy = useTranslations('Copy')

  const router = useMiniRouter('/')
  const { path } = router
  const [create, setCreate] = React.useState(false)
  const [search, setSearch] = React.useState(false)
  const openPhoto = (p: Photo) => router.push(`/p/${p.id}`)

  return (
    <MobileShell
      label={copy('text191')}
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
        // Persistent tab shell: app bar and floating tab bar survive while the inner boundary switches pages.
        // The app bar sits above the inner boundary, which needs its own relative parent.
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
  const localize = useCopy()

  const copy = useTranslations('Copy')

  const [effect, setEffect] = React.useState<Effect>('hero')
  const router = useMiniRouter('/')
  const config = React.useMemo<PageTransitionConfig>(
    () => ({ transitions: [EFFECTS[effect].rule] }),
    [effect]
  )
  return (
    <MobileShell
      label={copy('text192')}
      path={router.path}
      config={config}
      footer={
        <SegmentedControl<Effect>
          aria-label={copy('text193')}
          value={effect}
          onValueChange={setEffect}
          options={(Object.keys(EFFECTS) as Effect[]).map((key) => ({
            label: localize(EFFECTS[key].label),
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
  const localize = useCopy()

  const copy = useTranslations('Copy')

  const [create, setCreate] = React.useState(false)
  const [search, setSearch] = React.useState(false)
  return (
    <MobileShell
      label={copy('text194')}
      path="/"
      config={NO_TRANSITIONS}
      footer="Tap + or Search. Drag the handle down, or tap it, to close."
    >
      <TopAppBar onAdd={() => setCreate(true)} />
      <div className="flex-1">
        <PhotoGrid
          photos={PHOTOS}
          keyed={false}
          onOpen={(p) => toast(localize(p.description ?? p.takenAt))}
        />
      </div>
      <PhotosNav value="/" onChange={() => undefined} onSearch={() => setSearch(true)} />
      <CreateSheet open={create} onOpenChange={setCreate} />
      <SearchSheet open={search} onOpenChange={setSearch} />
    </MobileShell>
  )
}

/* ── App bar ────────────────────────────────────────────────────────── */

export function AppBarExhibit() {
  const localize = useCopy()

  const copy = useTranslations('Copy')

  const [mode, setMode] = React.useState<AppBarBehavior>('reveal')
  return (
    <PhoneStage
      label={copy('text195')}
      footer={
        <SegmentedControl<AppBarBehavior>
          aria-label={copy('text196')}
          value={mode}
          onValueChange={setMode}
          options={[
            { label: localize('Reveal'), value: 'reveal' },
            { label: localize('Pinned'), value: 'pinned' },
            { label: localize('Flow'), value: 'flow' },
          ]}
        />
      }
    >
      <PhoneScreen resetKey={mode}>
        {/* The full library is taller than the screen to demonstrate the app bar hiding and revealing on scroll. */}
        <TopAppBar behavior={mode} />
        <p className="px-gutter pt-1 pb-2 text-title-sm text-foreground">
          <Copy id="text197" />
        </p>
        <div className="pb-8">
          <PhotoGrid
            photos={PHOTOS}
            keyed={false}
            onOpen={(p) => toast(localize(p.description ?? p.takenAt))}
          />
        </div>
      </PhoneScreen>
    </PhoneStage>
  )
}

/* ── Bottom nav ─────────────────────────────────────────────────────── */

export function BottomNavExhibit() {
  const localize = useCopy()

  const copy = useTranslations('Copy')

  const [tab, setTab] = React.useState('/')
  return (
    <PhoneStage label={copy('text198')} footer="Tap a tab. Scroll to shrink the bar.">
      <PhoneScreen resetKey={tab}>
        <TopAppBar behavior="flow" />
        <div className="flex-1 pb-4">
          {tab === '/' ? (
            <PhotoGrid
              photos={PHOTOS}
              keyed={false}
              onOpen={(p) => toast(localize(p.description ?? p.takenAt))}
            />
          ) : tab === '/collections' ? (
            <CollectionsTab onOpen={(c) => toast(localize(c.name))} />
          ) : tab === '/create' ? (
            <CreateTab onCollage={() => toast(localize('Collage'))} />
          ) : (
            <div className="space-y-4 px-gutter py-4">
              <div className="flex h-11 items-center gap-2 rounded-pill bg-muted px-4 text-label text-muted-foreground">
                <SearchIcon className="size-4" aria-hidden="true" />
                <Copy id="text185" />{' '}
              </div>
              <div className="flex flex-wrap gap-2">
                {SEARCH_CHIPS.map((c) => (
                  <Chip key={c} size="sm" onClick={() => toast(localize(c))}>
                    <Copy text={c} />
                  </Chip>
                ))}
              </div>
              <PhotoGrid
                photos={PHOTOS.slice(0, 9)}
                keyed={false}
                onOpen={(p) => toast(localize(p.description ?? p.takenAt))}
              />
            </div>
          )}
        </div>
        <BottomNav value={tab} onValueChange={setTab}>
          {NAV_TABS.map((t) => (
            <BottomNavItem key={t.value} value={t.value} label={localize(t.label)} icon={t.icon} />
          ))}
        </BottomNav>
      </PhoneScreen>
    </PhoneStage>
  )
}

/* ── Pull to refresh ────────────────────────────────────────────────── */

export function PullToRefreshExhibit() {
  const localize = useCopy()

  const copy = useTranslations('Copy')

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
    <PhoneStage label={copy('text199')} footer="Drag down from the top with a finger or the mouse.">
      <PhoneScreen onRefresh={refresh}>
        <AppBar behavior="pinned">
          <Pinwheel className="ml-1 size-7 shrink-0" />
          <AppBarTitle className="text-label font-medium text-soft-foreground">
            <Copy id="text164" />
          </AppBarTitle>
          <AppBarActions>
            <Button
              variant="ghost"
              size="icon"
              aria-label={copy('text200')}
              onClick={() => toast(localize('Backing up…'))}
            >
              <CloudUploadIcon />
            </Button>
          </AppBarActions>
        </AppBar>
        <p className="px-gutter pt-1 pb-2 text-title-sm text-foreground">
          <Copy id="text197" />
        </p>
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

/** Four glass materials over photos that reveal refraction. Drag the capsule lens or use the arrow keys. */
export function GlassExhibit() {
  const copy = useTranslations('Copy')

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
          <Copy id="text201" />{' '}
        </p>
        <div className="relative grid grid-cols-2 gap-3 md:grid-cols-4">
          {MATERIALS.map((m) => (
            <div
              key={m.variant}
              className="relative isolate flex h-36 flex-col justify-end rounded-card p-4"
            >
              <Glass variant={m.variant} shape="panel" />
              <span className="relative z-raised text-title-sm text-foreground">
                <Copy text={m.name} />
              </span>
              <span className="relative z-raised text-caption text-soft-foreground">
                <Copy text={m.use} />
              </span>
            </div>
          ))}
        </div>
        <div ref={track} className="relative mt-24 h-16 sm:mt-28">
          <GlassButton
            aria-label={copy('text202')}
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
            <HeartIcon className="size-4" /> <Copy id="text203" />{' '}
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
  const copy = useTranslations('Copy')

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
          <ChatDescription>
            <Copy id="text206" />
          </ChatDescription>
        </div>
        <ChatHeaderActions>
          <Button variant="ghost" size="icon" aria-label={copy('text207')}>
            <PhoneIcon />
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
            <ChatDivider>
              <Copy text={m.text} />
            </ChatDivider>
          ) : (
            <ChatMessage
              align={m.from === 'me' ? 'end' : 'start'}
              avatar={m.from === 'ava' ? ava : undefined}
            >
              <ChatBubble>
                <Copy text={m.text} />
              </ChatBubble>
              <ChatMessageMeta>{m.time}</ChatMessageMeta>
            </ChatMessage>
          )
        }
      </ChatMessages>
      <ChatComposer placeholder={copy('text208')} onSend={send} className="pb-7" />
    </Chat>
  )
}

function AssistantScreen() {
  const localize = useCopy()

  const copy = useTranslations('Copy')

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
    const words = localize(CHAT_ANSWER).split(' ')
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
          <SparklesIcon className="size-4" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <ChatTitle>
            <Copy id="text209" />
          </ChatTitle>
          <ChatDescription>
            <Copy id="text210" />
          </ChatDescription>
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
            <ChatBubble>
              <Copy text={turn.text} />
            </ChatBubble>
          </ChatMessage>
        )}
      </ChatMessages>
      <ChatComposer
        placeholder={copy('text211')}
        onSend={send}
        pending={pending}
        onStop={stop}
        className="pb-7"
      />
    </Chat>
  )
}

/** Two chat scroll modes: bottom-pinned messenger and assistant mode with the user's message pinned above streamed output. */
export function ChatExhibit() {
  const localize = useCopy()

  const copy = useTranslations('Copy')

  const [mode, setMode] = React.useState<ChatMode>('messenger')
  return (
    <PhoneStage
      label={copy('text212')}
      footer={
        <SegmentedControl
          value={mode}
          onValueChange={(v) => setMode(v as ChatMode)}
          options={[
            { value: 'messenger', label: localize('Messenger') },
            { value: 'assistant', label: localize('Assistant') },
          ]}
          aria-label={copy('text213')}
        />
      }
    >
      {mode === 'messenger' ? <MessengerScreen /> : <AssistantScreen />}
    </PhoneStage>
  )
}

/** Exhibit used in a gallery card instead of a spec example. */
export const EXHIBITS: Record<string, React.ComponentType> = {
  'app-bar': AppBarExhibit,
  'bottom-nav': BottomNavExhibit,
  'page-transition': PageTransitionExhibit,
  'bottom-sheet': BottomSheetExhibit,
  'pull-to-refresh': PullToRefreshExhibit,
  chat: ChatExhibit,
  glass: GlassExhibit,
}
