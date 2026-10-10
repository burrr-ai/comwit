import type { IconDefinition } from '../types'
import { c, enter, g, p, pop, push, r, spring } from './kit'

export const mediaIcons: readonly IconDefinition[] = [
  {
    name: 'Play',
    category: 'Media',
    tags: ['start', 'video', 'resume', '재생', '시작'],
    nodes: [
      g(
        'triangle',
        p('M7 5.4v13.2a1 1 0 0 0 1.5.9l10.6-6.6a1 1 0 0 0 0-1.8L8.5 4.5a1 1 0 0 0-1.5.9Z')
      ),
    ],
    motion: [pop('triangle', { scale: 1.12, x: 0.8 }, { dip: 0.7 })],
  },
  {
    name: 'Pause',
    category: 'Media',
    tags: ['stop', 'hold', 'break', '일시정지', '멈춤'],
    nodes: [g('left', r(6, 4.5, 4, 15, 1.2)), g('right', r(14, 4.5, 4, 15, 1.2))],
    motion: [
      push('left', { scaleY: 0.72 }, { hold: 70, spring: spring.bouncy }),
      push('right', { scaleY: 0.72 }, { at: 80, hold: 70, spring: spring.bouncy }),
    ],
  },
  {
    name: 'Mic',
    category: 'Media',
    tags: ['microphone', 'voice', 'record', '마이크', '음성'],
    nodes: [
      g('capsule', r(9, 3, 6, 11, 3)),
      g('cradle', p('M5.5 11a6.5 6.5 0 0 0 13 0')),
      p('M12 17.5v3.3'),
    ],
    motion: [
      push('capsule', { y: -1.4 }, { hold: 80, spring: spring.bouncy }),
      pop('cradle', { scale: 1.1 }, { at: 70, dip: 0.4 }),
    ],
  },
  {
    name: 'Volume2',
    category: 'Media',
    tags: ['sound', 'audio', 'speaker', '소리', '볼륨'],
    nodes: [
      g(
        'speaker',
        p(
          'M3.5 9.8v4.4a1 1 0 0 0 1 1h2.8l4.4 3.6a.9.9 0 0 0 1.5-.7V5.9a.9.9 0 0 0-1.5-.7L7.3 8.8H4.5a1 1 0 0 0-1 1Z'
        )
      ),
      g('near-wave', p('M16.2 9.2a4.2 4.2 0 0 1 0 5.6')),
      g('far-wave', p('M19 6.4a8.3 8.3 0 0 1 0 11.2')),
    ],
    motion: [
      pop('speaker', { scale: 1.08 }, { origin: '100% 50%' }),
      enter('near-wave', { x: -1.6, opacity: 0 }, { at: 60, spring: spring.snappy }),
      enter('far-wave', { x: -2.6, opacity: 0 }, { at: 130, spring: spring.snappy }),
    ],
  },
  {
    name: 'Camera',
    category: 'Media',
    tags: ['photo', 'capture', 'picture', '카메라', '촬영'],
    nodes: [
      g(
        'body',
        p(
          'M4.5 7.5h2.7l1.5-2.2a1 1 0 0 1 .8-.4h5a1 1 0 0 1 .8.4l1.5 2.2h2.7A1.5 1.5 0 0 1 21 9v9a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18V9a1.5 1.5 0 0 1 1.5-1.5Z'
        ),
        g('lens', c(12, 13.2, 3.3))
      ),
    ],
    // A shutter: the lens closes down and the body gives a small kick.
    motion: [
      push('lens', { scale: 0.45 }, { hold: 70, spring: spring.bouncy }),
      push('body', { scale: 0.94 }, { hold: 50, spring: spring.bouncy }),
    ],
  },
]
