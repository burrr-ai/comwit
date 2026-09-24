'use client'

/**
 * Glass — 굴절 유리 면. 앱바·바텀내비·메뉴·플로팅 버튼이 공유하는 컴윗 시그니처 표면.
 *
 *  - <Glass />         어떤 컨테이너에도 까는 절대배치 레이어. 부모가 `relative isolate` + 반경을 갖고,
 *                      콘텐츠는 `relative z-raised` 형제로 둔다.
 *  - <GlassSurface>    레이어 없이 자식 DOM 자체를 유리 면으로 만든다(메뉴·팝오버 content).
 *  - <GlassButton>     유리 레이어를 기본으로 까는 원형/알약 버튼(앱바 뒤로가기·플로팅 액션).
 *
 * variant — morphing(렌즈 가장자리 굴절 · 기본) · blur(강한 블러) · frosted(서리) · fade(아래로 사라짐 · 앱바)
 * 시각은 styles.css 의 `.glass*` 가 전부 갖고, 여기선 클래스·CSS 변수·SVG 렌즈만 붙인다.
 * 굴절 렌즈(SVG backdrop-filter)는 안정적으로 도는 Chromium 에서만 켜고, 그 외엔 블러로 폴백한다.
 */

import {
  cloneElement,
  useEffect,
  useId,
  useState,
  type ComponentProps,
  type CSSProperties,
  type ReactElement,
  type ReactNode,
} from 'react'
import { Button } from './button'
import { cn } from '../../lib/utils'

export type GlassVariant = 'morphing' | 'blur' | 'frosted' | 'fade'
export type GlassShape = 'pill' | 'circle' | 'panel'

type GlassOptions = {
  className?: string
  /** 유리 면에 섞을 CSS 색. 기본은 --glass-tint 토큰. */
  tint?: string
  /** tint 의 불투명도(0~1). 내부 콘텐츠에는 영향을 주지 않는다. */
  opacity?: number
  pressed?: boolean
  /** 유리 레이어의 그림자. 앱바에 붙는 버튼에서는 끈다. */
  shadow?: boolean
  shape?: GlassShape
  variant?: GlassVariant
}

const VARIANT_CLASS: Record<GlassVariant, string> = {
  morphing: 'glass-morphing',
  blur: 'glass-blur',
  frosted: 'glass-frosted',
  fade: 'glass-fade',
}

