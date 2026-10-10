import type { SVGProps } from 'react'

export type IconCategory =
  'Navigation' | 'Actions' | 'Communication' | 'Files' | 'People' | 'Status' | 'Objects'
export interface IconNode {
  tag: 'path' | 'circle' | 'rect' | 'line' | 'polyline' | 'ellipse' | 'g'
  attrs?: Record<string, string | number>
  /** Named moving part, shared by the static and animated drawing. */
  part?: string
  children?: readonly IconNode[]
}
export interface IconMotion {
  part: string
  keyframes: Keyframe[]
  duration?: number
  delay?: number
  easing?: string
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
