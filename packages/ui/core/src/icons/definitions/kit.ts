import type { IconMotion, IconNode, IconPose, IconSpring, IconStep } from '../types'

// Drawing helpers. Every drawing is original geometry on the 24-unit grid.
export const p = (d: string, attrs: IconNode['attrs'] = {}): IconNode => ({
  tag: 'path',
  attrs: { d, ...attrs },
})
export const c = (cx: number, cy: number, r: number): IconNode => ({
  tag: 'circle',
  attrs: { cx, cy, r },
})
export const e = (cx: number, cy: number, rx: number, ry: number): IconNode => ({
  tag: 'ellipse',
  attrs: { cx, cy, rx, ry },
})
export const r = (x: number, y: number, width: number, height: number, rx = 2): IconNode => ({
  tag: 'rect',
  attrs: { x, y, width, height, rx },
})
/** A named moving group. */
export const g = (part: string, ...children: IconNode[]): IconNode => ({
  tag: 'g',
  part,
  children,
})
/** A stroke that can be written on: `pathLength: 1` normalises its length. */
export const ink = (part: string, d: string): IconNode => ({
  tag: 'path',
  part,
  attrs: { d, pathLength: 1 },
})
export const named = (part: string, node: IconNode): IconNode => ({ ...node, part })
/** Rotate or scale a part around a grid point (a hinge, an axle) instead of its own centre. */
export const pivot = (node: IconNode, x: number, y: number): IconNode => ({
  ...node,
  pivot: [x, y],
})

const n = (value: number) => Math.round(value * 100) / 100
const point = (cx: number, cy: number, radius: number, degrees: number) => {
  const angle = (degrees * Math.PI) / 180
  return [n(cx + radius * Math.sin(angle)), n(cy - radius * Math.cos(angle))] as const
}
/** `count` short spokes around a centre, starting at twelve o'clock. */
export function spokes(cx: number, cy: number, inner: number, outer: number, count: number) {
  return Array.from({ length: count }, (_, index) => {
    const degrees = (360 / count) * index
    const [x1, y1] = point(cx, cy, inner, degrees)
    const [x2, y2] = point(cx, cy, outer, degrees)
    return `M${x1} ${y1}L${x2} ${y2}`
  }).join('')
}
/** A closed scalloped outline: `count` soft lobes between two radii. */
export function scallop(cx: number, cy: number, inner: number, outer: number, count: number) {
  const step = 360 / count
  const start = point(cx, cy, inner, -step / 2)
  let d = `M${start[0]} ${start[1]}`
  for (let index = 0; index < count; index++) {
    const [qx, qy] = point(cx, cy, outer * 1.08, index * step)
    const [x, y] = point(cx, cy, inner, index * step + step / 2)
    d += `Q${qx} ${qy} ${x} ${y}`
  }
  return d + 'Z'
}

/** A cog with exact `count`-fold symmetry, so turning it by one tooth pitch redraws it identically. */
export function gear(
  cx: number,
  cy: number,
  outer: number,
  root: number,
  count: number,
  tip = 13,
  flank = 22
) {
  const pitch = 360 / count
  const corners = Array.from({ length: count }, (_, index) => {
    const at = index * pitch
    return [
      point(cx, cy, outer, at - tip),
      point(cx, cy, outer, at + tip),
      point(cx, cy, root, at + flank),
      point(cx, cy, root, at + pitch - flank),
    ]
  }).flat()
  return 'M' + corners.map(([x, y]) => `${x} ${y}`).join('L') + 'Z'
}

// Springs (Apple-style perceptual duration in ms and bounce).
export const spring = {
  /** Quick, slight overshoot: nudges and taps. */
  snappy: { duration: 380, bounce: 0.32 },
  /** Lively overshoot: pops, hops and turns. */
  bouncy: { duration: 460, bounce: 0.5 },
  /** Rings a few times: bells, tassels, hanging parts. */
  wobbly: { duration: 560, bounce: 0.62 },
  /** No overshoot: writing, fading, sweeping. */
  smooth: { duration: 420, bounce: 0 },
  /** Slow and settled: full rotations. */
  glide: { duration: 760, bounce: 0.12 },
} satisfies Record<string, IconSpring>

