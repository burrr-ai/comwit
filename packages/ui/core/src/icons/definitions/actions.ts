import type { IconDefinition } from '../types'
import {
  c,
  custom,
  enter,
  g,
  gear,
  ink,
  p,
  pivot,
  pop,
  push,
  r,
  spring,
  swing,
  turn,
  write,
} from './kit'

export const actionIcons: readonly IconDefinition[] = [
  {
    name: 'Plus',
    category: 'Actions',
    tags: ['add', 'create', 'new', '추가', '생성'],
    nodes: [g('tap', g('cross', p('M5 12h14'), p('M12 5v14')))],
    motion: [turn('cross', { rotate: 90 }), pop('tap', { scale: 1.12 }, { dip: 0.8 })],
  },
  {
    name: 'Minus',
    category: 'Actions',
    tags: ['remove', 'subtract', 'decrease', '빼기', '감소'],
    nodes: [g('bar', p('M5 12h14'))],
    motion: [pop('bar', { scaleX: 1.18 }, { dip: 0.9 })],
  },
  {
    name: 'X',
    category: 'Actions',
    tags: ['close', 'cancel', 'dismiss', '닫기', '취소'],
    nodes: [g('tap', g('cross', p('m6 6 12 12'), p('M18 6 6 18')))],
    motion: [turn('cross', { rotate: 90 }), pop('tap', { scale: 1.1 }, { dip: 0.8 })],
  },
  {
    name: 'Copy',
    category: 'Actions',
    tags: ['duplicate', 'clipboard', 'clone', '복사', '복제'],
    nodes: [
      p('M7 15.5H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h7.5a2 2 0 0 1 2 2v1'),
      g('duplicate', r(8.5, 8.5, 11.5, 11.5, 2.5)),
    ],
    // The copy starts over the original and slides out to its own place.
    motion: [enter('duplicate', { x: -4.5, y: -4.5 }, { spring: spring.snappy })],
  },
  {
    name: 'Pencil',
    category: 'Actions',
    tags: ['edit', 'write', 'modify', '수정', '편집'],
    nodes: [
      ink('line', 'M4 20h6'),
      pivot(
        g(
          'pencil',
          p(
            'm5 18 .8-6L15.5 3.8a1.8 1.8 0 0 1 2.5.1l2.1 2.3a1.8 1.8 0 0 1-.2 2.5l-9.7 8.2L5 18ZM13.6 5.5l4.4 4.8M5.8 12l4.4 4.9'
          )
        ),
        5,
        18
      ),
    ],
    motion: [
      swing('pencil', { rotate: -7, x: 0.8 }, { beats: 4, interval: 85 }),
      write('line', { at: 40, spring: { duration: 520, bounce: 0 } }),
    ],
  },
  {
    name: 'PenLine',
    category: 'Actions',
    tags: ['edit', 'sign', 'compose', '작성', '서명'],
    nodes: [
      ink('line', 'M12.5 20.5h8'),
      pivot(
        g(
          'pen',
          p('M15.4 4.2a2.1 2.1 0 0 1 3 0l1.4 1.4a2.1 2.1 0 0 1 0 3L8.4 20 3.5 20.5 4 15.6Z')
        ),
        4,
        20
      ),
    ],
    motion: [
      swing('pen', { rotate: -6, x: 0.9 }, { beats: 4, interval: 85 }),
      write('line', { at: 60, spring: { duration: 520, bounce: 0 } }),
    ],
  },
  {
    name: 'Trash2',
    category: 'Actions',
    tags: ['delete', 'remove', 'bin', '삭제', '휴지통'],
    nodes: [
      g(
        'body',
        p('m6.5 9 .6 9.3a2 2 0 0 0 2 1.7h5.8a2 2 0 0 0 2-1.7l.6-9'),
        p('M10 10.5v5.8M14 10.5v5.8')
      ),
      pivot(
        g('lid', p('M4.5 6.5h15M9 6.5V5a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 5v1.5')),
        4.5,
        6.5
      ),
    ],
    motion: [
      push('lid', { y: -1, rotate: -11 }, { hold: 150, spring: spring.bouncy }),
      push('body', { scaleY: 0.94 }, { at: 260, hold: 40, origin: '50% 100%' }),
    ],
  },
  {
    name: 'Search',
    category: 'Actions',
    tags: ['find', 'lookup', 'query', '검색', '찾기'],
    nodes: [g('across', g('along', c(10.5, 10.5, 6.5), p('m15.2 15.2 4.8 4.8')))],
    // Two out-of-phase swings trace a small loop, like a lens scanning a page.
    motion: [
      swing('across', { x: 1.8 }, { beats: 3, interval: 130 }),
      swing('along', { y: -1.5 }, { at: 65, beats: 3, interval: 130 }),
    ],
  },
  {
    name: 'Settings',
    category: 'Actions',
    tags: ['preferences', 'gear', 'options', '설정', '환경설정'],
    nodes: [g('gear', p(gear(12, 12, 8.5, 6.8, 6, 13.2, 22.4))), c(12, 12, 3)],
    motion: [turn('gear', { rotate: 120 }, { spring: { duration: 620, bounce: 0.38 } })],
  },
  {
    name: 'SlidersHorizontal',
    category: 'Actions',
    tags: ['filters', 'adjust', 'controls', '필터', '조정'],
    nodes: [
      g('upper-left', p('M4 7h3')),
      g('upper-right', p('M11 7h9')),
      g('lower-left', p('M4 17h9')),
      g('lower-right', p('M17 17h3')),
      g('upper', c(9, 7, 2)),
      g('lower', c(15, 17, 2)),
    ],
    // Knobs and the tracks either side share one spring, so the gaps never open.
    motion: [
      ...(
        [
          ['upper', 'upper-left', 'upper-right', 3, 9, 5, 0],
          ['lower', 'lower-left', 'lower-right', 9, 3, -5, 60],
        ] as const
      ).flatMap(([knob, left, right, leftLength, rightLength, distance, at]) => {
        const options = { at, hold: 160, spring: spring.bouncy }
        return [
          push(knob, { x: distance }, options),
          push(left, { scaleX: 1 + distance / leftLength }, { ...options, origin: '0% 50%' }),
          push(right, { scaleX: 1 - distance / rightLength }, { ...options, origin: '100% 50%' }),
        ]
      }),
    ],
  },
  {
    name: 'Filter',
    category: 'Actions',
    tags: ['funnel', 'refine', 'narrow', '필터', '거르기'],
    nodes: [
      g(
        'funnel',
        p(
          'M4.3 4.5h15.4a.8.8 0 0 1 .6 1.3l-5.8 6.9v6.1a.8.8 0 0 1-.4.7l-3 1.6a.8.8 0 0 1-1.2-.7v-7.7L3.7 5.8a.8.8 0 0 1 .6-1.3Z'
        )
      ),
    ],
    motion: [pop('funnel', { scaleX: 0.86, scaleY: 1.08 }, { origin: '50% 0%' })],
  },
  {
    name: 'RefreshCw',
    category: 'Actions',
    tags: ['reload', 'sync', 'retry', '새로고침', '동기화'],
    nodes: [
      g(
        'cycle',
        p('M19 9A7.4 7.4 0 0 0 7 6M20 4.5V9h-4.5'),
        p('M5 15a7.4 7.4 0 0 0 12 3M4 19.5V15h4.5')
      ),
    ],
    motion: [turn('cycle', { rotate: 180 }, { spring: { duration: 600, bounce: 0.32 } })],
  },
  {
    name: 'RefreshCcw',
    category: 'Actions',
    tags: ['reload', 'revert', 'sync', '새로고침', '되돌리기'],
    nodes: [
      g(
        'cycle',
        p('M5 9a7.4 7.4 0 0 1 12-3M4 4.5V9h4.5'),
        p('M19 15a7.4 7.4 0 0 1-12 3M20 19.5V15h-4.5')
      ),
    ],
    motion: [turn('cycle', { rotate: -180 }, { spring: { duration: 600, bounce: 0.32 } })],
  },
  {
    name: 'RotateCcw',
    category: 'Actions',
    tags: ['undo', 'reset', 'restore', '실행 취소', '초기화'],
    nodes: [
      g('shrink', pivot(g('rewind', p('M5 9a7.5 7.5 0 1 1-.2 6.1'), p('M4 4.5V9h4.5')), 12.3, 12)),
    ],
    motion: [
      turn('rewind', { rotate: -360 }, { spring: spring.glide }),
      push('shrink', { scale: 0.88 }, { hold: 260, spring: spring.smooth }),
    ],
  },
  {
    name: 'History',
    category: 'Actions',
    tags: ['recent', 'activity', 'timeline', '기록', '최근'],
    nodes: [
      pivot(g('rewind', p('M4.5 12a7.5 7.5 0 1 0 2.2-5.3L4.5 9'), p('M4.5 4.5V9H9')), 12, 12),
      pivot(g('hand', p('M12 8v4l2.8 1.7')), 12, 12),
    ],
    motion: [
      push('rewind', { rotate: -30 }, { hold: 160, spring: spring.bouncy }),
      turn('hand', { rotate: -360 }, { spring: spring.glide }),
    ],
  },
  {
    name: 'Link2',
    category: 'Actions',
    tags: ['url', 'chain', 'connect', '링크', '연결'],
    nodes: [
      g('left', p('m10.3 15.9-1.4 1.4a3.7 3.7 0 0 1-5.2-5.2l3.4-3.4a3.7 3.7 0 0 1 5.2 0')),
      g('right', p('m12.7 8.1 1.4-1.4a3.7 3.7 0 0 1 5.2 5.2l-3.4 3.4a3.7 3.7 0 0 1-5.2 0')),
      ink('bridge', 'm8.8 13.8 6.4-3.6'),
    ],
    motion: [
      push('left', { x: -1.5, y: 0.9 }, { hold: 120, spring: spring.bouncy }),
      push('right', { x: 1.5, y: -0.9 }, { hold: 120, spring: spring.bouncy }),
      write('bridge', { at: 200 }),
    ],
  },
  {
    name: 'MoreHorizontal',
    category: 'Actions',
    tags: ['more', 'menu', 'overflow', '더보기', '메뉴'],
    nodes: [g('first', c(5, 12, 1)), g('second', c(12, 12, 1)), g('third', c(19, 12, 1))],
    motion: ['first', 'second', 'third'].map((part, index) =>
      push(part, { y: -2.6 }, { at: index * 70, hold: 80, spring: spring.bouncy })
    ),
  },
  {
    name: 'Eye',
    category: 'Actions',
    tags: ['view', 'show', 'visible', '보기', '표시'],
    nodes: [
      g(
        'lid',
        p('M2.8 12C4.7 8 8 6 12 6s7.3 2 9.2 6c-1.9 4-5.2 6-9.2 6s-7.3-2-9.2-6Z'),
        g('pupil', c(12, 12, 2.8))
      ),
    ],
    motion: [
      push('lid', { scaleY: 0.08 }, { hold: 70, spring: spring.snappy }),
      custom(
        'pupil',
        { x: 1.6 },
        [
          [260, -1],
          [430, 1],
          [600, 0],
        ],
        { spring: spring.snappy }
      ),
    ],
  },
  {
    name: 'EyeOff',
    category: 'Actions',
    tags: ['hide', 'hidden', 'invisible', '숨기기', '비공개'],
    nodes: [
      g(
        'lid',
        p(
          'M10 6.2A9 9 0 0 1 12 6c4 0 7.3 2 9.2 6a11.6 11.6 0 0 1-2.1 3M14.1 14.1a3 3 0 0 1-4.2-4.2M17 17.1A9.4 9.4 0 0 1 12 18c-4 0-7.3-2-9.2-6a11.7 11.7 0 0 1 3.9-4.7'
        )
      ),
      ink('slash', 'M3.5 3.5l17 17'),
    ],
    motion: [
      push('lid', { scaleY: 0.7 }, { hold: 90, spring: spring.bouncy }),
      write('slash', { at: 40, spring: { duration: 380, bounce: 0 } }),
    ],
  },
  {
    name: 'Bookmark',
    category: 'Actions',
    tags: ['save', 'favorite', 'keep', '북마크', '저장'],
    nodes: [
      g(
        'ribbon',
        p(
          'M6.5 3.5h11a1 1 0 0 1 1 1v15.3a.6.6 0 0 1-.9.5L12 16.6l-5.6 3.7a.6.6 0 0 1-.9-.5V4.5a1 1 0 0 1 1-1Z'
        )
      ),
    ],
    motion: [pop('ribbon', { scaleY: 1.2, scaleX: 0.9 }, { origin: '50% 0%', dip: 0.8 })],
  },
  {
    name: 'ThumbsUp',
    category: 'Actions',
    tags: ['like', 'approve', 'agree', '좋아요', '추천'],
    nodes: [
      pivot(
        g(
          'hand',
          p('M7.5 10.5v10H5a1.5 1.5 0 0 1-1.5-1.5v-7A1.5 1.5 0 0 1 5 10.5Z'),
          p(
            'M7.5 10.5l3.7-6.2a1.6 1.6 0 0 1 2.9 1.2l-.9 3.5h5.1a2 2 0 0 1 2 2.4l-1.3 6.7a2 2 0 0 1-2 1.6H7.5'
          )
        ),
        5,
        20.5
      ),
    ],
    motion: [push('hand', { rotate: -12, y: -1.2 }, { hold: 120, spring: spring.bouncy })],
  },
  {
    name: 'Save',
    category: 'Actions',
    tags: ['disk', 'store', 'keep', '저장', '디스크'],
    nodes: [
      g(
        'disk',
        p('M15.5 3.5H6A2.5 2.5 0 0 0 3.5 6v12A2.5 2.5 0 0 0 6 20.5h12a2.5 2.5 0 0 0 2.5-2.5V8.5Z'),
        p('M7.5 20.5v-6.2a.8.8 0 0 1 .8-.8h7.4a.8.8 0 0 1 .8.8v6.2'),
        g('shutter', p('M7.5 3.5v3.7a.8.8 0 0 0 .8.8H14'))
      ),
    ],
    motion: [
      pop('disk', { scale: 1.08 }, { dip: 1 }),
      push('shutter', { x: 1.6 }, { at: 60, hold: 100, spring: spring.bouncy }),
    ],
  },
  {
    name: 'Wrench',
    category: 'Actions',
    tags: ['tool', 'fix', 'maintenance', '도구', '수리'],
    nodes: [
      pivot(
        g(
          'wrench',
          p(
            'M14.6 3.8a4.6 4.6 0 0 0-4.2 6.1l-6.2 6.2a2 2 0 0 0 2.8 2.8l6.2-6.2a4.6 4.6 0 0 0 6.1-4.2l-2.7 2.7-2.6-.4-.4-2.6Z'
          )
        ),
        15.4,
        8.4
      ),
    ],
    motion: [push('wrench', { rotate: -20 }, { hold: 140, spring: spring.bouncy })],
  },
]
