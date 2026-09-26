/**
 * 스프링 적분기 — 진행도(0~1)를 스프링으로 움직이고, 그 궤적을 일정 간격 프레임으로 굽는다.
 * 굽힌 프레임은 Web Animations API 키프레임이 되고(합성기가 재생), 도중에 방향이 바뀌면 지금 프레임의
 * 위치·속도를 읽어 반대 목표로 다시 굽는다 — 속도가 이어지므로 되돌아가는 움직임이 튀지 않는다.
 *
 * 적분은 semi-implicit Euler(Allen Chou) — ssgoi 의 SpringIntegrator 와 같은 식이다.
 */

/**
 * 스프링 설정. 둘 중 하나로 준다.
 *  - `{ duration, bounce }` — 체감 시간(초)과 튕김(-1~1, 0 = 넘치지 않음). Apple(WWDC23) 매개화.
 *  - `{ stiffness, damping, mass }` — 물리 상수 그대로.
 */
type SpringConfig =
  { duration: number; bounce?: number } | { stiffness: number; damping: number; mass?: number }

type SpringFrame = {
  /** ms */
  time: number
  position: number
  /** 초당 진행도 */
  velocity: number
}

const FRAME_MS = 1000 / 60
const MAX_FRAMES = 600
/**
 * 진행도가 이만큼 가까워지고 속도가 이만큼 느려지면 멎은 것으로 본다. 0.2% 는 240px 시트에서 0.5px —
 * 더 조이면 눈에 안 보이는 꼬리 동안 닫히는 파트가 남아 클릭을 막는다.
 */
const REST_DELTA = 0.002
const REST_SPEED = 0.02

/** 각진동수(ω)와 감쇠비(ζ). mass 로 나눈 뒤의 값이라 적분식이 단순해진다. */
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

/** from 에서 초기 속도 velocity 로 출발해 to 에 멎을 때까지의 프레임. 늘 두 프레임 이상이다. */
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

/** 재생 시각(ms)의 위치·속도 — 프레임 사이는 선형 보간. */
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
