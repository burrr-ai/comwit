'use client'

import { useRef, useState } from 'react'
import { action, ComwitProvider, create, model } from '@comwit/state'
import { CopyButton } from './copy-button'
import { motion, useMotionValue, useTransform } from 'motion/react'
import { useGarden } from './garden-scene'

const counter = model({ count: 1 })
const counterActions = action(({ state }) => {
  const m = state(counter)
  return {
    increment() {
      m.count += 1
    },
    reset() {
      m.count = 1
    },
  }
})
const useCounter = create<{ count: number }, { increment(): void; reset(): void }>(counter, {
  actions: [counterActions],
})

export type DemoExample = {
  title: string
  code: string
  html: string
}

function Counter() {
  const garden = useGarden()
  const { count, actions } = useCounter((s) => ({ count: s.count, actions: s.actions }))
  return (
    <div className="live-counter">
      <output aria-live="polite" aria-label="Counter value">
        <motion.span
          key={count}
          initial={garden?.active ? { y: 7, opacity: 0.4, scale: 0.9 } : false}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 16 }}
        >
          {count}
        </motion.span>
      </output>
      <button
        type="button"
        className="increment-button"
        onClick={() => {
          actions.increment()
          garden?.nudge()
        }}
      >
        one up
      </button>
      <button type="button" className="reset-button" onClick={actions.reset}>
        reset
      </button>
    </div>
  )
}

export function StateDemo({ examples }: { examples: DemoExample[] }) {
  const [active, setActive] = useState(1)
  const garden = useGarden()
  const fallback = useMotionValue(0)
  const rotateY = useTransform(garden?.x ?? fallback, [-1, 1], [-2.4, 2.4])
  const rotateX = useTransform(garden?.y ?? fallback, [-1, 1], [1.8, -1.8])
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([])
  const example = examples[active]
  return (
    <ComwitProvider>
      <motion.div
        className="demo-stage"
        style={{
          rotateX: garden?.active ? rotateX : 0,
          rotateY: garden?.active ? rotateY : 0,
          transformPerspective: 1200,
        }}
      >
        <Counter />
        <div className="code-window">
          <div className="code-toolbar">
            <div role="tablist" aria-label="Counter example" className="code-tabs">
              {examples.map((item, index) => (
                <button
                  type="button"
                  key={item.title}
                  role="tab"
                  id={`example-tab-${index}`}
                  ref={(element) => {
                    tabRefs.current[index] = element
                  }}
                  aria-selected={active === index}
                  aria-controls="example-panel"
                  tabIndex={active === index ? 0 : -1}
                  onClick={() => setActive(index)}
                  onKeyDown={(event) => {
                    let next = index
                    if (event.key === 'ArrowRight') next = (index + 1) % examples.length
                    else if (event.key === 'ArrowLeft')
                      next = (index - 1 + examples.length) % examples.length
                    else if (event.key === 'Home') next = 0
                    else if (event.key === 'End') next = examples.length - 1
                    else return
                    event.preventDefault()
                    setActive(next)
                    tabRefs.current[next]?.focus()
                  }}
                >
                  {item.title}
                </button>
              ))}
            </div>
            <CopyButton
              key={example.title}
              text={example.code}
              className="code-copy"
              label={`Copy ${example.title} example`}
            >
              Copy
            </CopyButton>
          </div>
          <div
            id="example-panel"
            role="tabpanel"
            aria-labelledby={`example-tab-${active}`}
            tabIndex={0}
          >
            <pre>
              <code dangerouslySetInnerHTML={{ __html: example.html }} />
            </pre>
          </div>
        </div>
      </motion.div>
    </ComwitProvider>
  )
}
