import type { IconDefinition } from '../types'
import { c, g, ink, p, pivot, pop, push, scallop, spring, swing, turn, write } from './kit'

const quickInk = { duration: 340, bounce: 0 }

export const statusIcons: readonly IconDefinition[] = [
  {
    name: 'Check',
    category: 'Status',
    tags: ['done', 'confirm', 'selected', '확인', '완료'],
    nodes: [g('settle', ink('tick', 'm4.5 12.5 4.6 4.6a1 1 0 0 0 1.4 0l9-10'))],
    motion: [
      write('tick', { spring: quickInk }),
      push('settle', { scale: 1.14 }, { at: 150, hold: 50, spring: spring.bouncy }),
    ],
  },
  {
    name: 'CheckCircle2',
    category: 'Status',
    tags: ['success', 'complete', 'verified', '완료', '성공'],
    nodes: [g('ring', c(12, 12, 8.25)), ink('check', 'm8.1 12 2.6 2.8 5.5-5.6')],
    motion: [pop('ring', { scale: 1.08 }), write('check', { at: 60, spring: quickInk })],
  },
  {
    name: 'XCircle',
    category: 'Status',
    tags: ['error', 'failed', 'remove', '오류', '실패'],
    nodes: [g('ring', c(12, 12, 8.25)), g('cross', p('m9.2 9.2 5.6 5.6'), p('m14.8 9.2-5.6 5.6'))],
    motion: [pop('ring', { scale: 1.08 }), turn('cross', { rotate: 90 }, { at: 40 })],
  },
  {
    name: 'AlertCircle',
    category: 'Status',
    tags: ['error', 'warning', 'attention', '오류', '주의'],
    nodes: [g('ring', c(12, 12, 8.3)), g('mark', p('M12 7.5v5.5'), p('M12 16.3v.2'))],
    motion: [
      pop('ring', { scale: 1.07 }),
      swing('mark', { x: 1.6 }, { beats: 4, interval: 70, spring: spring.snappy }),
    ],
  },
  {
    name: 'AlertTriangle',
    category: 'Status',
    tags: ['warning', 'caution', 'risk', '경고', '주의'],
    nodes: [
      pivot(
        g(
          'sign',
          p('M10.5 4.9a1.7 1.7 0 0 1 3 0l7 12.9a1.7 1.7 0 0 1-1.5 2.5H5a1.7 1.7 0 0 1-1.5-2.5Z'),
          p('M12 9.5v4.2'),
          p('M12 16.7v.1')
        ),
        12,
        20.3
      ),
    ],
    motion: [swing('sign', { rotate: 7 }, { beats: 4, interval: 80 })],
  },
  {
    name: 'Info',
    category: 'Status',
    tags: ['information', 'help', 'details', '정보', '안내'],
    nodes: [c(12, 12, 8.3), g('stem', p('M12 11v5')), g('dot', p('M12 7.9v.2'))],
    motion: [
      push('dot', { y: -2 }, { hold: 80, spring: spring.bouncy }),
      push('stem', { scaleY: 0.7 }, { hold: 60, origin: '50% 100%', spring: spring.bouncy }),
    ],
  },
  {
    name: 'BadgeCheck',
    category: 'Status',
    tags: ['verified', 'certified', 'approved', '인증', '검증'],
    nodes: [
      pivot(g('badge', p(scallop(12, 12, 7, 9.4, 8))), 12, 12),
      ink('check', 'm8.6 12 2.3 2.4 4.6-4.7'),
    ],
    motion: [turn('badge', { rotate: 45 }), write('check', { at: 80, spring: quickInk })],
  },
  {
    name: 'ShieldCheck',
    category: 'Status',
    tags: ['security', 'protected', 'safe', '보안', '보호'],
    nodes: [
      g(
        'shield',
        p(
          'M12 3.5c2.5 1.7 5 2.6 7.5 3v5.7c0 3.8-2.5 6.7-7.5 8.3-5-1.6-7.5-4.5-7.5-8.3V6.5c2.5-.4 5-1.3 7.5-3Z'
        )
      ),
      ink('check', 'm8.5 11.8 2.4 2.4 4.6-4.6'),
    ],
    motion: [pop('shield', { scale: 1.07 }), write('check', { at: 80, spring: quickInk })],
  },
  {
    name: 'Loader2',
    category: 'Status',
    tags: ['loading', 'spinner', 'progress', '로딩', '진행'],
    nodes: [
      pivot(
        g(
          'orbit',
          p('M12 3.5a8.5 8.5 0 0 1 8.5 8.5'),
          p('M19.4 16.2A8.5 8.5 0 0 1 8 19.5'),
          p('M4.5 16A8.5 8.5 0 0 1 6 6')
        ),
        12,
        12
      ),
    ],
    motion: [turn('orbit', { rotate: 360 }, { spring: spring.glide })],
  },
]
