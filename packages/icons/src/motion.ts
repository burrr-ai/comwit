import type { IconMotion, IconPose } from './types'

const FRAME_MS = 1000 / 60
const LIMIT_MS = 2000
const REST_DELTA = 0.003
const REST_SPEED = 0.03

export interface BakedMotion {
  keyframes: Keyframe[]
  duration: number
  /** After this time (ms) only an invisible tail remains, so a replay cannot visibly snap. */
  settle: number
}

const round = (value: number) => Math.round(value * 1000) / 1000

/**
 * Progress of one part over time. The spring is integrated per frame (semi-implicit Euler, as in
 * @comwit/ui's presence springs and ssgoi), so a new target inherits the current velocity: a part
 * pushed forward and released swings back through rest and settles instead of stopping dead.
 */
export function simulate({ steps, spring }: IconMotion): { time: number; progress: number }[] {
  const seconds = Math.max(spring.duration, 10) / 1000
  const bounce = Math.min(Math.max(spring.bounce, 0), 0.95)
  const stiffness = ((2 * Math.PI) / seconds) ** 2
  const damping = (4 * Math.PI * (1 - bounce)) / seconds
  const h = FRAME_MS / 1000
  const samples: { time: number; progress: number }[] = []
  let progress = 0
  let velocity = 0
  let target = 0
  let next = 0
  for (let frame = 0; ; frame++) {
    const time = frame * FRAME_MS
    while (next < steps.length && steps[next]![0] <= time + 0.01) {
      const [, value, jump] = steps[next++]!
      target = value
      if (jump) {
        // Two samples at one instant make a clean cut instead of a one-frame smear.
        if (samples.length) samples.push({ time, progress })
        progress = value
        velocity = 0
      }
    }
    samples.push({ time, progress })
    const settled = Math.abs(target - progress) < REST_DELTA && Math.abs(velocity) < REST_SPEED
    if ((next >= steps.length && settled) || time >= LIMIT_MS) {
      samples.push({ time: time + FRAME_MS, progress: target })
      return samples
    }
    velocity += h * (stiffness * (target - progress) - damping * velocity)
    progress += h * velocity
  }
}

function keyframe(pose: IconPose, origin: string | undefined, progress: number): Keyframe {
  const frame: Keyframe = {}
  const transforms: string[] = []
  const at = (value = 0) => round(value * progress)
  if (pose.x || pose.y) transforms.push(`translate(${at(pose.x)}px, ${at(pose.y)}px)`)
  if (pose.rotate) transforms.push(`rotate(${at(pose.rotate)}deg)`)
  if (pose.skewX) transforms.push(`skewX(${at(pose.skewX)}deg)`)
  if (pose.skewY) transforms.push(`skewY(${at(pose.skewY)}deg)`)
  const scaleX = pose.scaleX ?? pose.scale
  const scaleY = pose.scaleY ?? pose.scale
  if (scaleX !== undefined || scaleY !== undefined)
    transforms.push(
      `scale(${round(1 + at((scaleX ?? 1) - 1))}, ${round(1 + at((scaleY ?? 1) - 1))})`
    )
  if (transforms.length) {
    frame.transform = transforms.join(' ')
    if (origin) frame.transformOrigin = origin
  }
  if (pose.opacity !== undefined)
    frame.opacity = String(
      round(Math.max(0, 1 + (pose.opacity - 1) * Math.min(1, Math.abs(progress))))
    )
  if (pose.draw !== undefined) {
    // A gap longer than the path keeps the far end hidden; `pathLength: 1` makes 1 the whole stroke.
    frame.strokeDasharray = '1 2'
    frame.strokeDashoffset = String(round(pose.draw * Math.min(1, Math.max(0, progress))))
  }
  return frame
}

const cache = new WeakMap<IconMotion, BakedMotion>()

/** Web Animations keyframes for one track, one per display frame, memoised per definition. */
export function bake(track: IconMotion): BakedMotion {
  let baked = cache.get(track)
  if (!baked) {
    const samples = simulate(track)
    const { time: duration, progress: rest } = samples.at(-1)!
    const moving = samples.filter(({ progress }) => Math.abs(progress - rest) > 0.06)
    baked = {
      duration,
      settle: moving.at(-1)?.time ?? 0,
      keyframes: samples.map(({ time, progress }) => ({
        ...keyframe(track.pose, track.origin, progress),
        offset: round(time / duration),
      })),
    }
    cache.set(track, baked)
  }
  return baked
}
