'use client'

import Image from 'next/image'
import { createContext, useContext, useEffect, useRef, useState, useSyncExternalStore } from 'react'
import {
  motion,
  useAnimationControls,
  useMotionValue,
  useSpring,
  useTransform,
  type MotionValue,
} from 'motion/react'

type GardenContext = {
  x: MotionValue<number>
  y: MotionValue<number>
  active: boolean
  nudge(): void
}
const GardenContext = createContext<GardenContext | null>(null)
export function useGarden() {
  return useContext(GardenContext)
}

function Fireflies({ active }: { active: boolean }) {
  const canvas = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const element = canvas.current
    const context = element?.getContext('2d')
    if (!element || !context) return
    if (!active) {
      context.clearRect(0, 0, element.width, element.height)
      return
    }
    let frame = 0
    let width = 0
    let height = 0
    let visible = true
    const particles = Array.from({ length: 32 }, (_, i) => ({
      x: ((i * 137.508) % 1000) / 1000,
      y: ((i * 251.73) % 1000) / 1000,
      phase: i * 2.4,
      radius: 0.6 + (i % 4) * 0.35,
    }))
    const resize = new ResizeObserver(([entry]) => {
      width = entry.contentRect.width
      height = entry.contentRect.height
      const density = Math.min(window.devicePixelRatio, 2)
      element.width = width * density
      element.height = height * density
      context.setTransform(density, 0, 0, density, 0, 0)
    })
    resize.observe(element)
    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
    })
    intersection.observe(element)
    const draw = (now: number) => {
      if (visible && !document.hidden) {
        const time = now / 1000
        context.clearRect(0, 0, width, height)
        for (const particle of particles) {
          const px = particle.x * width + Math.sin(time * 0.22 + particle.phase) * 22
          const py = particle.y * height + Math.cos(time * 0.16 + particle.phase) * 18
          const alpha = 0.12 + (Math.sin(time * 0.8 + particle.phase) + 1) * 0.17
          context.beginPath()
          context.fillStyle = `rgba(246, 209, 162, ${alpha})`
          context.shadowColor = '#edc29b'
          context.shadowBlur = 8
          context.arc(px, py, particle.radius, 0, Math.PI * 2)
          context.fill()
        }
      }
      frame = requestAnimationFrame(draw)
    }
    frame = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(frame)
      resize.disconnect()
      intersection.disconnect()
    }
  }, [active])
  return <canvas ref={canvas} className="garden-fireflies" aria-hidden="true" />
}

function subscribeMotionPreference(callback: () => void) {
  const media = window.matchMedia('(prefers-reduced-motion: reduce)')
  media.addEventListener('change', callback)
  return () => media.removeEventListener('change', callback)
}
function motionPreference() {
  return !window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function GardenScene({ children }: { children: React.ReactNode }) {
  const motionAllowed = useSyncExternalStore(
    subscribeMotionPreference,
    motionPreference,
    () => false
  )
  const reducedMotion = !motionAllowed
  const [paused, setPaused] = useState(false)
  const [inView, setInView] = useState(true)
  const scene = useRef<HTMLElement>(null)
  const active = motionAllowed && !paused && inView
  const targetX = useMotionValue(0)
  const targetY = useMotionValue(0)
  const x = useSpring(targetX, { stiffness: 45, damping: 20, mass: 1.2 })
  const y = useSpring(targetY, { stiffness: 45, damping: 20, mass: 1.2 })
  const forestX = useTransform(x, [-1, 1], [8, -8])
  const forestY = useTransform(y, [-1, 1], [5, -5])
  const pandaX = useTransform(x, [-1, 1], [22, -22])
  const pandaY = useTransform(y, [-1, 1], [12, -12])
  const pandaRotation = useTransform(x, [-1, 1], [-0.7, 0.7])
  const response = useAnimationControls()

  useEffect(() => {
    const element = scene.current
    if (!element) return
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      threshold: 0.05,
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  function nudge() {
    if (active)
      void response.start({
        y: [0, -13, 0],
        rotate: [0, -1.3, 0.7, 0],
        transition: { duration: 0.7, ease: 'easeInOut' },
      })
  }

  return (
    <GardenContext.Provider value={{ x, y, active, nudge }}>
      <section
        ref={scene}
        className={`home-hero garden-scene ${active ? 'garden-moving' : ''}`}
        onPointerMove={(event) => {
          if (!active || event.pointerType !== 'mouse') return
          const bounds = event.currentTarget.getBoundingClientRect()
          targetX.set(((event.clientX - bounds.left) / bounds.width) * 2 - 1)
          targetY.set(((event.clientY - bounds.top) / bounds.height) * 2 - 1)
        }}
        onPointerLeave={() => {
          targetX.set(0)
          targetY.set(0)
        }}
      >
        <div className="garden-layers" aria-hidden="true">
          <motion.div
            className="garden-layer forest-layer"
            style={{ x: active ? forestX : 0, y: active ? forestY : 0 }}
          >
            <div className="garden-frame">
              <Image
                src="/panda-garden-background.webp"
                alt=""
                fill
                priority
                sizes="100vw"
                className="hero-art"
              />
            </div>
          </motion.div>
          <motion.div
            className="garden-layer panda-layer"
            style={{
              x: active ? pandaX : 0,
              y: active ? pandaY : 0,
              rotate: active ? pandaRotation : 0,
            }}
          >
            <div className="garden-frame">
              <motion.div className="panda-response" animate={response}>
                <div className="panda-idle">
                  <Image
                    src="/panda-garden.webp"
                    alt=""
                    fill
                    priority
                    sizes="100vw"
                    className="hero-art"
                  />
                </div>
              </motion.div>
            </div>
          </motion.div>
          <Fireflies active={active} />
        </div>
        {children}
        <button
          type="button"
          className="motion-toggle"
          aria-pressed={paused}
          disabled={reducedMotion === true}
          onClick={() => {
            setPaused(!paused)
            targetX.set(0)
            targetY.set(0)
            response.stop()
          }}
        >
          {reducedMotion ? 'Reduced motion' : paused ? 'Play the garden' : 'Pause the garden'}
        </button>
      </section>
    </GardenContext.Provider>
  )
}
