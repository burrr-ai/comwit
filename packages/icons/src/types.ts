import type { SVGProps } from 'react'

export type IconCategory =
  | 'Navigation'
  | 'Actions'
  | 'Communication'
  | 'Files'
  | 'People'
  | 'Status'
  | 'Media'
  | 'Development'
  | 'Objects'
export interface IconNode {
  tag: 'path' | 'circle' | 'rect' | 'line' | 'polyline' | 'ellipse' | 'g'
  attrs?: Record<string, string | number>
  /** Named moving part, shared by the static and animated drawing. */
  part?: string
  /** Fixed rotation/scale centre in grid units, for hinges and axles away from the part's centre. */
  pivot?: readonly [x: number, y: number]
  children?: readonly IconNode[]
}
/**
 * Where a part goes when its progress reaches 1. Progress 0 is always the resting drawing, so every
 * value scales linearly with progress: negative progress mirrors the pose (a spring overshooting past
 * rest), progress beyond 1 exaggerates it.
 */
export interface IconPose {
  /** Grid units (the 24-unit viewBox). */
  x?: number
  y?: number
  /** Degrees. */
  rotate?: number
  scale?: number
  scaleX?: number
  scaleY?: number
  skewX?: number
  skewY?: number
  /**
   * Opacity reached at |progress| = 1, so a part fading out on either side of rest stays faded. Below
   * zero it is gone sooner: -1 is fully transparent halfway to the pose.
   */
  opacity?: number
  /** Ink hidden at progress 1 (1 = the whole stroke). The part needs `pathLength: 1`. */
  draw?: number
}
/**
 * `[time in ms, progress]`: from `time` on the spring pulls the part toward `progress`. Velocity carries
 * across targets, which is what makes a gesture overshoot and settle instead of stopping dead.
 * `'jump'` places the part there instantly, for re-entries and strokes about to be written.
 */
export type IconStep = readonly [time: number, progress: number, jump?: 'jump']
export interface IconSpring {
  /** Perceptual duration in ms (Apple's spring parameterisation). */
  duration: number
  /** 0 settles without overshoot; towards 1 it rings longer. */
  bounce: number
}
export interface IconMotion {
  part: string
  pose: IconPose
  steps: readonly IconStep[]
  spring: IconSpring
  /** transform-origin inside the part's own box, e.g. `'50% 0%'` for a hinge on its top edge. */
  origin?: string
}
export interface IconDefinition {
  /** PascalCase public name without Icon suffix. */
  name: string
  category: IconCategory
  tags: readonly string[]
  nodes: readonly IconNode[]
  motion: readonly IconMotion[]
}
export interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'children' | 'ref'> {
  size?: number | string
  /** Supplying a title makes the SVG an accessible image. Otherwise it is decorative. */
  title?: string
}
export interface AnimatedIconProps extends IconProps {
  animateOn?: 'hover' | 'click' | 'mount' | 'none'
  /** Change this value to replay a feedback animation after an action succeeds. */
  replayKey?: string | number
}
