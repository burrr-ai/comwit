import * as React from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { useGlassLensSupport } from '@comwit/ui'
import { Button } from '@comwit/ui-templates/button'
import { GlassSurface, type GlassPanelVariant } from '@comwit/ui-templates/glass'
import { Popover, PopoverTrigger, PopoverContent } from '@comwit/ui-templates/popover'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from '@comwit/ui-templates/dropdown-menu'

const meta = {
  title: 'Components/Glass',
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

function PanelActions({ variant }: { variant: GlassPanelVariant }) {
  return (
    <div className="flex flex-wrap gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button size="sm" variant="outline" aria-label={`Open ${variant} popover`}>
            Popover
          </Button>
        </PopoverTrigger>
        <PopoverContent glassVariant={variant} className="w-64" side="top">
          <p className="text-title-sm">Share this board</p>
          <p className="mt-1 text-body-sm text-muted-foreground">Anyone with the link can view.</p>
          <p className="mt-3 text-body-sm">comwit.io/b/q3-launch</p>
        </PopoverContent>
      </Popover>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" variant="outline" aria-label={`Open ${variant} menu`}>
            Dropdown
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent glassVariant={variant} className="w-52" side="top">
          <DropdownMenuLabel>My account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Profile</DropdownMenuItem>
          <DropdownMenuItem>Settings</DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Share</DropdownMenuSubTrigger>
            <DropdownMenuSubContent glassVariant={variant} className="w-44">
              <DropdownMenuItem>Copy link</DropdownMenuItem>
              <DropdownMenuItem>Email link</DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive">Log out</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

function OverlayPanelPreview() {
  const [dark, setDark] = React.useState(true)
  const [position, setPosition] = React.useState(0)
  const [playing, setPlaying] = React.useState(false)
  const [showSurfaces, setShowSurfaces] = React.useState(true)
  const backdrop = React.useRef<HTMLDivElement>(null)
  const hasLens = useGlassLensSupport()
  const positionId = React.useId()
  const surfaceId = React.useId()

  // Portaled overlays need the document's theme. Restore the previous theme on story exit.
  React.useEffect(() => {
    const root = document.documentElement
    const previous = root.classList.contains('dark')
    root.classList.toggle('dark', dark)
    return () => {
      root.classList.toggle('dark', previous)
    }
  }, [dark])

  React.useEffect(() => {
    if (!playing) return
    const animation = backdrop.current?.animate(
      [{ transform: 'translateX(-100px)' }, { transform: 'translateX(100px)' }],
      { duration: 6000, iterations: Infinity, direction: 'alternate', easing: 'ease-in-out' }
    )
    return () => animation?.cancel()
  }, [playing])

  return (
    <div className="w-[min(92vw,1040px)] space-y-5 text-foreground">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-xl space-y-1">
          <h2 className="text-title">See through the glass</h2>
          <p className="text-body-sm text-muted-foreground">
            Move the lettering and grid behind the panels. Watch the straight lines bend at the
            morphing edges.
          </p>
          <p className="text-caption text-muted-foreground" role="status">
            {hasLens
              ? 'Edge refraction is active in this browser.'
              : 'This browser uses blur only. Open in Chromium to see edge refraction.'}
          </p>
        </div>
        <Button variant="outline" aria-pressed={dark} onClick={() => setDark((value) => !value)}>
          {dark ? 'Dark mode' : 'Light mode'}
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-card bg-muted p-4">
        <div className="flex min-w-56 flex-1 items-center gap-3">
          <label htmlFor={positionId} className="shrink-0 text-body-sm">
            Move backdrop
          </label>
          <input
            id={positionId}
            type="range"
            min="-100"
            max="100"
            value={position}
            disabled={playing}
            onChange={(event) => setPosition(Number(event.target.value))}
            className="w-full accent-primary"
          />
        </div>
        <Button
          size="sm"
          variant="outline"
          aria-pressed={playing}
          onClick={() => setPlaying((value) => !value)}
        >
          {playing ? 'Pause backdrop' : 'Animate backdrop'}
        </Button>
        <label htmlFor={surfaceId} className="flex items-center gap-2 text-body-sm">
          <input
            id={surfaceId}
            type="checkbox"
            checked={showSurfaces}
            onChange={(event) => setShowSurfaces(event.target.checked)}
            className="accent-primary"
          />
          Show glass
        </label>
      </div>

      <div
        data-testid="glass-comparison-stage"
        className="relative overflow-hidden rounded-sheet bg-[#405864]"
      >
        <div
          ref={backdrop}
          aria-hidden="true"
          data-testid="glass-backdrop"
          className="pointer-events-none absolute -inset-x-28 inset-y-0"
          style={{
            transform: `translateX(${position}px)`,
            backgroundImage: 'linear-gradient(115deg, #aa7960, #58727d 52%, #253e53)',
          }}
        >
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                'linear-gradient(rgb(255 255 255 / .3) 1px, transparent 1px), linear-gradient(90deg, rgb(255 255 255 / .3) 1px, transparent 1px)',
              backgroundSize: '32px 32px',
            }}
          />
          <div className="absolute top-8 left-[12%] h-56 w-56 rounded-full bg-[#d6a66f]" />
          <div className="absolute right-[12%] bottom-8 h-72 w-72 rounded-full bg-[#769dac]" />
          {[0, 1, 2].map((row) => (
            <div key={row} className="absolute left-8 right-0" style={{ top: 100 + row * 320 }}>
              <p className="whitespace-nowrap text-[112px] leading-none font-black tracking-[-0.07em] text-white">
                GLASS / 0123456789
              </p>
              <p className="mt-5 whitespace-nowrap text-[26px] font-semibold tracking-wide text-white">
                Letters behind the surface · 유리 뒤의 글자 · ABCDEFG
              </p>
              <div
                className="mt-5 h-8"
                style={{
                  backgroundImage:
                    'repeating-linear-gradient(90deg, #192c3a 0 3px, transparent 3px 16px)',
                }}
              />
            </div>
          ))}
        </div>

        <div className="relative grid gap-8 px-6 pt-16 pb-12 md:grid-cols-2 md:px-10 md:pt-20 md:pb-16">
          {(['morphing', 'frosted'] as const).map((variant) => (
            <div key={variant} className="space-y-4">
              <div className="relative h-72">
                {showSurfaces ? (
                  <GlassSurface variant={variant} shape="panel">
                    <div
                      data-testid={`${variant}-comparison-panel`}
                      className="absolute inset-0 flex flex-col justify-between rounded-card p-5 text-popover-foreground"
                    >
                      <div>
                        <p className="text-title-sm capitalize">{variant}</p>
                        <p className="mt-1 text-caption">
                          {variant === 'morphing'
                            ? 'Transparent · strong edge refraction · light blur'
                            : 'Dense film · soft blur'}
                        </p>
                      </div>
                      <PanelActions variant={variant} />
                    </div>
                  </GlassSurface>
                ) : (
                  <div className="absolute inset-0 rounded-card border border-dashed border-white/70 p-5 text-white">
                    <p className="text-title-sm">Backdrop without glass</p>
                  </div>
                )}
              </div>
              <p className="text-body-sm text-white">
                {variant === 'morphing'
                  ? 'The background stays visible. Move it to inspect the lens at each edge.'
                  : 'Use for a quieter surface when the background is busy.'}
              </p>
            </div>
          ))}
        </div>
      </div>
      <p className="text-caption text-muted-foreground">
        These are the shipped defaults. PopoverContent, DropdownMenuContent, and
        DropdownMenuSubContent accept glassVariant="morphing" or "frosted".
      </p>
    </div>
  )
}

export const OverlayPanels: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Compare transparent, refractive morphing glass with frosted glass over movable text, grid lines, and warm/cool color shapes. Both finishes can be used by the real popover and dropdown examples.',
      },
    },
  },
  render: () => <OverlayPanelPreview />,
}
