'use client'

import { Copy, useCopy } from '@/i18n/copy'
import { useTranslations } from 'next-intl'

import { Button } from '@comwit/ui-templates/button'
import Image from 'next/image'
import Link from 'next/link'
import { useState, useSyncExternalStore } from 'react'
import { motion, useMotionValue, useSpring, useTransform, type MotionValue } from 'motion/react'
import { ArrowUpRightIcon } from '@phosphor-icons/react/dist/csr/ArrowUpRight'
import { SquaresFourIcon } from '@phosphor-icons/react/dist/csr/SquaresFour'
import { TreeStructureIcon } from '@phosphor-icons/react/dist/csr/TreeStructure'
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
  const localize = useCopy()
  const copy = useTranslations('Copy')

  const allowed = useSyncExternalStore(
    subscribePresentation,
    presentationAllowed,
    serverPresentation
  )
  const [paused, setPaused] = useState(false)
  const [library, setLibrary] = useState<'state' | 'ui' | 'template' | null>(null)
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
        <Copy id="text017" />{' '}
      </a>
      <SiteHeader />
      <main id="main" className="exhibition-main">
        <div className="exhibition-meta">
          <span>
            <Copy id="text107" />
          </span>
          <a href="https://comwit.io" target="_blank" rel="noreferrer">
            <Copy id="text108" /> <ArrowUpRightIcon size={13} aria-hidden="true" />
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
              <Copy id="text110" /> <br />
              <Copy id="text111" />{' '}
            </p>
            <span>
              <Copy id="text112" />
            </span>
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
            <span>
              <Copy id="text113" />
            </span>
            <strong>
              <Copy id="text114" />
            </strong>
          </div>
        </div>
        <nav className="exhibition-routes" aria-label={copy('text115')}>
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
              <Copy id="text117" /> <br />
              <Copy id="text118" />{' '}
            </span>
            <span className="exhibition-route-arrow">
              <ArrowUpRightIcon size={32} aria-hidden="true" />
            </span>
            <span className="sr-only">
              {' '}
              <Copy id="text119" />
            </span>
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
              <Copy id="text121" /> <br />
              <Copy id="text122" />{' '}
            </span>
            <span className="exhibition-route-arrow">
              <ArrowUpRightIcon size={32} aria-hidden="true" />
            </span>
            <span className="sr-only">
              {' '}
              <Copy id="text119" />
            </span>
          </Link>
          <Link
            href="/template"
            onPointerEnter={() => setLibrary('template')}
            onPointerLeave={() => setLibrary(null)}
            onFocus={() => setLibrary('template')}
            onBlur={() => setLibrary(null)}
            className="exhibition-route"
          >
            <span className="exhibition-route-index">03</span>
            <TreeStructureIcon size={43} weight="fill" aria-hidden="true" />
            <span className="exhibition-route-title">Template</span>
            <span className="exhibition-route-detail">
              <Copy id="text073" /> <br />
              <Copy id="text124" />{' '}
            </span>
            <span className="exhibition-route-arrow">
              <ArrowUpRightIcon size={32} aria-hidden="true" />
            </span>
            <span className="sr-only">
              {' '}
              <Copy id="text119" />
            </span>
          </Link>
        </nav>
      </main>
      <footer className="exhibition-footer">
        <span>
          <Copy id="text125" />
        </span>
        <div>
          <Link href="/blog">
            <Copy id="text126" />
          </Link>
          <a href="https://github.com/burrr-ai/comwit/blob/latest/LICENSE">MIT</a>
          <a href="/llms.txt">LLMS.TXT</a>
          <Button
            variant="plain"
            size="none"
            type="button"
            aria-label={localize(
              !allowed ? 'Motion disabled' : paused ? 'Play motion' : 'Pause motion'
            )}
            aria-pressed={paused || !allowed}
            disabled={!allowed}
            onClick={() => setPaused(!paused)}
          >
            {paused || !allowed ? (
              <PlayIcon className="size-3" size={12} weight="fill" aria-hidden="true" />
            ) : (
              <PauseIcon className="size-3" size={12} weight="fill" aria-hidden="true" />
            )}
            <span>{copy(!allowed ? 'motionStatic' : paused ? 'motionPlay' : 'motionPause')}</span>
          </Button>
        </div>
      </footer>
    </div>
  )
}