interface Options {
  /** Start time in ms. */
  at?: number
  spring?: IconSpring
  origin?: string
}
const track = (
  part: string,
  pose: IconPose,
  steps: IconStep[],
  { spring: chosen, origin }: Options,
  fallback: IconSpring
): IconMotion => ({
  part,
  pose,
  steps,
  spring: chosen ?? fallback,
  ...(origin ? { origin } : {}),
})

/** Explicit steps for gestures the presets do not cover. */
export const custom = (part: string, pose: IconPose, steps: IconStep[], options: Options = {}) =>
  track(part, pose, steps, options, spring.bouncy)
/** Push toward the pose, hold briefly, release: the spring carries it through rest and back. */
export const push = (part: string, pose: IconPose, options: Options & { hold?: number } = {}) => {
  const { at = 0, hold = 110 } = options
  return track(
    part,
    pose,
    [
      [at, 1],
      [at + hold, 0],
    ],
    options,
    spring.snappy
  )
}
/** Wind up slightly against the direction of travel, then push. Arrows, chevrons, launches. */
export const nudge = (
  part: string,
  pose: IconPose,
  options: Options & { hold?: number; windup?: number } = {}
) => {
  const { at = 0, hold = 120, windup = 0.22 } = options
  return track(
    part,
    pose,
    [
      [at, -windup],
      [at + 80, 1],
      [at + 80 + hold, 0],
    ],
    options,
    spring.snappy
  )
}
/** Dip, then overshoot past rest: a heartbeat-like tap on scale (or any pose). */
export const pop = (part: string, pose: IconPose, options: Options & { dip?: number } = {}) => {
  const { at = 0, dip = 0.55 } = options
  return track(
    part,
    pose,
    [
      [at, -dip],
      [at + 90, 1],
      [at + 190, 0],
    ],
    options,
    spring.bouncy
  )
}
/** Decaying alternation: bells, wiggles, a phone buzzing. */
export const swing = (
  part: string,
  pose: IconPose,
  options: Options & { beats?: number; interval?: number } = {}
) => {
  const { at = 0, beats = 4, interval = 95 } = options
  const steps: IconStep[] = Array.from({ length: beats }, (_, index) => [
    at + index * interval,
    (index % 2 ? -1 : 1) * (1 - index / (beats + 0.5)),
  ])
  steps.push([at + beats * interval, 0])
  return track(part, pose, steps, options, spring.snappy)
}
/**
 * Travel to a pose that draws exactly like rest (a quarter turn of a plus, a gear's tooth pitch) and
 * stay there; the animation then hands back to the identical resting drawing.
 */
export const turn = (part: string, pose: IconPose, options: Options = {}) =>
  track(part, pose, [[options.at ?? 0, 1]], options, spring.bouncy)
/** Hide the stroke at once and write it on from its start. Only for secondary or meaning-making ink. */
export const write = (part: string, options: Options = {}) =>
  track(
    part,
    { draw: 1 },
    [
      [0, 1, 'jump'],
      [options.at ?? 0, 0],
    ],
    options,
    spring.smooth
  )
/** Start away from rest (usually hidden by the pose's opacity) and settle in. Staggered reveals. */
export const enter = (part: string, pose: IconPose, options: Options = {}) =>
  track(
    part,
    pose,
    [
      [0, 1, 'jump'],
      [options.at ?? 0, 0],
    ],
    options,
    spring.bouncy
  )
/**
 * Leave along the pose, re-enter from the opposite side and land at rest. Opacity follows the distance
 * from rest and reaches zero a third of the way out, so nothing visible crosses the frame edge.
 */
export const fly = (
  part: string,
  pose: Pick<IconPose, 'x' | 'y'>,
  options: Options & { away?: number } = {}
) => {
  const { at = 0, away = 150 } = options
  return track(
    part,
    { ...pose, opacity: -2 },
    [
      [at, -0.06],
      [at + 50, 1.8],
      [at + away, -1, 'jump'],
      [at + away, 0],
    ],
    options,
    spring.snappy
  )
}
