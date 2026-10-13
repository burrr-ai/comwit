/**
 * Spring integrator: moves progress (0–1) with a spring and samples its trajectory at fixed frame intervals.
 * The samples become Web Animations API keyframes played by the compositor. If direction changes mid-animation,
 * read the current frame's position and velocity and resample toward the opposite target. Preserving velocity avoids a jump.
 *
 * Integration uses semi-implicit Euler (Allen Chou), the same formula as ssgoi's SpringIntegrator.
 */

/**
 * Spring settings accept either form:
 * - { duration, bounce }: perceived duration in seconds and bounce (-1 to 1; 0 means no overshoot), using Apple's WWDC23 parameterization.
 * - { stiffness, damping, mass }: physical constants directly.
 */
type SpringConfig =
  { duration: number; bounce?: number } | { stiffness: number; damping: number; mass?: number }

type SpringFrame = {
  /** ms */
  time: number
  position: number
  /** Progress per second. */
  velocity: number
}

const FRAME_MS = 1000 / 60
const MAX_FRAMES = 600
/**
 * Consider the spring settled when progress and velocity fall within these thresholds. At 240px, 0.2% is 0.5px.
 * Tighter thresholds keep closing parts mounted and blocking clicks throughout an invisible animation tail.
 */
const REST_DELTA = 0.002
const REST_SPEED = 0.02

/** Angular frequency (ω) and damping ratio (ζ), normalized by mass to simplify integration. */
function springConstants(config: SpringConfig): { omega: number; zeta: number } {
  if ('stiffness' in config) {
    const mass = config.mass ?? 1
    return {
      omega: Math.sqrt(config.stiffness / mass),
      zeta: config.damping / (2 * Math.sqrt(config.stiffness * mass)),
    }
  }
  const duration = Math.max(config.duration, 0.01)
  const bounce = Math.min(Math.max(config.bounce ?? 0, -0.99), 0.99)
  const omega = (2 * Math.PI) / duration
  const damping =
    bounce >= 0
      ? (4 * Math.PI * (1 - bounce)) / duration
      : (4 * Math.PI) / (duration * (1 + bounce))
  return { omega, zeta: damping / (2 * omega) }
}

/** Frames from the starting position and initial velocity to rest at the target. Always returns at least two frames. */
function simulateSpring(
  config: SpringConfig,
  from: number,
  to: number,
  velocity: number
): SpringFrame[] {
  const { omega, zeta } = springConstants(config)
  const h = FRAME_MS / 1000
  let position = from
  let speed = velocity
  const frames: SpringFrame[] = [{ time: 0, position, velocity: speed }]
  for (let i = 1; i <= MAX_FRAMES; i++) {
    speed += -2 * h * zeta * omega * speed + h * omega * omega * (to - position)
    position += h * speed
    if (Math.abs(to - position) < REST_DELTA && Math.abs(speed) < REST_SPEED) {
      frames.push({ time: i * FRAME_MS, position: to, velocity: 0 })
      return frames
    }
    frames.push({ time: i * FRAME_MS, position, velocity: speed })
  }
  frames.push({ time: (MAX_FRAMES + 1) * FRAME_MS, position: to, velocity: 0 })
  return frames
}

/** Position and velocity at playback time in milliseconds, with linear interpolation between frames. */
function sampleSpring(
  frames: SpringFrame[],
  elapsed: number
): { position: number; velocity: number } {
  const first = frames[0]
  const last = frames[frames.length - 1]
  if (!first || !last) return { position: 0, velocity: 0 }
  if (elapsed <= 0) return { position: first.position, velocity: first.velocity }
  if (elapsed >= last.time) return { position: last.position, velocity: last.velocity }
  const index = Math.min(frames.length - 2, Math.floor(elapsed / FRAME_MS))
  const a = frames[index]!
  const b = frames[index + 1]!
  const ratio = (elapsed - a.time) / (b.time - a.time || 1)
  return {
    position: a.position + (b.position - a.position) * ratio,
    velocity: a.velocity + (b.velocity - a.velocity) * ratio,
  }
}

export { simulateSpring, sampleSpring }
export type { SpringConfig, SpringFrame }
