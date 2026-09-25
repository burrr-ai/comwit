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
 * 시각은 styles.css 의 `.glass*` 가 전부 갖고, 여기선 클래스·CSS 변수·SVG 필터만 붙인다.
 * 굴절 렌즈의 변위 맵(지원 감지·크기 추적·캔버스 생성)은 @comwit/ui 의 `useGlassLens` 가 만든다 —
 * 안정적으로 도는 Chromium 에서만 켜고, 그 외엔 블러로 폴백한다.
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
import { Slot, Slottable, useGlassLens, type GlassLensTexture } from '@comwit/ui'
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
  /**
   * 스크림 위에 뜨는 면(다이얼로그·시트·팝업). 뒤가 어두워지므로 틴트를 오버레이 면 색(--popover)으로,
   * 불투명도를 올려 본문이 읽히게 한다(`.glass-dense`). 가장자리 굴절과 블러는 그대로다.
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

/** 버튼·앱바·탭바 등 어떤 컨테이너에도 놓을 수 있는 유리 시각 레이어. */
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
  const visual = useGlassVisual({ opacity, shape, tint, variant })

  return (
    <span
      ref={visual.ref}
      aria-hidden="true"
      data-slot="glass"
      data-glass={variant}
      className={cn(
        'glass pointer-events-none absolute inset-0 z-0 rounded-[inherit]',
        VARIANT_CLASS[variant],
        visual.hasLens && 'glass-lens',
        pressed && 'glass-pressed',
        !shadow && 'glass-shadowless',
        dense && 'glass-dense',
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
  dense,
  shape = 'panel',
  variant = 'morphing',
}: GlassSurfaceProps) {
  const visual = useGlassVisual({ opacity, shape, tint, variant })

  return (
    // Slot 이 자식의 ref 를 유지하면서 우리 ref 도 합친다 — 열릴 때마다 마운트되는 팝오버·다이얼로그 콘텐츠의 렌즈를 그때 만든다.
    <Slot
      ref={visual.ref}
      data-glass={variant}
      className={cn(
        'glass',
        VARIANT_CLASS[variant],
        visual.hasLens && 'glass-lens',
        pressed && 'glass-pressed',
        !shadow && 'glass-shadowless',
        dense && 'glass-dense',
        className
      )}
      style={visual.style}
    >
      <Slottable child={children}>
        {(inner) => (
          <>
            {inner}
            {visual.hasLens ? (
              <GlassFilter filterId={visual.filterId} variant={variant} lensMap={visual.lensMap} />
            ) : null}
          </>
        )}
      </Slottable>
    </Slot>
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
  const filterId = `glass-${variant}-${useId().replace(/:/g, '')}`
  // 유리 면 DOM 은 콜백 ref 로 받는다 — 프레즌스로 열고 닫히는 콘텐츠는 마운트 시점이 매번 다르다.
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
    style,
    lensMap: lens.texture,
    ref: setElement as Ref<HTMLElement>,
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
