'use client'

/**
 * Glass — refractive glass surface shared by app bars, bottom navigation, menus, and floating buttons.
 *
 * - Glass: absolutely positioned layer inside any container. Parent uses relative isolate and a radius;
 *   content is a sibling with relative z-raised.
 * - GlassSurface: makes the child DOM itself glass, without an extra layer (menu/popover content).
 * - GlassButton: circular/pill button with a glass layer by default (app-bar back/floating action).
 *
 * Variants: morphing (edge refraction, default), blur (strong blur), frosted, and fade (downward fade for app bars).
 * styles.css .glass* owns all visuals; this component adds classes, CSS variables, and SVG filters.
 * @comwit/ui useGlassLens handles support detection, size tracking, and canvas displacement-map generation.
 * Enable refraction only in Chromium where it is reliable; otherwise fall back to blur.
 */

import {
  useId,
  useState,
  type ComponentProps,
  type CSSProperties,
  type ReactElement,
  type ReactNode,
  type Ref,
} from 'react'
import { Slot, useGlassLens, type GlassLensTexture } from '@comwit/ui'
import { Button } from '@/lib/components/ui/button'
import { cn } from '@/lib/utils/cn'

export type GlassVariant = 'morphing' | 'blur' | 'frosted' | 'fade'
export type GlassShape = 'pill' | 'circle' | 'panel'

type GlassOptions = {
  className?: string
  /**
   * CSS color mixed into the glass surface. Defaults to the --glass-tint token.
   */
  tint?: string
  /**
   * Tint opacity (0–1), without affecting inner content.
   */
  opacity?: number
  pressed?: boolean
  /**
   * Glass-layer shadow. Disable for buttons attached to an app bar.
   */
  shadow?: boolean
  /**
   * Surface above a scrim (dialogs, sheets, popups). The darkened backdrop calls for the overlay surface
   * color (--popover) and higher tint opacity for readable text (.glass-dense). Edge refraction and blur remain.
   */
  dense?: boolean
  shape?: GlassShape
  variant?: GlassVariant
}

const VARIANT_CLASS: Record<GlassVariant, string> = {
  morphing: 'glass-morphing',
  blur: 'glass-blur',
  frosted: 'glass-frosted',
  fade: 'glass-fade',
}

/**
 * Visual glass layer for any container, including buttons, app bars, and tab bars.
 */
function Glass({
  className,
  tint,
  opacity,
  pressed,
  shadow = true,
  dense,
  shape = 'pill',
  variant = 'morphing',
}: GlassOptions) {
  const { attach, filterId, hasLens, lensMap, style } = useGlassVisual({
    opacity,
    shape,
    tint,
    variant,
  })

  return (
    <span
      ref={attach}
      aria-hidden="true"
      data-slot="glass"
      data-glass={variant}
      className={cn(
        'glass pointer-events-none absolute inset-0 z-0 rounded-[inherit]',
        VARIANT_CLASS[variant],
        hasLens && 'glass-lens',
        pressed && 'glass-pressed',
        !shadow && 'glass-shadowless',
        dense && 'glass-dense',
        className
      )}
      style={style}
    >
      {hasLens ? <GlassFilter filterId={filterId} variant={variant} lensMap={lensMap} /> : null}
    </span>
  )
}

type GlassSurfaceProps = Omit<GlassOptions, 'shape'> & {
  shape?: GlassShape
  children: ReactElement<{
    children?: ReactNode
    className?: string
    style?: CSSProperties
  }>
}

/**
 * Make the child DOM itself glass without an extra layer.
 */
function GlassSurface({
  children,
  className,
  tint,
  opacity,
  pressed,
  shadow = true,
  dense,
  shape = 'panel',
  variant = 'morphing',
}: GlassSurfaceProps) {
  const { attach, filterId, hasLens, lensMap, mounted, style } = useGlassVisual({
    opacity,
    shape,
    tint,
    variant,
  })

  return (
    <>
      {/* Slot preserves the child's ref while merging ours, generating the lens when popover/dialog content mounts on each opening. */}
      <Slot
        ref={attach}
        data-glass={variant}
        className={cn(
          'glass',
          VARIANT_CLASS[variant],
          hasLens && 'glass-lens',
          pressed && 'glass-pressed',
          !shadow && 'glass-shadowless',
          dense && 'glass-dense',
          className
        )}
        style={style}
      >
        {children}
      </Slot>
      {/* Keep the lens filter as a sibling of the surface so parts merged into one element with asChild (overlay Content)
still have exactly one child. url(#id) can reference a filter anywhere in the document. Render no filter
when the surface is absent, such as a closed submenu. */}
      {hasLens && mounted ? (
        <GlassFilter filterId={filterId} variant={variant} lensMap={lensMap} />
      ) : null}
    </>
  )
}

type GlassButtonProps = Omit<ComponentProps<typeof Button>, 'variant' | 'size' | 'children'> & {
  children: ReactNode
  contentClassName?: string
  /**
   * Element overlapping the button corner, such as a count badge. Rendered outside the content layer.
   */
  indicator?: ReactNode
  shape?: Exclude<GlassShape, 'panel'>
  glassVariant?: GlassVariant
  shadow?: boolean
  tint?: string
  opacity?: number
}