/** 버튼·앱바·탭바 등 어떤 컨테이너에도 놓을 수 있는 유리 시각 레이어. */
function Glass({
  className,
  tint,
  opacity,
  pressed,
  shadow = true,
  shape = 'pill',
  variant = 'morphing',
}: GlassOptions) {
  const visual = useGlassVisual({ opacity, shape, tint, variant })

  return (
    <span
      aria-hidden="true"
      data-slot="glass"
      data-glass={variant}
      className={cn(
        'glass pointer-events-none absolute inset-0 z-0 rounded-[inherit]',
        VARIANT_CLASS[variant],
        visual.hasLens && 'glass-lens',
        pressed && 'glass-pressed',
        !shadow && 'glass-shadowless',
        className
      )}
      style={visual.style}
    >
      {visual.hasLens ? (
        <GlassFilter filterId={visual.filterId} variant={variant} lensMap={visual.lensMap} />
      ) : null}
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

/** 별도 레이어 없이 자식 DOM 자체를 유리 면으로 만든다. */
function GlassSurface({
  children,
  className,
  tint,
  opacity,
  pressed,
  shadow = true,
  shape = 'panel',
  variant = 'morphing',
}: GlassSurfaceProps) {
  const visual = useGlassVisual({ opacity, shape, tint, variant })

  return cloneElement(
    children,
    {
      'data-glass': variant,
      className: cn(
        'glass',
        VARIANT_CLASS[variant],
        visual.hasLens && 'glass-lens',
        pressed && 'glass-pressed',
        !shadow && 'glass-shadowless',
        children.props.className,
        className
      ),
      style: { ...children.props.style, ...visual.style },
    } as Record<string, unknown>,
    <>
      {children.props.children}
      {visual.hasLens ? (
        <GlassFilter filterId={visual.filterId} variant={variant} lensMap={visual.lensMap} />
      ) : null}
    </>
  )
}

type GlassButtonProps = Omit<ComponentProps<typeof Button>, 'variant' | 'size' | 'children'> & {
  children: ReactNode
  contentClassName?: string
  /** 버튼 모서리에 겹치는 요소(카운트 배지 등). 콘텐츠 레이어 밖에 그린다. */
  indicator?: ReactNode
  shape?: Exclude<GlassShape, 'panel'>
  glassVariant?: GlassVariant
  shadow?: boolean
  tint?: string
  opacity?: number
}

/** 유리 레이어를 기본으로 까는 버튼. `aria-pressed` 가 true 면 눌린 테두리로 전환한다. */
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
      {/* 부모가 transform 중일 때 WebKit 은 z-index 만으로 backdrop-filter 레이어와 전경을
          분리하지 못한다 — 전경을 자기 합성 레이어(transform-gpu)에 둔다. */}
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
  const hasLens = useLensSupport()
  const filterId = `glass-${variant}-${useId().replace(/:/g, '')}`
  const lensMap = useLensMap(filterId, hasLens && variant === 'morphing', shape)
  const clamped = opacity === undefined ? undefined : Math.min(1, Math.max(0, opacity))
  const style = {
    '--glass-filter': `url(#${filterId})`,
    ...(tint ? { '--glass-tint': tint } : {}),
    ...(clamped === undefined ? {} : { '--glass-opacity': String(clamped) }),
  } as CSSProperties

  return { filterId, hasLens, style, lensMap }
}

/** SVG backdrop-filter 가 안정적으로 동작하는 Chromium 계열에서만 굴절 렌즈를 켠다. */
function useLensSupport() {
  const [hasLens, setHasLens] = useState(false)
  useEffect(() => {
    setHasLens('userAgentData' in navigator)
  }, [])
  return hasLens
}

type LensTexture = { url: string; width: number; height: number; scale: number }

/** 크기가 바뀔 때만 렌즈 맵을 다시 만든다. 스크롤·이동에는 캡처 비용이 없다. */
function useLensMap(filterId: string, enabled: boolean, shape: GlassShape) {
  const [texture, setTexture] = useState<LensTexture>()
  useEffect(() => {
    if (!enabled) return
    const element = document
      .getElementById(filterId)
      ?.closest<HTMLElement>('[data-glass="morphing"]')
    if (!element) return
    const update = () => {
      const width = element.offsetWidth
      const height = element.offsetHeight
      if (width === 0 || height === 0) return
      const map = createLensMap(width, height, shape)
      const canvas = document.createElement('canvas')
      canvas.width = map.width
      canvas.height = map.height
      const context = canvas.getContext('2d')
      if (!context) return
      context.putImageData(new ImageData(map.pixels, map.width, map.height), 0, 0)
      setTexture({ url: canvas.toDataURL(), width, height, scale: map.scale })
    }
    update()
    const observer = new ResizeObserver(update)
    observer.observe(element)
    return () => observer.disconnect()
  }, [enabled, filterId, shape])
  return texture
}

/** 가장자리만 대칭으로 굴절시킨다 — 중앙과 렌즈 밖 픽셀은 고정. */
function lensDisplacement(x: number, y: number, width: number, height: number, radius: number) {
  const px = x - width / 2
  const py = y - height / 2
  const qx = Math.abs(px) - (width / 2 - radius)
  const qy = Math.abs(py) - (height / 2 - radius)
  const outsideX = Math.max(qx, 0)
  const outsideY = Math.max(qy, 0)
  const cornerLength = Math.hypot(outsideX, outsideY)
  const distance = cornerLength - radius
  const rim = Math.min(radius, 18)
  if (distance >= 0 || distance <= -rim) return { x: 0, y: 0 }
  // 도함수가 1 미만이라 글자가 접히지 않고 휘기만 한다.
  const bend = Math.sin((-distance / rim) * Math.PI) * rim * 0.3125
  return {
    x: ((Math.sign(px) * outsideX) / cornerLength) * bend,
    y: ((Math.sign(py) * outsideY) / cornerLength) * bend,
  }
}

/** 모양만으로 만드는 작은 변위 맵. 페이지 캡처·원격 이미지·프레임 캡처 없음. */
function createLensMap(width: number, height: number, shape: GlassShape) {
  const radius =
    shape === 'panel' ? Math.min(16, width / 2, height / 2) : Math.min(width, height) / 2
  const ratio = Math.min(1, 256 / Math.max(width, height))
  const mapWidth = Math.max(1, Math.ceil(width * ratio))
  const mapHeight = Math.max(1, Math.ceil(height * ratio))
  const strength = Math.min(radius, 18) * 0.3125
  const pixels = new Uint8ClampedArray(mapWidth * mapHeight * 4)
  for (let y = 0; y < mapHeight; y += 1) {
    for (let x = 0; x < mapWidth; x += 1) {
      const shift = lensDisplacement(
        ((x + 0.5) * width) / mapWidth,
        ((y + 0.5) * height) / mapHeight,
        width,
        height,
        radius
      )
      const index = (y * mapWidth + x) * 4
      pixels[index] = 128 + Math.round((127 * shift.x) / strength)
      pixels[index + 1] = 128 + Math.round((127 * shift.y) / strength)
      pixels[index + 2] = 128
      pixels[index + 3] = 255
    }
  }
  return { width: mapWidth, height: mapHeight, pixels, scale: strength * 2 }
}

function GlassFilter({
  filterId,
  variant,
  lensMap,
}: {
  filterId: string
  variant: GlassVariant
  lensMap?: LensTexture
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
