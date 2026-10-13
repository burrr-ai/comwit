import type { IconDefinition } from '../types'
import { c, custom, enter, g, p, pivot, pop, push, r, spokes, spring, swing, turn } from './kit'

const meridian =
  'M12 3.7c2.2 2.1 3.4 4.9 3.4 8.3s-1.2 6.2-3.4 8.3C9.8 18.2 8.6 15.4 8.6 12s1.2-6.2 3.4-8.3Z'
const shackle = 'M8 10V7.5a4 4 0 0 1 8 0V10'
const minuteLap = (part = 'minute') => turn(part, { rotate: 360 }, { spring: spring.glide })

export const objectIcons: readonly IconDefinition[] = [
  {
    name: 'Briefcase',
    category: 'Objects',
    tags: ['work', 'job', 'business', '업무', '직장'],
    nodes: [
      g(
        'lift',
        pivot(
          g(
            'sway',
            r(3.5, 7.5, 17, 13, 2),
            p('M8.5 7.5V5a1.5 1.5 0 0 1 1.5-1.5h4A1.5 1.5 0 0 1 15.5 5v2.5'),
            p('M3.5 12.5c5.7 2 11.3 2 17 0'),
            p('M10.5 13.5v3h3v-3')
          ),
          12,
          3.5
        )
      ),
    ],
    // Picked up by the handle, the case swings a little under it.
    motion: [
      push('lift', { y: -1.4 }, { hold: 140, spring: spring.bouncy }),
      swing('sway', { rotate: 6 }, { at: 40, beats: 4, interval: 100, spring: spring.wobbly }),
    ],
  },
  {
    name: 'CalendarDays',
    category: 'Objects',
    tags: ['date', 'schedule', 'events', '날짜', '일정'],
    nodes: [
      r(3.8, 5.8, 16.4, 14.7, 2),
      g('left-ring', p('M7.8 3.5v4.2')),
      g('right-ring', p('M16.2 3.5v4.2')),
      p('M3.8 10.3h16.4'),
      ...[
        [7.5, 14],
        [11.8, 14],
        [16, 14],
        [7.5, 17],
        [11.8, 17],
      ].map(([x, y], index) => g(`day-${index + 1}`, p(`M${x} ${y}h.5`))),
    ],
    motion: [
      push('left-ring', { y: -1.3 }, { hold: 70, spring: spring.bouncy }),
      push('right-ring', { y: -1.3 }, { at: 50, hold: 70, spring: spring.bouncy }),
      ...[1, 2, 3, 4, 5].map((day) =>
        enter(`day-${day}`, { scale: 0, opacity: 0 }, { at: 40 + day * 45 })
      ),
    ],
  },
  {
    name: 'Clock3',
    category: 'Objects',
    tags: ['time', 'hour', 'schedule', '시간', '시계'],
    nodes: [
      c(12, 12, 8.3),
      p('M12 6v.3M18 12h-.3M12 18v-.3M6 12h.3'),
      pivot(g('minute', p('M12 8v4')), 12, 12),
      p('M12 12h3.5'),
    ],
    motion: [minuteLap()],
  },
  {
    name: 'Clock',
    category: 'Objects',
    tags: ['time', 'duration', 'recent', '시간', '기간'],
    nodes: [c(12, 12, 8.3), pivot(g('minute', p('M12 7.2V12')), 12, 12), p('M12 12l3.2 1.9')],
    motion: [minuteLap()],
  },
  {
    name: 'CreditCard',
    category: 'Objects',
    tags: ['payment', 'billing', 'card', '결제', '카드'],
    nodes: [g('card', r(3.5, 5.5, 17, 13, 2), p('M3.5 10h17'), p('M7 14.7h3.5'), p('M16 14.7h1'))],
    // A swipe: the card slides and tilts, then settles back.
    motion: [push('card', { x: 1.6, rotate: -8 }, { hold: 120, spring: spring.bouncy })],
  },
  {
    name: 'Globe2',
    category: 'Objects',
    tags: ['world', 'language', 'internet', '세계', '언어'],
    nodes: [c(12, 12, 8.3), p('M3.7 12h16.6'), g('meridian', p(meridian))],
    motion: [turn('meridian', { scaleX: -1 }, { spring: { duration: 720, bounce: 0.15 } })],
  },
  {
    name: 'Globe',
    category: 'Objects',
    tags: ['world', 'website', 'public', '세계', '웹사이트'],
    nodes: [c(12, 12, 8.3), p('M4.3 9h15.4M4.3 15h15.4'), g('meridian', p(meridian))],
    motion: [turn('meridian', { scaleX: -1 }, { spring: { duration: 720, bounce: 0.15 } })],
  },
  {
    name: 'GraduationCap',
    category: 'Objects',
    tags: ['education', 'learn', 'course', '교육', '학습'],
    nodes: [
      g(
        'cap',
        p('m3.5 8.5 8.5-4 8.5 4-8.5 4ZM6.5 10v6.2c3.8 2.3 7.2 2.3 11 0V10'),
        pivot(g('tassel', p('M20.5 8.5v8.3'), p('M20.5 16.8l-1 2.7h1.5')), 20.5, 8.5)
      ),
    ],
    // Thrown up; the tassel follows through after the cap lands.
    motion: [
      push('cap', { y: -2.3, rotate: -7 }, { hold: 110, spring: spring.bouncy }),
      swing('tassel', { rotate: 20 }, { at: 60, beats: 4, interval: 100, spring: spring.wobbly }),
    ],
  },
  {
    name: 'Heart',
    category: 'Objects',
    tags: ['like', 'favorite', 'love', '좋아요', '관심'],
    nodes: [
      g(
        'heart',
        p(
          'M12 20s-8.5-5.1-8.5-10.8a4.7 4.7 0 0 1 8.5-2.7 4.7 4.7 0 0 1 8.5 2.7C20.5 14.9 12 20 12 20Z'
        )
      ),
    ],
    // Two beats: a strong one, then a softer echo.
    motion: [
      custom('heart', { scale: 1.18 }, [
        [0, -0.45],
        [80, 1],
        [180, -0.1],
        [260, 0.55],
        [350, 0],
      ]),
    ],
  },
  {
    name: 'Star',
    category: 'Objects',
    tags: ['favorite', 'rating', 'featured', '즐겨찾기', '평점'],
    nodes: [
      pivot(
        g('star', p('M12 3.7l2.6 5.4 5.9.8-4.3 4.2 1 6-5.2-2.8-5.2 2.8 1-6-4.3-4.2 5.9-.8Z')),
        12,
        12.4
      ),
    ],
    motion: [pop('star', { scale: 1.2, rotate: -14 }, { dip: 0.5 })],
  },
  {
    name: 'Sparkles',
    category: 'Objects',
    tags: ['magic', 'ai', 'shine', '반짝임', '인공지능'],
    nodes: [
      g('spark', p('M9.7 4.8 12 10l5.2 2.3L12 14.6l-2.3 5.2-2.3-5.2-4.1-2.3L7.4 10Z')),
      g('small-star', p('m18 3.5.9 2.6 2.1.9-2.1.9-.9 2.6-.9-2.6-2.1-.9 2.1-.9Z')),
      g('cross', p('M18.5 16v4M16.5 18h4')),
    ],
    motion: [
      pop('spark', { scale: 1.16, rotate: 10 }, { dip: 0.5 }),
      enter('small-star', { scale: 0, rotate: -90, opacity: 0 }, { at: 110 }),
      turn('cross', { rotate: 90 }, { at: 190 }),
    ],
  },
  {
    name: 'KeyRound',
    category: 'Objects',
    tags: ['password', 'access', 'credential', '비밀번호', '열쇠'],
    nodes: [
      pivot(
        g('key', p('M13.2 12.2a5 5 0 1 0-2.1-2.1L3.5 17.7v2.8h3v-2.7h2.7v-2.6Z'), c(16.5, 7.3, 1)),
        15.4,
        8.6
      ),
    ],
    // Turned in the lock, then released.
    motion: [
      custom(
        'key',
        { rotate: 12 },
        [
          [0, -0.4],
          [80, 1],
          [230, 0],
        ],
        { spring: spring.bouncy }
      ),
    ],
  },
  {
    name: 'Lock',
    category: 'Objects',
    tags: ['private', 'secure', 'locked', '잠금', '비공개'],
    nodes: [g('case', r(5, 10, 14, 10.5, 2.2), p('M12 14v2.5')), g('shackle', p(shackle))],
    // The shackle springs open and snaps shut; the case takes the impact.
    motion: [
      push('shackle', { y: -2.3 }, { hold: 150, spring: spring.bouncy }),
      push('case', { scaleY: 0.94 }, { at: 260, hold: 40, origin: '50% 100%' }),
    ],
  },
  {
    name: 'LockKeyhole',
    category: 'Objects',
    tags: ['security', 'vault', 'protected', '보안', '잠금'],
    nodes: [
      r(5, 10, 14, 10.5, 2.2),
      g('shackle', p(shackle)),
      pivot(g('keyhole', c(12, 14.3, 1.2), p('M12 15.5v2')), 12, 14.3),
    ],
    motion: [
      push('keyhole', { rotate: 90 }, { hold: 150, spring: spring.bouncy }),
      push('shackle', { y: -2.3 }, { at: 90, hold: 140, spring: spring.bouncy }),
    ],
  },
  {
    name: 'MapPin',
    category: 'Objects',
    tags: ['location', 'place', 'address', '위치', '장소'],
    nodes: [
      g(
        'hop',
        g(
          'squash',
          p('M19 10.5c0 5-7 10-7 10s-7-5-7-10a7 7 0 0 1 14 0Z'),
          g('point', c(12, 10.5, 2.5))
        )
      ),
    ],
    // Crouch, hop, land; the centre pulses on landing.
    motion: [
      push('squash', { scaleY: 0.86, scaleX: 1.06 }, { hold: 50, origin: '50% 100%' }),
      push('hop', { y: -2.4 }, { at: 60, hold: 90, spring: spring.bouncy }),
      pop('point', { scale: 1.45 }, { at: 220, dip: 0.2 }),
    ],
  },
  {
    name: 'Rocket',
    category: 'Objects',
    tags: ['launch', 'deploy', 'startup', '출시', '배포'],
    nodes: [
      g(
        'rocket',
        p(
          'M10 15.7 8.3 14c.7-4.9 4.8-9.3 11.9-10.2.1 6.6-4.2 11.3-9 12.1L10 15.7ZM8.5 10.5 5.5 11.5 3.8 15l4.5-1M13.5 15.5l-1 4.7 3.5-1.7 1-3'
        ),
        c(15.8, 8.3, 1.5),
        g('flame', p('M7.2 16.8c-2.4-.1-3.5 1.4-3.5 3.5 2.1 0 3.6-1.1 3.5-3.5Z'))
      ),
    ],
    motion: [
      custom(
        'rocket',
        { x: 2.4, y: -2.4 },
        [
          [0, -0.35],
          [110, 1],
          [250, 0],
        ],
        { spring: spring.bouncy }
      ),
      push('flame', { scale: 1.35 }, { hold: 160, origin: '100% 0%', spring: spring.bouncy }),
    ],
  },
  {
    name: 'Smartphone',
    category: 'Objects',
    tags: ['mobile', 'device', 'phone', '모바일', '휴대폰'],
    nodes: [g('phone', r(6.5, 3.5, 11, 17, 2), p('M10 6h4'), p('M11.2 17.8h1.6'))],
    // A short buzz.
    motion: [swing('phone', { rotate: 9 }, { beats: 6, interval: 55 })],
  },
  {
    name: 'Coffee',
    category: 'Objects',
    tags: ['break', 'cafe', 'drink', '커피', '휴식'],
    nodes: [
      p('M4.5 9.5H16v5a4.8 4.8 0 0 1-4.8 4.8H9.3a4.8 4.8 0 0 1-4.8-4.8Z'),
      p('M16 11h1.4a2.4 2.4 0 0 1 0 4.8H16'),
      g('first-steam', p('M8.3 7.3c-.9-1 .9-1.9 0-3.1')),
      g('second-steam', p('M12.3 7.3c-.9-1 .9-1.9 0-3.1')),
    ],
    motion: [
      enter('first-steam', { y: 2.2, opacity: 0 }, { spring: { duration: 560, bounce: 0 } }),
      enter(
        'second-steam',
        { y: 2.2, opacity: 0 },
        { at: 110, spring: { duration: 560, bounce: 0 } }
      ),
    ],
  },
  {
    name: 'Crown',
    category: 'Objects',
    tags: ['premium', 'owner', 'vip', '프리미엄', '관리자'],
    nodes: [
      pivot(
        g('crown', p('M4 8.5l3.8 3.6L12 5.5l4.2 6.6L20 8.5l-1.6 8.5H5.6Z'), p('M6 20h12')),
        12,
        20
      ),
    ],
    motion: [push('crown', { y: -2, rotate: -9 }, { hold: 100, spring: spring.bouncy })],
  },
  {
    name: 'Building2',
    category: 'Objects',
    tags: ['company', 'organization', 'office', '회사', '조직'],
    nodes: [
      p('M5.5 20.5V5A1.5 1.5 0 0 1 7 3.5h6.5A1.5 1.5 0 0 1 15 5v15.5'),
      p('M15 9.5h3a1.5 1.5 0 0 1 1.5 1.5v9.5'),
      p('M3.5 20.5h17'),
      g('floor-3', p('M8.5 7.5h3')),
      g('floor-2', p('M8.5 11h3')),
      g('floor-1', p('M8.5 14.5h3')),
      g('annex', p('M17.2 13.5h.1M17.2 16.5h.1')),
    ],
    // Lights come on floor by floor.
    motion: ['floor-1', 'floor-2', 'floor-3', 'annex'].map((part, index) =>
      enter(part, { opacity: 0.12 }, { at: index * 80, spring: spring.smooth })
    ),
  },
  {
    name: 'Sun',
    category: 'Objects',
    tags: ['light mode', 'day', 'brightness', '라이트 모드', '낮'],
    nodes: [g('core', c(12, 12, 3.8)), pivot(g('rays', p(spokes(12, 12, 6.4, 8.4, 8))), 12, 12)],
    motion: [turn('rays', { rotate: 45 }), pop('core', { scale: 1.16 }, { dip: 0.5 })],
  },
  {
    name: 'Moon',
    category: 'Objects',
    tags: ['dark mode', 'night', 'sleep', '다크 모드', '밤'],
    nodes: [
      pivot(g('moon', p('M19.8 14.6A8.2 8.2 0 1 1 9.4 4.2a7.6 7.6 0 0 0 10.4 10.4Z')), 12, 12),
    ],
    // Rocks like a cradle.
    motion: [swing('moon', { rotate: -16 }, { beats: 3, interval: 130, spring: spring.wobbly })],
  },
  {
    name: 'Wifi',
    category: 'Objects',
    tags: ['network', 'internet', 'connection', '와이파이', '네트워크'],
    nodes: [
      p('M12 19.2v.1'),
      g('near', p('M8.8 15.8a4.6 4.6 0 0 1 6.4 0')),
      g('middle', p('M5.7 12.6a9 9 0 0 1 12.6 0')),
      g('far', p('M2.6 9.4a13.4 13.4 0 0 1 18.8 0')),
    ],
    // The signal reaches outward, ring by ring.
    motion: ['near', 'middle', 'far'].map((part, index) =>
      enter(part, { opacity: 0.12, scale: 0.9 }, { at: index * 90, spring: spring.smooth })
    ),
  },
  {
    name: 'Zap',
    category: 'Objects',
    tags: ['flash', 'power', 'fast', '번개', '빠름'],
    nodes: [g('bolt', p('M13.2 3.5 5 13.5h6.6l-.8 7 8.2-10h-6.6Z'))],
    motion: [pop('bolt', { scale: 1.2, rotate: -8 }, { dip: 0.6 })],
  },
  {
    name: 'Flag',
    category: 'Objects',
    tags: ['report', 'milestone', 'mark', '신고', '마일스톤'],
    nodes: [
      p('M5 21V3.8'),
      g(
        'cloth',
        p('M5 4.6c2.4-1.4 4.8-1.4 7.2 0s4.8 1.4 7.3 0v8.9c-2.5 1.4-4.9 1.4-7.3 0s-4.8-1.4-7.2 0')
      ),
    ],
    motion: [
      swing(
        'cloth',
        { skewY: 7, scaleX: 0.93 },
        { beats: 4, interval: 110, origin: '0% 50%', spring: spring.wobbly }
      ),
    ],
  },
  {
    name: 'LayoutGrid',
    category: 'Objects',
    tags: ['grid', 'apps', 'dashboard', '그리드', '대시보드'],
    nodes: [
      g('first', r(4, 4, 6.5, 6.5, 1.5)),
      g('second', r(13.5, 4, 6.5, 6.5, 1.5)),
      g('third', r(4, 13.5, 6.5, 6.5, 1.5)),
      g('fourth', r(13.5, 13.5, 6.5, 6.5, 1.5)),
    ],
    motion: ['first', 'second', 'third', 'fourth'].map((part, index) =>
      push(part, { scale: 0.7 }, { at: [0, 50, 50, 100][index], hold: 60, spring: spring.bouncy })
    ),
  },
  {
    name: 'SquareKanban',
    category: 'Objects',
    tags: ['kanban', 'board', 'tasks', '칸반', '작업'],
    nodes: [
      r(3.5, 3.5, 17, 17, 2.5),
      g('first', p('M8 7.5v6')),
      g('second', p('M12 7.5v3')),
      g('third', p('M16 7.5v8.5')),
    ],
    motion: ['first', 'second', 'third'].map((part, index) =>
      push(
        part,
        { scaleY: [0.45, 2, 0.5][index] },
        { at: index * 60, hold: 110, origin: '50% 0%', spring: spring.bouncy }
      )
    ),
  },
]