/**
 * Button with a glass layer by default. aria-pressed=true switches to the pressed border.
 */
function GlassButton({
  children,
  className,
  contentClassName,
  indicator,
  shape = 'pill',
  glassVariant = 'morphing',
  shadow = true,
  tint,
  opacity,
  ...props
}: GlassButtonProps) {
  const isPressed = props['aria-pressed'] === true

  return (
    <Button
      variant="plain"
      size="none"
      className={cn('group/glass relative isolate rounded-pill bg-transparent', className)}
      {...props}
    >
      <Glass
        variant={glassVariant}
        shape={shape}
        tint={tint}
        opacity={opacity}
        pressed={isPressed}
        shadow={shadow}
      />
      {/* When a parent is transformed, WebKit cannot separate the backdrop-filter layer and foreground with
z-index alone. Put the foreground on its own compositing layer using transform-gpu. */}
      <span
        className={cn(
          'relative z-raised inline-flex size-full transform-gpu items-center justify-center gap-1 text-foreground',
          contentClassName
        )}
      >
        {children}
      </span>
      {indicator}
    </Button>
  )
}

function useGlassVisual({
  tint,
  opacity,
  shape,
  variant,
}: Required<Pick<GlassOptions, 'shape' | 'variant'>> & Pick<GlassOptions, 'opacity' | 'tint'>) {
  const filterId = `glass-${variant}-${useId().replace(/:/g, '')}`
  // Receive the glass-surface DOM through a callback ref; Presence-controlled content mounts at different times.
  const [element, setElement] = useState<HTMLElement | null>(null)
  const lens = useGlassLens(element, { enabled: variant === 'morphing', shape })
  const clamped = opacity === undefined ? undefined : Math.min(1, Math.max(0, opacity))
  const style = {
    '--glass-filter': `url(#${filterId})`,
    ...(tint ? { '--glass-tint': tint } : {}),
    ...(clamped === undefined ? {} : { '--glass-opacity': String(clamped) }),
  } as CSSProperties

  return {
    filterId,
    hasLens: lens.supported,
    mounted: element !== null,
    style,
    lensMap: lens.texture,
    // This is a callback ref (state setter). Destructure it at the call site; passing it as an object property causes
    // React Compiler to treat the whole object as a ref and reject hasLens/style reads as ref access during render.
    attach: setElement as Ref<HTMLElement>,
  }
}

function GlassFilter({
  filterId,
  variant,
  lensMap,
}: {
  filterId: string
  variant: GlassVariant
  lensMap?: GlassLensTexture
}) {
  const isBlur = variant === 'blur'
  const isFrosted = variant === 'frosted'
  const isFade = variant === 'fade'
  const isMorphing = variant === 'morphing'

  return (
    <svg aria-hidden="true" className="absolute size-0">
      <filter
        id={filterId}
        x={isMorphing ? '0%' : isBlur ? '-4%' : isFade ? '-6%' : '-8%'}
        y={isMorphing ? '0%' : isBlur ? '-55%' : isFade ? '-50%' : '-45%'}
        width={isMorphing ? '100%' : isBlur ? '108%' : isFade ? '112%' : '116%'}
        height={isMorphing ? '100%' : isBlur ? '210%' : isFade ? '200%' : '190%'}
        colorInterpolationFilters="sRGB"
      >
        {isMorphing ? (
          <>
            {lensMap ? (
              <feImage
                href={lensMap.url}
                x="0"
                y="0"
                width={lensMap.width}
                height={lensMap.height}
                preserveAspectRatio="none"
                result="lensMap"
              />
            ) : (
              <feFlood floodColor="rgb(128,128,128)" result="lensMap" />
            )}
            <feComponentTransfer in="lensMap" result="soft">
              <feFuncR type="linear" slope={255 / 254} intercept={-1 / 254} />
              <feFuncG type="linear" slope={255 / 254} intercept={-1 / 254} />
            </feComponentTransfer>
          </>
        ) : (
          <>
            <feTurbulence
              type="fractalNoise"
              baseFrequency={isBlur ? '0.006 0.018' : isFade ? '0.007 0.019' : '0.008 0.02'}
              numOctaves="2"
              seed={isBlur ? '17' : isFade ? '19' : '13'}
              result="noise"
            />
            <feGaussianBlur
              in="noise"
              stdDeviation={isBlur ? '3.2' : isFade ? '1.8' : '2'}
              result="soft"
            />
          </>
        )}
        <feDisplacementMap
          in="SourceGraphic"
          in2="soft"
          scale={isMorphing ? (lensMap?.scale ?? 0) : isBlur ? 28 : isFade ? 6 : 10}
          xChannelSelector="R"
          yChannelSelector="G"
          result="refracted"
        />
        <feGaussianBlur
          in="refracted"
          stdDeviation={isBlur ? '9.5' : isFade ? '2.5' : isFrosted ? '5.5' : '4'}
          result="frosted"
        />
        <feColorMatrix
          in="frosted"
          type="saturate"
          values={isBlur ? '1.9' : isFade ? '1.25' : isFrosted ? '1.35' : '1.55'}
        />
      </filter>
    </svg>
  )
}

export { Glass, GlassSurface, GlassButton }
