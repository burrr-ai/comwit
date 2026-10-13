import type { IconDefinition } from '../types'
import {
  c,
  e,
  enter,
  g,
  ink,
  nudge,
  p,
  pivot,
  push,
  r,
  spokes,
  spring,
  swing,
  turn,
  write,
} from './kit'

const cog = (cx: number, cy: number) =>
  pivot(g('cog', c(cx, cy, 1.9), p(spokes(cx, cy, 2.9, 3.8, 6))), cx, cy)

export const developmentIcons: readonly IconDefinition[] = [
  {
    name: 'GitBranch',
    category: 'Development',
    tags: ['branch', 'version control', 'fork', '브랜치', '깃'],
    nodes: [
      p('M6.5 3.5v11.7'),
      c(6.5, 17.5, 2.3),
      ink('branch', 'M8.8 17.5c5.5 0 8.7-3.7 8.7-8.7'),
      g('tip', c(17.5, 6.5, 2.3)),
    ],
    // The new line grows out of the trunk, then its head appears.
    motion: [
      write('branch', { spring: { duration: 380, bounce: 0 } }),
      enter('tip', { scale: 0, opacity: 0 }, { at: 200 }),
    ],
  },
  {
    name: 'Code2',
    category: 'Development',
    tags: ['code', 'source', 'developer', '코드', '개발'],
    nodes: [
      g('left', p('M8 7.5 3.5 12 8 16.5')),
      g('right', p('m16 7.5 4.5 4.5-4.5 4.5')),
      g('slash', p('m13.5 5.5-3 13')),
    ],
    motion: [
      push('left', { x: -1.5 }, { hold: 100, spring: spring.bouncy }),
      push('right', { x: 1.5 }, { hold: 100, spring: spring.bouncy }),
      push('slash', { rotate: 16 }, { hold: 100, spring: spring.bouncy }),
    ],
  },
  {
    name: 'SquareTerminal',
    category: 'Development',
    tags: ['terminal', 'console', 'command line', '터미널', '콘솔'],
    nodes: [
      r(3.5, 3.5, 17, 17, 2.5),
      g('prompt', p('m7.5 9 3 3-3 3')),
      ink('cursor', 'M13 15h3.5'),
    ],
    motion: [nudge('prompt', { x: 1.4 }), write('cursor', { at: 140 })],
  },
  {
    name: 'ServerCog',
    category: 'Development',
    tags: ['server', 'infrastructure', 'configure', '서버', '인프라'],
    nodes: [
      r(3.5, 3.5, 17, 7, 2),
      p('M11.5 13.5h-6a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h6'),
      g('upper-light', p('M7 7h.4')),
      g('lower-light', p('M7 17h.4')),
      cog(17, 17),
    ],
    motion: [
      turn('cog', { rotate: 120 }, { spring: { duration: 620, bounce: 0.38 } }),
      enter('upper-light', { opacity: 0 }, { at: 80, spring: spring.smooth }),
      enter('lower-light', { opacity: 0 }, { at: 160, spring: spring.smooth }),
    ],
  },
  {
    name: 'MonitorCog',
    category: 'Development',
    tags: ['system', 'display settings', 'desktop', '시스템', '모니터'],
    nodes: [r(3, 4, 18, 12.5, 2), p('M12 16.5v4M8.5 20.5h7'), cog(12, 10.2)],
    motion: [turn('cog', { rotate: 120 }, { spring: { duration: 620, bounce: 0.38 } })],
  },
  {
    name: 'Database',
    category: 'Development',
    tags: ['storage', 'data', 'records', '데이터베이스', '저장소'],
    nodes: [
      g('lid', e(12, 6.5, 7.5, 3)),
      p('M4.5 6.5v11c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3v-11'),
      g('layer', p('M4.5 11.8c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3')),
    ],
    motion: [
      push('lid', { y: -1.8 }, { hold: 100, spring: spring.bouncy }),
      push('layer', { y: -0.9 }, { at: 50, hold: 80, spring: spring.bouncy }),
    ],
  },
  {
    name: 'Bot',
    category: 'Development',
    tags: ['robot', 'assistant', 'ai', '봇', '인공지능'],
    nodes: [
      r(4.5, 8, 15, 11.5, 3),
      pivot(g('antenna', p('M12 8V5.3'), c(12, 4.2, 1.1)), 12, 8),
      g('eyes', p('M9.5 12.6v2'), p('M14.5 12.6v2')),
      p('M2.5 12.5v3M21.5 12.5v3'),
    ],
    motion: [
      push('eyes', { scaleY: 0.1 }, { hold: 60, spring: spring.snappy }),
      swing('antenna', { rotate: 18 }, { at: 40, beats: 4, interval: 90, spring: spring.wobbly }),
    ],
  },
]
