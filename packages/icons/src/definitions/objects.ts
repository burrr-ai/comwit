import type { IconDefinition, IconMotion, IconNode } from '../types'

const p = (d: string, attrs: IconNode['attrs'] = {}): IconNode => ({
  tag: 'path',
  attrs: { d, ...attrs },
})
const c = (cx: number, cy: number, r: number): IconNode => ({ tag: 'circle', attrs: { cx, cy, r } })
const r = (x: number, y: number, width: number, height: number, rx = 1.5): IconNode => ({
  tag: 'rect',
  attrs: { x, y, width, height, rx },
})
const g = (part: string, ...children: IconNode[]): IconNode => ({ tag: 'g', part, children })
const named = (part: string, node: IconNode): IconNode => ({ ...node, part })
// Normalized lengths make line-writing independent of each original path's length.
const ink = (part: string, d: string): IconNode => ({
  tag: 'path',
  part,
  attrs: { d, pathLength: 1 },
})
const track = (
  part: string,
  keyframes: Keyframe[],
  duration = 800,
  delay = 0,
  easing = 'cubic-bezier(.4,0,.2,1)'
): IconMotion => ({ part, keyframes, duration, delay, easing })
const motion = (
  part: string,
  frames: readonly (readonly [number, string])[],
  duration = 800,
  delay = 0,
  origin = 'center'
): IconMotion =>
  track(
    part,
    frames.map(([offset, transform]) => ({ offset, transform, transformOrigin: origin })),
    duration,
    delay
  )
// Start from the resting stroke, erase briefly, then write once. No dash remains at rest.
const draw = (part: string, duration = 700, delay = 0): IconMotion =>
  track(
    part,
    [
      { offset: 0, strokeDasharray: 'none', strokeDashoffset: '0', opacity: 1 },
      { offset: 0.12, strokeDasharray: '1', strokeDashoffset: '1', opacity: 0 },
      { offset: 0.22, strokeDasharray: '1', strokeDashoffset: '1', opacity: 1 },
      { offset: 0.85, strokeDasharray: '1', strokeDashoffset: '0', opacity: 1 },
      { offset: 1, strokeDasharray: 'none', strokeDashoffset: '0', opacity: 1 },
    ],
    duration,
    delay
  )
const fade = (part: string, duration = 700, delay = 0): IconMotion =>
  track(
    part,
    [
      { offset: 0, opacity: 1 },
      { offset: 0.2, opacity: 0.2 },
      { offset: 0.6, opacity: 1 },
      { offset: 1, opacity: 1 },
    ],
    duration,
    delay
  )

