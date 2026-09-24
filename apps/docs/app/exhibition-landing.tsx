'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState, useSyncExternalStore } from 'react'
import { motion, useMotionValue, useSpring, useTransform, type MotionValue } from 'motion/react'
import { ArrowUpRightIcon } from '@phosphor-icons/react/dist/csr/ArrowUpRight'
import { SquaresFourIcon } from '@phosphor-icons/react/dist/csr/SquaresFour'
import { PauseIcon } from '@phosphor-icons/react/dist/csr/Pause'
import { PlayIcon } from '@phosphor-icons/react/dist/csr/Play'
import { SiteHeader } from './site-header'

function subscribePresentation(listener: () => void) {
  const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
  preference.addEventListener('change', listener)
  document.addEventListener('visibilitychange', listener)
  return () => {
    preference.removeEventListener('change', listener)
    document.removeEventListener('visibilitychange', listener)
  }
}
function presentationAllowed() {
  return !document.hidden && !window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
const serverPresentation = () => false

function Letter({
  letter,
  index,
  x,
  y,
  active,
}: {
  letter: string
  index: number
  x: MotionValue<number>
  y: MotionValue<number>
  active: boolean
}) {
  const lift = useTransform(
    [x, y],
    ([px, py]) => Math.sin(index * 0.8 + Number(px) * 2) * Number(py) * 22
  )
  const turn = useTransform(x, [-1, 1], [(index - 2.5) * 0.8, (2.5 - index) * 0.8])
  return (
    <span className="exhibition-letter-slot">
      <motion.span
        style={{ y: active ? lift : 0, rotate: active ? turn : 0 }}
        className="exhibition-letter"
      >
        {letter}
      </motion.span>
    </span>
  )
}

export function ExhibitionLanding() {
  const allowed = useSyncExternalStore(
    subscribePresentation,
    presentationAllowed,
    serverPresentation
  )
  const [paused, setPaused] = useState(false)
  const [library, setLibrary] = useState<'state' | 'ui' | null>(null)
  const active = allowed && !paused
  const targetX = useMotionValue(0)
  const targetY = useMotionValue(0)
  const x = useSpring(targetX, { stiffness: 55, damping: 22, mass: 1.5 })
  const y = useSpring(targetY, { stiffness: 55, damping: 22, mass: 1.5 })
  const artX = useTransform(x, [-1, 1], [-27, 27])
  const artY = useTransform(y, [-1, 1], [-16, 16])
  const artRotate = useTransform(x, [-1, 1], [-4, 4])

  return (
    <div
      className="exhibition"
      data-moving={active}
      data-library={library ?? 'all'}
      onPointerMove={(event) => {
        if (!active || event.pointerType !== 'mouse') return
        const bounds = event.currentTarget.getBoundingClientRect()
        targetX.set(((event.clientX - bounds.left) / bounds.width) * 2 - 1)
        targetY.set(((event.clientY - bounds.top) / bounds.height) * 2 - 1)
      }}
      onPointerLeave={() => {
        targetX.set(0)
        targetY.set(0)
        setLibrary(null)
      }}
    >
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <SiteHeader />
      <main id="main" className="exhibition-main">
        <div className="exhibition-meta">
          <span>OPEN SOURCE. OPEN ENDED.</span>
          <a href="https://comwit.io" target="_blank" rel="noreferrer">
            FROM COMWIT.IO <ArrowUpRightIcon size={13} aria-hidden="true" />
          </a>
        </div>
        <h1 className="exhibition-title" aria-label="Comwit">
          <span aria-hidden="true">
            {'COMWIT'.split('').map((letter, index) => (
              <Letter key={index} letter={letter} index={index} x={x} y={y} active={active} />
            ))}
          </span>
        </h1>
        <div className="exhibition-scene">
          <div className="exhibition-note">
            <p>
              Small pieces.
              <br />
              Wild possibilities.
            </p>
            <span>STATE & UI FOR REACT</span>
          </div>
          <motion.div
            className="exhibition-art"
            style={{ x: active ? artX : 0, y: active ? artY : 0, rotate: active ? artRotate : 0 }}
            aria-hidden="true"
          >
            <div className="exhibition-art-float">
              <Image
                src="/art/comwit-play-sculpture.webp"
                alt=""
                fill
                priority
                sizes="(max-width: 600px) 110vw, (max-width: 1100px) 75vw, 850px"
              />
            </div>
          </motion.div>
          <div className="exhibition-edition">
            <span>BUILT TO BE</span>
            <strong>yours.</strong>
          </div>
        </div>
        <nav className="exhibition-routes" aria-label="Choose a library">
          <Link
            href="/state/docs"
            onPointerEnter={() => setLibrary('state')}
            onPointerLeave={() => setLibrary(null)}
            onFocus={() => setLibrary('state')}
            onBlur={() => setLibrary(null)}
            className="exhibition-route"
          >
            <span className="exhibition-route-index">01</span>
            <Image src="/panda-mark.webp" alt="" width={46} height={46} />
            <span className="exhibition-route-title">State</span>
            <span className="exhibition-route-detail">
              One domain.
              <br />
              One hook.
            </span>
            <span className="exhibition-route-arrow">
              <ArrowUpRightIcon size={32} aria-hidden="true" />
            </span>
            <span className="sr-only"> documentation</span>
          </Link>
          <Link
            href="/ui"
            onPointerEnter={() => setLibrary('ui')}
            onPointerLeave={() => setLibrary(null)}
            onFocus={() => setLibrary('ui')}
            onBlur={() => setLibrary(null)}
            className="exhibition-route"
          >
            <span className="exhibition-route-index">02</span>
            <SquaresFourIcon size={43} weight="fill" aria-hidden="true" />
            <span className="exhibition-route-title">UI</span>
            <span className="exhibition-route-detail">
              Your interface.
              <br />
              Your rules.
            </span>
            <span className="exhibition-route-arrow">
              <ArrowUpRightIcon size={32} aria-hidden="true" />
            </span>
            <span className="sr-only"> documentation</span>
          </Link>
        </nav>
      </main>
      <footer className="exhibition-footer">
        <span>GOOD TOGETHER. GREAT ON THEIR OWN.</span>
        <div>
          <Link href="/blog">RELEASES ↗</Link>
          <a href="https://github.com/burrr-ai/comwit/blob/latest/LICENSE">MIT</a>
          <button
            type="button"
            aria-label={!allowed ? 'Motion disabled' : paused ? 'Play motion' : 'Pause motion'}
            aria-pressed={paused || !allowed}
            disabled={!allowed}
            onClick={() => setPaused(!paused)}
          >
            {paused || !allowed ? (
              <PlayIcon size={12} weight="fill" aria-hidden="true" />
            ) : (
              <PauseIcon size={12} weight="fill" aria-hidden="true" />
            )}
            <span>{!allowed ? 'STATIC' : paused ? 'PLAY' : 'PAUSE'}</span>
          </button>
        </div>
      </footer>
    </div>
  )
}