/** Original Comwit geometry. Each finite timeline resolves back to the resting drawing. */
export const objectIcons: readonly IconDefinition[] = [
  {
    name: 'Users',
    category: 'People',
    tags: ['team', 'members', 'group', '사용자', '팀'],
    nodes: [
      g('leader-head', c(9, 8, 3)),
      ink('leader-shoulders', 'M3.5 20v-2.2A4.3 4.3 0 0 1 7.8 13.5h2.4a4.3 4.3 0 0 1 4.3 4.3V20'),
      g('companion-head', p('M15.2 5.3a3 3 0 0 1 0 5.4')),
      ink('companion-shoulders', 'M17 13.7a4.2 4.2 0 0 1 3.5 4.1V20'),
    ],
    motion: [
      motion(
        'leader-head',
        [
          [0, 'translateY(0)'],
          [0.3, 'translateY(.7px) scaleY(.94)'],
          [0.55, 'translateY(0)'],
          [1, 'translateY(0)'],
        ],
        780
      ),
      motion(
        'companion-head',
        [
          [0, 'translateY(0)'],
          [0.28, 'translateY(.6px) scaleY(.94)'],
          [0.6, 'translateY(0)'],
          [1, 'translateY(0)'],
        ],
        740,
        100
      ),
      draw('companion-shoulders', 650, 180),
    ],
  },
  {
    name: 'MessageCircle',
    category: 'Communication',
    tags: ['chat', 'comment', '대화', '댓글'],
    nodes: [
      g(
        'bubble',
        p(
          'M12 3.5c5 0 8.5 3.1 8.5 7.5s-3.5 7.5-8.5 7.5c-1.1 0-2.2-.2-3.2-.5L4 20l1-4.2A6.9 6.9 0 0 1 3.5 11C3.5 6.6 7 3.5 12 3.5Z'
        )
      ),
      ink('first-line', 'M8 9.5h8'),
      ink('second-line', 'M8 12.8h5'),
    ],
    motion: [
      motion(
        'bubble',
        [
          [0, 'scale(1)'],
          [0.2, 'scale(.97,1.02)'],
          [0.55, 'scale(1)'],
          [1, 'scale(1)'],
        ],
        800,
        0,
        '20% 100%'
      ),
      draw('first-line', 650, 70),
      draw('second-line', 650, 230),
    ],
  },
  {
    name: 'CheckCircle2',
    category: 'Status',
    tags: ['success', 'complete', 'done', '완료', '성공'],
    nodes: [
      named('ring', { ...c(12, 12, 8.25), attrs: { ...c(12, 12, 8.25).attrs, pathLength: 1 } }),
      g('check-settle', ink('check', 'm8.1 12 2.6 2.8 5.5-5.6')),
    ],
    motion: [
      draw('ring', 700),
      draw('check', 650, 180),
      motion(
        'check-settle',
        [
          [0, 'scale(1)'],
          [0.25, 'scale(.94)'],
          [0.73, 'scale(1.06)'],
          [1, 'scale(1)'],
        ],
        760,
        100
      ),
    ],
  },
  {
    name: 'FileText',
    category: 'Files',
    tags: ['document', 'page', '문서', '파일'],
    nodes: [
      p(
        'M14 3.5H6.7A1.7 1.7 0 0 0 5 5.2v13.6a1.7 1.7 0 0 0 1.7 1.7h10.6a1.7 1.7 0 0 0 1.7-1.7V8.5L14 3.5Z'
      ),
      g('fold', p('M14 3.5v3.5A1.5 1.5 0 0 0 15.5 8.5H19')),
      ink('line-one', 'M8.5 12h7'),
      ink('line-two', 'M8.5 15.5h5'),
    ],
    motion: [
      motion(
        'fold',
        [
          [0, 'scale(1)'],
          [0.22, 'scale(.82,.85)'],
          [0.55, 'scale(1)'],
          [1, 'scale(1)'],
        ],
        700,
        0,
        '0% 100%'
      ),
      draw('line-one', 700, 80),
      draw('line-two', 700, 230),
    ],
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
      motion(
        'spark',
        [
          [0, 'scale(1) rotate(0deg)'],
          [0.2, 'scale(.76) rotate(-9deg)'],
          [0.5, 'scale(1.04) rotate(4deg)'],
          [0.8, 'scale(.98) rotate(0deg)'],
          [1, 'scale(1) rotate(0deg)'],
        ],
        880
      ),
      motion(
        'small-star',
        [
          [0, 'scale(1)'],
          [0.2, 'scale(.4)'],
          [0.55, 'scale(1.15)'],
          [1, 'scale(1)'],
        ],
        650,
        130
      ),
      motion(
        'cross',
        [
          [0, 'rotate(0deg) scale(1)'],
          [0.35, 'rotate(45deg) scale(.55)'],
          [0.75, 'rotate(5deg) scale(1.1)'],
          [1, 'rotate(0deg) scale(1)'],
        ],
        680,
        250
      ),
    ],
  },
  {
    name: 'ImagePlus',
    category: 'Files',
    tags: ['photo', 'picture', 'upload', '이미지', '사진추가'],
    nodes: [
      p('M20.5 12.2v6.3a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2v-13a2 2 0 0 1 2-2h6.3'),
      g('sun', c(8.5, 8.5, 1.4)),
      ink('landscape', 'm3.5 17 4.2-4.2a1.2 1.2 0 0 1 1.7 0l3 3 2-2a1.2 1.2 0 0 1 1.7 0l4.4 4.4'),
      g('plus-horizontal', p('M14 7h7')),
      g('plus-vertical', p('M17.5 3.5v7')),
    ],
    motion: [
      motion(
        'plus-horizontal',
        [
          [0, 'scaleX(1)'],
          [0.2, 'scaleX(.1)'],
          [0.5, 'scaleX(1)'],
          [1, 'scaleX(1)'],
        ],
        650
      ),
      motion(
        'plus-vertical',
        [
          [0, 'scaleY(1)'],
          [0.2, 'scaleY(.1)'],
          [0.58, 'scaleY(1)'],
          [1, 'scaleY(1)'],
        ],
        650,
        100
      ),
      draw('landscape', 750, 170),
      motion(
        'sun',
        [
          [0, 'scale(1)'],
          [0.35, 'scale(.45)'],
          [0.7, 'scale(1.05)'],
          [1, 'scale(1)'],
        ],
        700,
        170
      ),
    ],
  },
  {
    name: 'Heart',
    category: 'Objects',
    tags: ['like', 'favorite', 'love', '좋아요', '하트'],
    nodes: [
      g(
        'heartbeat',
        named(
          'warmth',
          p(
            'M12 20s-8.5-5.1-8.5-10.8a4.7 4.7 0 0 1 8.5-2.7 4.7 4.7 0 0 1 8.5 2.7C20.5 14.9 12 20 12 20Z',
            { fill: 'currentColor', fillOpacity: 0 }
          )
        )
      ),
    ],
    motion: [
      motion(
        'heartbeat',
        [
          [0, 'scale(1)'],
          [0.15, 'scale(.96)'],
          [0.3, 'scale(1.075)'],
          [0.44, 'scale(.985)'],
          [0.6, 'scale(1.04)'],
          [0.8, 'scale(1)'],
          [1, 'scale(1)'],
        ],
        900
      ),
      track(
        'warmth',
        [
          { offset: 0, fillOpacity: 0 },
          { offset: 0.3, fillOpacity: 0.18 },
          { offset: 0.44, fillOpacity: 0.04 },
          { offset: 0.6, fillOpacity: 0.11 },
          { offset: 0.85, fillOpacity: 0 },
          { offset: 1, fillOpacity: 0 },
        ],
        900
      ),
    ],
  },
  {
    name: 'CalendarDays',
    category: 'Objects',
    tags: ['date', 'schedule', 'calendar', '달력', '일정'],
    nodes: [
      r(3.8, 5.8, 16.4, 14.7, 2),
      g('binding-left', p('M7.8 3.5v4.2')),
      g('binding-right', p('M16.2 3.5v4.2')),
      p('M3.8 10.3h16.4'),
      ...[
        [7.5, 14],
        [11.8, 14],
        [16, 14],
        [7.5, 17],
        [11.8, 17],
      ].map(([x, y], i) => g(`day-${i + 1}`, p(`M${x} ${y}h.5`))),
    ],
    motion: [
      motion(
        'binding-left',
        [
          [0, 'translateY(0)'],
          [0.25, 'translateY(.5px)'],
          [0.65, 'translateY(0)'],
          [1, 'translateY(0)'],
        ],
        650
      ),
      motion(
        'binding-right',
        [
          [0, 'translateY(0)'],
          [0.25, 'translateY(.5px)'],
          [0.65, 'translateY(0)'],
          [1, 'translateY(0)'],
        ],
        650,
        60
      ),
      ...Array.from({ length: 5 }, (_, i) =>
        track(
          `day-${i + 1}`,
          [
            { offset: 0, opacity: 1, transform: 'translateY(0)' },
            { offset: 0.18, opacity: 0, transform: 'translateY(-1px)' },
            { offset: 0.35, opacity: 0, transform: 'translateY(1px)' },
            { offset: 0.72, opacity: 1, transform: 'translateY(0)' },
            { offset: 1, opacity: 1, transform: 'translateY(0)' },
          ],
          650,
          80 + i * 55
        )
      ),
    ],
  },
  {
    name: 'Globe2',
    category: 'Objects',
    tags: ['world', 'language', 'web', '지구', '언어'],
    nodes: [
      c(12, 12, 8.3),
      ink('equator', 'M3.7 12h16.6'),
      g(
        'meridians',
        p(
          'M12 3.7c2.2 2.1 3.4 4.9 3.4 8.3s-1.2 6.2-3.4 8.3C9.8 18.2 8.6 15.4 8.6 12s1.2-6.2 3.4-8.3Z'
        )
      ),
    ],
    motion: [
      motion(
        'meridians',
        [
          [0, 'scaleX(1)'],
          [0.24, 'scaleX(.02)'],
          [0.5, 'scaleX(-1)'],
          [0.76, 'scaleX(.02)'],
          [1, 'scaleX(1)'],
        ],
        980
      ),
      draw('equator', 800, 100),
    ],
  },
  {
    name: 'Lock',
    category: 'Objects',
    tags: ['private', 'secure', 'locked', '잠금', '비공개'],
    nodes: [
      g('case', r(5, 10, 14, 10.5, 2.2)),
      g('shackle', p('M8 10V7.5a4 4 0 0 1 8 0V10')),
      g('key-slot', p('M12 14v2.5')),
    ],
    motion: [
      motion(
        'key-slot',
        [
          [0, 'rotate(0deg)'],
          [0.25, 'rotate(90deg)'],
          [0.65, 'rotate(90deg)'],
          [1, 'rotate(0deg)'],
        ],
        850
      ),
      motion(
        'shackle',
        [
          [0, 'translateY(0) rotate(0deg)'],
          [0.2, 'translateY(-.7px) rotate(0deg)'],
          [0.44, 'translateY(-.7px) rotate(-13deg)'],
          [0.67, 'translateY(-.7px) rotate(0deg)'],
          [0.82, 'translateY(.25px) rotate(0deg)'],
          [1, 'translateY(0) rotate(0deg)'],
        ],
        800,
        100,
        '100% 100%'
      ),
      motion(
        'case',
        [
          [0, 'translateY(0)'],
          [0.76, 'translateY(0)'],
          [0.85, 'translateY(.3px)'],
          [1, 'translateY(0)'],
        ],
        930
      ),
    ],
  },
  {
    name: 'AlertTriangle',
    category: 'Status',
    tags: ['warning', 'danger', '주의', '경고'],
    nodes: [
      named(
        'outline',
        p('M10.5 4.9a1.7 1.7 0 0 1 3 0l7 12.9a1.7 1.7 0 0 1-1.5 2.5H5a1.7 1.7 0 0 1-1.5-2.5Z')
      ),
      g('stem', p('M12 9.5v4.2')),
      g('dot', p('M12 16.7v.1')),
    ],
    motion: [
      track(
        'outline',
        [
          { offset: 0, strokeOpacity: 1 },
          { offset: 0.22, strokeOpacity: 0.45 },
          { offset: 0.45, strokeOpacity: 1 },
          { offset: 1, strokeOpacity: 1 },
        ],
        760
      ),
      motion(
        'stem',
        [
          [0, 'scaleY(1)'],
          [0.2, 'scaleY(.3)'],
          [0.46, 'scaleY(1.08)'],
          [0.7, 'scaleY(1)'],
          [1, 'scaleY(1)'],
        ],
        700,
        60,
        '50% 0%'
      ),
      track(
        'dot',
        [
          { offset: 0, opacity: 1 },
          { offset: 0.2, opacity: 0 },
          { offset: 0.45, opacity: 1 },
          { offset: 0.65, opacity: 0.4 },
          { offset: 1, opacity: 1 },
        ],
        650,
        180
      ),
    ],
  },
  {
    name: 'Link2',
    category: 'Actions',
    tags: ['url', 'chain', 'connect', '링크', '연결'],
    nodes: [
      g(
        'left-link',
        p('m9.3 15.9-1.4 1.4a3.7 3.7 0 0 1-5.2-5.2l3.4-3.4a3.7 3.7 0 0 1 5.2 0', {
          transform: 'translate(1 0)',
        })
      ),
      g(
        'right-link',
        p('m13.7 8.1 1.4-1.4a3.7 3.7 0 0 1 5.2 5.2l-3.4 3.4a3.7 3.7 0 0 1-5.2 0', {
          transform: 'translate(-1 0)',
        })
      ),
      ink('connection', 'm8.8 13.8 6.4-3.6'),
    ],
    motion: [
      motion(
        'left-link',
        [
          [0, 'translate(0,0) rotate(0deg)'],
          [0.28, 'translate(-.7px,.6px) rotate(-4deg)'],
          [0.6, 'translate(.2px,-.1px) rotate(0deg)'],
          [1, 'translate(0,0) rotate(0deg)'],
        ],
        820
      ),
      motion(
        'right-link',
        [
          [0, 'translate(0,0) rotate(0deg)'],
          [0.28, 'translate(.7px,-.6px) rotate(4deg)'],
          [0.6, 'translate(-.2px,.1px) rotate(0deg)'],
          [1, 'translate(0,0) rotate(0deg)'],
        ],
        820
      ),
      draw('connection', 700, 120),
    ],
  },
  {
    name: 'UserRound',
    category: 'People',
    tags: ['person', 'profile', 'account', '사용자', '프로필'],
    nodes: [
      g('head', c(12, 7.5, 3.5)),
      g('shoulders', p('M5 20.5v-1.2a5.3 5.3 0 0 1 5.3-5.3h3.4a5.3 5.3 0 0 1 5.3 5.3v1.2')),
    ],
    motion: [
      motion(
        'head',
        [
          [0, 'translateY(0) scaleY(1)'],
          [0.28, 'translateY(1px) scaleY(.94)'],
          [0.6, 'translateY(-.25px) scaleY(1)'],
          [1, 'translateY(0) scaleY(1)'],
        ],
        860
      ),
      motion(
        'shoulders',
        [
          [0, 'scale(1)'],
          [0.35, 'scale(1.04,.96)'],
          [0.7, 'scale(.99,1)'],
          [1, 'scale(1)'],
        ],
        780,
        100,
        '50% 100%'
      ),
    ],
  },
  {
    name: 'Rocket',
    category: 'Objects',
    tags: ['launch', 'start', 'boost', '로켓', '시작'],
    nodes: [
      g(
        'rocket',
        p(
          'M10 15.7 8.3 14c.7-4.9 4.8-9.3 11.9-10.2.1 6.6-4.2 11.3-9 12.1L10 15.7ZM8.5 10.5 5.5 11.5 3.8 15l4.5-1M13.5 15.5l-1 4.7 3.5-1.7 1-3'
        ),
        named('porthole', {
          ...c(15.8, 8.3, 1.5),
          attrs: { ...c(15.8, 8.3, 1.5).attrs, fill: 'currentColor', fillOpacity: 0 },
        })
      ),
      g('flame', p('M7.2 16.8c-2.4-.1-3.5 1.4-3.5 3.5 2.1 0 3.6-1.1 3.5-3.5Z')),
    ],
    motion: [
      motion(
        'rocket',
        [
          [0, 'translate(0,0)'],
          [0.18, 'translate(-.6px,.6px)'],
          [0.44, 'translate(.8px,-.8px)'],
          [0.7, 'translate(.35px,-.35px)'],
          [1, 'translate(0,0)'],
        ],
        940
      ),
      track(
        'flame',
        [
          { offset: 0, transform: 'scale(1)', opacity: 1, transformOrigin: '100% 0%' },
          { offset: 0.15, transform: 'scale(.45)', opacity: 0.4, transformOrigin: '100% 0%' },
          { offset: 0.35, transform: 'scale(1.2)', opacity: 1, transformOrigin: '100% 0%' },
          { offset: 0.5, transform: 'scale(.78)', opacity: 0.7, transformOrigin: '100% 0%' },
          { offset: 0.65, transform: 'scale(1.12)', opacity: 1, transformOrigin: '100% 0%' },
          { offset: 1, transform: 'scale(1)', opacity: 1, transformOrigin: '100% 0%' },
        ],
        940
      ),
      track(
        'porthole',
        [
          { offset: 0, fillOpacity: 0 },
          { offset: 0.4, fillOpacity: 0.22 },
          { offset: 0.8, fillOpacity: 0 },
          { offset: 1, fillOpacity: 0 },
        ],
        800,
        100
      ),
    ],
  },
  {
    name: 'ShieldCheck',
    category: 'Status',
    tags: ['verified', 'security', 'trust', '보안', '인증'],
    nodes: [
      g(
        'shield',
        ink(
          'shield-outline',
          'M12 3.5c2.5 1.7 5 2.6 7.5 3v5.7c0 3.8-2.5 6.7-7.5 8.3-5-1.6-7.5-4.5-7.5-8.3V6.5c2.5-.4 5-1.3 7.5-3Z'
        )
      ),
      ink('check', 'm8.5 11.8 2.4 2.4 4.6-4.6'),
    ],
    motion: [
      draw('shield-outline', 720),
      draw('check', 700, 200),
      motion(
        'shield',
        [
          [0, 'scale(1)'],
          [0.2, 'scale(.97)'],
          [0.65, 'scale(1.025)'],
          [1, 'scale(1)'],
        ],
        900
      ),
    ],
  },
  {
    name: 'Clock3',
    category: 'Objects',
    tags: ['time', 'history', 'clock', '시간', '시계'],
    nodes: [
      c(12, 12, 8.3),
      g('markers', p('M12 6v.3M18 12h-.3M12 18v-.3M6 12h.3')),
      g('minute', p('M12 8v4')),
      g('hour', p('M12 12h3.5')),
    ],
    motion: [
      motion(
        'minute',
        [
          [0, 'rotate(0deg)'],
          [0.18, 'rotate(-18deg)'],
          [0.65, 'rotate(30deg)'],
          [1, 'rotate(0deg)'],
        ],
        950,
        0,
        '50% 100%'
      ),
      motion(
        'hour',
        [
          [0, 'rotate(0deg)'],
          [0.2, 'rotate(-3deg)'],
          [0.65, 'rotate(8deg)'],
          [1, 'rotate(0deg)'],
        ],
        850,
        100,
        '0% 50%'
      ),
      fade('markers', 800, 80),
    ],
  },
  {
    name: 'GraduationCap',
    category: 'Objects',
    tags: ['education', 'course', 'learn', '교육', '학습'],
    nodes: [
      g(
        'cap',
        p('m3.5 8.5 8.5-4 8.5 4-8.5 4ZM6.5 10v6.2c3.8 2.3 7.2 2.3 11 0V10'),
        g('tassel', p('M20.5 8.5v8.3'), g('tassel-tip', p('M20.5 16.8l-1 2.7h1.5')))
      ),
    ],
    motion: [
      motion(
        'cap',
        [
          [0, 'rotate(0deg) translateY(0)'],
          [0.2, 'rotate(-3deg) translateY(-.4px)'],
          [0.48, 'rotate(1.5deg) translateY(0)'],
          [0.75, 'rotate(0deg) translateY(0)'],
          [1, 'rotate(0deg) translateY(0)'],
        ],
        900
      ),
      motion(
        'tassel',
        [
          [0, 'rotate(0deg)'],
          [0.2, 'rotate(9deg)'],
          [0.42, 'rotate(-7deg)'],
          [0.66, 'rotate(3deg)'],
          [1, 'rotate(0deg)'],
        ],
        850,
        100,
        '66.6667% 0%'
      ),
      motion(
        'tassel-tip',
        [
          [0, 'rotate(0deg)'],
          [0.22, 'rotate(-12deg)'],
          [0.48, 'rotate(8deg)'],
          [0.75, 'rotate(-3deg)'],
          [1, 'rotate(0deg)'],
        ],
        750,
        170,
        '66.6667% 0%'
      ),
    ],
  },
  {
    name: 'LockKeyhole',
    category: 'Objects',
    tags: ['password', 'secure', 'privacy', '자물쇠', '비밀번호'],
    nodes: [
      g('case', r(5, 10, 14, 10.5, 2.2)),
      g('shackle', p('M8 10V7.5a4 4 0 0 1 8 0V10')),
      g('keyhole', c(12, 14.3, 1.2), p('M12 15.5v2')),
    ],
    motion: [
      motion(
        'keyhole',
        [
          [0, 'rotate(0deg)'],
          [0.28, 'rotate(-35deg)'],
          [0.65, 'rotate(-35deg)'],
          [1, 'rotate(0deg)'],
        ],
        850,
        0,
        '50% 28%'
      ),
      motion(
        'shackle',
        [
          [0, 'translateY(0) scaleX(1)'],
          [0.2, 'translateY(-.8px) scaleX(1)'],
          [0.45, 'translateY(-.8px) scaleX(.7)'],
          [0.65, 'translateY(-.8px) scaleX(1)'],
          [0.83, 'translateY(.2px) scaleX(1)'],
          [1, 'translateY(0) scaleX(1)'],
        ],
        820,
        110,
        '100% 100%'
      ),
      motion(
        'case',
        [
          [0, 'translateY(0)'],
          [0.78, 'translateY(0)'],
          [0.87, 'translateY(.3px)'],
          [1, 'translateY(0)'],
        ],
        950
      ),
    ],
  },
  {
    name: 'Star',
    category: 'Objects',
    tags: ['favorite', 'rating', 'bookmark', '별', '즐겨찾기'],
    nodes: [
      g(
        'star',
        ink('north', 'M9.4 9.1 12 3.7l2.6 5.4'),
        ink('east', 'm14.6 9.1 5.9.8-4.3 4.2'),
        ink('south-east', 'm16.2 14.1 1 6-5.2-2.8'),
        ink('south-west', 'm12 17.3-5.2 2.8 1-6'),
        ink('west', 'M7.8 14.1 3.5 9.9l5.9-.8')
      ),
    ],
    motion: [
      ...['north', 'east', 'south-east', 'south-west', 'west'].map((part, i) =>
        track(
          part,
          [
            { offset: 0, strokeOpacity: 1 },
            { offset: 0.22, strokeOpacity: 0.28 },
            { offset: 0.5, strokeOpacity: 1 },
            { offset: 1, strokeOpacity: 1 },
          ],
          600,
          i * 70
        )
      ),
      motion(
        'star',
        [
          [0, 'scale(1) rotate(0deg)'],
          [0.25, 'scale(.92) rotate(-6deg)'],
          [0.6, 'scale(1.04) rotate(3deg)'],
          [1, 'scale(1) rotate(0deg)'],
        ],
        930
      ),
    ],
  },
  {
    name: 'KeyRound',
    category: 'Objects',
    tags: ['key', 'access', 'credential', '열쇠', '접근'],
    nodes: [
      g(
        'key',
        p('M13.2 12.2a5 5 0 1 0-2.1-2.1L3.5 17.7v2.8h3v-2.7h2.7v-2.6Z'),
        named('key-eye', { ...c(16.5, 7.3, 1), attrs: { ...c(16.5, 7.3, 1).attrs, pathLength: 1 } })
      ),
    ],
    motion: [
      motion(
        'key',
        [
          [0, 'rotate(0deg) scaleX(1)'],
          [0.18, 'rotate(-5deg) scaleX(.98)'],
          [0.45, 'rotate(8deg) scaleX(.82)'],
          [0.7, 'rotate(2deg) scaleX(.96)'],
          [1, 'rotate(0deg) scaleX(1)'],
        ],
        900
      ),
      draw('key-eye', 650, 230),
    ],
  },
  {
    name: 'MapPin',
    category: 'Objects',
    tags: ['location', 'place', 'address', '위치', '주소'],
    nodes: [
      g('pin', p('M19 10.5c0 5-7 10-7 10s-7-5-7-10a7 7 0 0 1 14 0Z'), g('point', c(12, 10.5, 2.5))),
    ],
    motion: [
      motion(
        'pin',
        [
          [0, 'translateY(0) scale(1)'],
          [0.2, 'translateY(-1.2px) scale(.98,1.02)'],
          [0.45, 'translateY(.4px) scale(1.05,.96)'],
          [0.68, 'translateY(-.25px) scale(.99,1.01)'],
          [1, 'translateY(0) scale(1)'],
        ],
        900,
        0,
        '50% 100%'
      ),
      track(
        'point',
        [
          { offset: 0, transform: 'scale(1)', opacity: 1 },
          { offset: 0.22, transform: 'scale(.65)', opacity: 0.6 },
          { offset: 0.47, transform: 'scale(1.25)', opacity: 1 },
          { offset: 0.73, transform: 'scale(.96)', opacity: 1 },
          { offset: 1, transform: 'scale(1)', opacity: 1 },
        ],
        700,
        170
      ),
    ],
  },
  {
    name: 'AlertCircle',
    category: 'Status',
    tags: ['notice', 'error', 'warning', '알림', '오류'],
    nodes: [
      named('ring', { ...c(12, 12, 8.3), attrs: { ...c(12, 12, 8.3).attrs, pathLength: 1 } }),
      g('stem', p('M12 7.5v5.5')),
      g('dot', p('M12 16.3v.2')),
    ],
    motion: [
      draw('ring', 760),
      motion(
        'stem',
        [
          [0, 'rotate(0deg)'],
          [0.22, 'rotate(-10deg)'],
          [0.42, 'rotate(8deg)'],
          [0.64, 'rotate(-4deg)'],
          [1, 'rotate(0deg)'],
        ],
        760,
        90,
        '50% 100%'
      ),
      track(
        'dot',
        [
          { offset: 0, opacity: 1 },
          { offset: 0.23, opacity: 0.1 },
          { offset: 0.45, opacity: 1 },
          { offset: 0.6, opacity: 0.4 },
          { offset: 1, opacity: 1 },
        ],
        700,
        190
      ),
    ],
  },
  {
    name: 'Database',
    category: 'Objects',
    tags: ['storage', 'server', 'data', '데이터베이스', '저장소'],
    nodes: [
      named('top', { tag: 'ellipse', attrs: { cx: 12, cy: 6.5, rx: 7.5, ry: 3, pathLength: 1 } }),
      p('M4.5 6.5v11c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3v-11'),
      g('scan', ink('layer', 'M4.5 11.8c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3')),
    ],
    motion: [
      draw('top', 720),
      motion(
        'scan',
        [
          [0, 'translateY(0)'],
          [0.2, 'translateY(-1.2px)'],
          [0.65, 'translateY(1.8px)'],
          [1, 'translateY(0)'],
        ],
        920
      ),
      draw('layer', 700, 170),
    ],
  },
  {
    name: 'CreditCard',
    category: 'Objects',
    tags: ['payment', 'billing', 'card', '결제', '카드'],
    nodes: [
      r(3.5, 5.5, 17, 13, 2),
      ink('stripe', 'M3.5 10h17'),
      ink('number', 'M7 14.7h3.5'),
      g('chip', p('M16 14.7h1')),
    ],
    motion: [
      draw('stripe', 800),
      draw('number', 650, 180),
      track(
        'chip',
        [
          { offset: 0, opacity: 1, transform: 'scaleX(1)' },
          { offset: 0.2, opacity: 0.3, transform: 'scaleX(.5)' },
          { offset: 0.5, opacity: 1, transform: 'scaleX(1.8)' },
          { offset: 0.72, opacity: 0.5, transform: 'scaleX(1)' },
          { offset: 1, opacity: 1, transform: 'scaleX(1)' },
        ],
        650,
        250
      ),
    ],
  },
  {
    name: 'Briefcase',
    category: 'Objects',
    tags: ['work', 'business', 'job', '업무', '직장'],
    nodes: [
      r(3.5, 7.5, 17, 13, 2),
      g('handle', p('M8.5 7.5V5a1.5 1.5 0 0 1 1.5-1.5h4A1.5 1.5 0 0 1 15.5 5v2.5')),
      g('flap', p('M3.5 12.5c5.7 2 11.3 2 17 0')),
      g('clasp', p('M10.5 13.5v3h3v-3')),
    ],
    motion: [
      motion(
        'clasp',
        [
          [0, 'translateY(0) scaleY(1)'],
          [0.22, 'translateY(-.6px) scaleY(.5)'],
          [0.6, 'translateY(-.6px) scaleY(.5)'],
          [0.85, 'translateY(.2px) scaleY(1)'],
          [1, 'translateY(0) scaleY(1)'],
        ],
        900,
        0,
        '50% 0%'
      ),
      motion(
        'flap',
        [
          [0, 'scaleY(1)'],
          [0.3, 'scaleY(.25)'],
          [0.62, 'scaleY(.25)'],
          [0.85, 'scaleY(1)'],
          [1, 'scaleY(1)'],
        ],
        800,
        110,
        '50% 0%'
      ),
      motion(
        'handle',
        [
          [0, 'translateY(0)'],
          [0.35, 'translateY(-.4px)'],
          [0.7, 'translateY(0)'],
          [1, 'translateY(0)'],
        ],
        800,
        100
      ),
    ],
  },
  {
    name: 'MessagesSquare',
    category: 'Communication',
    tags: ['conversation', 'messages', 'discussion', '메시지', '채팅'],
    nodes: [
      g(
        'message',
        p(
          'M15.5 4H5.2a1.7 1.7 0 0 0-1.7 1.7V16l3.4-2.8h8.6a1.7 1.7 0 0 0 1.7-1.7V5.7A1.7 1.7 0 0 0 15.5 4Z'
        )
      ),
      ink('reply', 'M8 16.5v.3a1.7 1.7 0 0 0 1.7 1.7h7.4l3.4 2V10.2A1.7 1.7 0 0 0 19 8.5'),
      ink('words', 'M7.5 8.6h5.7'),
    ],
    motion: [
      motion(
        'message',
        [
          [0, 'translateY(0)'],
          [0.23, 'translateY(-.55px)'],
          [0.57, 'translateY(.15px)'],
          [1, 'translateY(0)'],
        ],
        780
      ),
      draw('words', 650, 60),
      draw('reply', 700, 250),
    ],
  },
  {
    name: 'Smartphone',
    category: 'Objects',
    tags: ['mobile', 'phone', 'device', '휴대폰', '모바일'],
    nodes: [
      g(
        'phone',
        r(6.5, 3.5, 11, 17, 2),
        g('speaker', p('M10 6h4')),
        ink('home-bar', 'M11.2 17.8h1.6')
      ),
    ],
    motion: [
      motion(
        'phone',
        [
          [0, 'rotate(0deg)'],
          [0.12, 'rotate(-4deg)'],
          [0.24, 'rotate(4deg)'],
          [0.36, 'rotate(-3deg)'],
          [0.48, 'rotate(2deg)'],
          [0.65, 'rotate(0deg)'],
          [1, 'rotate(0deg)'],
        ],
        850
      ),
      draw('home-bar', 650, 230),
      track(
        'speaker',
        [
          { offset: 0, strokeOpacity: 1 },
          { offset: 0.24, strokeOpacity: 0.25 },
          { offset: 0.5, strokeOpacity: 1 },
          { offset: 0.72, strokeOpacity: 0.55 },
          { offset: 1, strokeOpacity: 1 },
        ],
        680,
        150
      ),
    ],
  },
  {
    name: 'Bell',
    category: 'Communication',
    tags: ['notification', 'ring', '알림', '종'],
    nodes: [
      p('M12 3.5v1.9'),
      g('bell', p('M5 16.7c1.3-1.5 1.7-3.4 1.7-6a5.3 5.3 0 0 1 10.6 0c0 2.6.4 4.5 1.7 6H5Z')),
      g('clapper', p('M9.7 19a2.5 2.5 0 0 0 4.6 0')),
    ],
    motion: [
      motion(
        'bell',
        [
          [0, 'rotate(0deg)'],
          [0.14, 'rotate(-13deg)'],
          [0.32, 'rotate(11deg)'],
          [0.5, 'rotate(-8deg)'],
          [0.68, 'rotate(4deg)'],
          [0.85, 'rotate(-1.5deg)'],
          [1, 'rotate(0deg)'],
        ],
        930,
        0,
        '50% 0%'
      ),
      motion(
        'clapper',
        [
          [0, 'translateX(0) rotate(0deg)'],
          [0.16, 'translateX(1.25px) rotate(-6deg)'],
          [0.34, 'translateX(-1.1px) rotate(5deg)'],
          [0.52, 'translateX(.75px) rotate(-3deg)'],
          [0.7, 'translateX(-.35px) rotate(1deg)'],
          [1, 'translateX(0) rotate(0deg)'],
        ],
        900,
        70,
        '50% 0%'
      ),
    ],
  },
  {
    name: 'Folder',
    category: 'Files',
    tags: ['directory', 'collection', '폴더', '디렉터리'],
    nodes: [
      g('back', p('M3.5 10V6a1.5 1.5 0 0 1 1.5-1.5h4l2.4 2.7H19a1.5 1.5 0 0 1 1.5 1.5V10')),
      g('front', p('M3.5 10h17v8a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 18Z')),
    ],
    motion: [
      motion(
        'front',
        [
          [0, 'scaleY(1) skewX(0deg)'],
          [0.28, 'scaleY(.56) skewX(-4deg)'],
          [0.54, 'scaleY(.56) skewX(-4deg)'],
          [0.82, 'scaleY(1.025) skewX(0deg)'],
          [1, 'scaleY(1) skewX(0deg)'],
        ],
        900,
        0,
        '50% 100%'
      ),
      motion(
        'back',
        [
          [0, 'translateY(0)'],
          [0.32, 'translateY(-.45px)'],
          [0.6, 'translateY(-.45px)'],
          [1, 'translateY(0)'],
        ],
        800,
        70
      ),
    ],
  },
  {
    name: 'House',
    category: 'Navigation',
    tags: ['home', 'dashboard', '집', '홈'],
    nodes: [
      ink('roof', 'm3.5 10.5 7.4-6.3a1.7 1.7 0 0 1 2.2 0l7.4 6.3'),
      p('M5.5 8.8v10.1a1.6 1.6 0 0 0 1.6 1.6h9.8a1.6 1.6 0 0 0 1.6-1.6V8.8'),
      g('door', p('M9.5 20.5v-6.3h5v6.3')),
    ],
    motion: [
      draw('roof', 700),
      motion(
        'door',
        [
          [0, 'scaleX(1) skewY(0deg)'],
          [0.3, 'scaleX(.35) skewY(-7deg)'],
          [0.57, 'scaleX(.35) skewY(-7deg)'],
          [0.85, 'scaleX(1.03) skewY(0deg)'],
          [1, 'scaleX(1) skewY(0deg)'],
        ],
        850,
        120,
        '0% 50%'
      ),
    ],
  },
]
