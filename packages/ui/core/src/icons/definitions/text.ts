import type { IconDefinition } from '../types'
import { g, ink, p, pop, push, spring, turn, write } from './kit'

const bar = (part: string, d: string) => g(part, p(d))
/** Three list lines that stretch one after another, as in Menu. */
const lines = (parts: readonly [string, string, string]) =>
  parts.map((part, index) =>
    push(
      part,
      { scaleX: [0.55, 0.75, 0.4][index] },
      { at: index * 50, hold: 90, origin: '0% 50%', spring: spring.bouncy }
    )
  )
const heading = (level: 1 | 2 | 3, numeral: string, tags: string[]): IconDefinition => ({
  name: `Heading${level}`,
  category: 'Text',
  tags,
  nodes: [g('h', p('M4.5 5.5v13'), p('M4.5 12h8'), p('M12.5 5.5v13')), ink('numeral', numeral)],
  // The level is written on; the H takes a small breath.
  motion: [
    write('numeral', { spring: { duration: 420, bounce: 0 } }),
    pop('h', { scaleY: 1.06 }, { at: 40, dip: 0.3 }),
  ],
})

export const textIcons: readonly IconDefinition[] = [
  {
    name: 'Bold',
    category: 'Text',
    tags: ['strong', 'weight', 'format', '굵게', '볼드'],
    nodes: [
      g('letter', p('M7.5 4.5h5.3a3.5 3.5 0 0 1 0 7H7.5Z'), p('M7.5 11.5h6.3a4 4 0 0 1 0 8H7.5Z')),
    ],
    motion: [
      push('letter', { scaleX: 1.12 }, { hold: 110, origin: '0% 50%', spring: spring.bouncy }),
    ],
  },
  {
    name: 'Italic',
    category: 'Text',
    tags: ['emphasis', 'slant', 'format', '기울임', '이탤릭'],
    nodes: [g('letter', p('M13.5 4.5h6'), p('M4.5 19.5h6'), p('m15.2 4.5-6.4 15'))],
    motion: [
      push('letter', { skewX: -10 }, { hold: 110, origin: '50% 100%', spring: spring.bouncy }),
    ],
  },
  {
    name: 'Strikethrough',
    category: 'Text',
    tags: ['cross out', 'delete text', 'format', '취소선', '삭제'],
    nodes: [
      p('M16.5 7a3.5 3.5 0 0 0-3.5-2.5h-2.7a3.3 3.3 0 0 0-1.3 6.3'),
      p('M9.7 13.2h3.8a3.4 3.4 0 0 1 0 6.8H7.5'),
      ink('line', 'M4.5 12h15'),
    ],
    motion: [write('line', { spring: { duration: 360, bounce: 0 } })],
  },
  heading(1, 'm16.2 10.6 2.6-2.1v10', ['title', 'h1', 'heading', '제목', '큰 제목']),
  heading(2, 'M15.8 11.4a2.6 2.6 0 0 1 5.1.4c0 1.3-.9 2.2-2 3.4l-3.1 3.3h5.2', [
    'subtitle',
    'h2',
    'heading',
    '부제목',
    '중간 제목',
  ]),
  heading(
    3,
    'M16 10.9c.5-1.9 4.8-1.8 4.8.7 0 1.3-1.2 2.1-2.4 2.1 1.3 0 2.7 1 2.7 2.5 0 2.7-4.6 2.9-5.2.8',
    ['section', 'h3', 'heading', '소제목', '작은 제목']
  ),
  {
    name: 'List',
    category: 'Text',
    tags: ['bullets', 'unordered', 'items', '목록', '글머리 기호'],
    nodes: [
      p('M4.5 6.5h.1M4.5 12h.1M4.5 17.5h.1'),
      bar('first', 'M9 6.5h10.5'),
      bar('second', 'M9 12h10.5'),
      bar('third', 'M9 17.5h10.5'),
    ],
    motion: lines(['first', 'second', 'third']),
  },
  {
    name: 'ListOrdered',
    category: 'Text',
    tags: ['numbered', 'steps', 'sequence', '번호 목록', '순서'],
    nodes: [
      p('m3.8 6.3 1.4-1.1v3.8'),
      p('M3.7 11.2a1.3 1.3 0 0 1 2.5.4c0 1.2-2.4 1.9-2.4 3.1h2.6'),
      p('M3.7 16.6a1.3 1.3 0 1 1 1.5 1.9 1.4 1.4 0 1 1-1.6 2.1'),
      bar('first', 'M9.5 7h10'),
      bar('second', 'M9.5 12.7h10'),
      bar('third', 'M9.5 18.4h10'),
    ],
    motion: lines(['first', 'second', 'third']),
  },
  {
    name: 'Quote',
    category: 'Text',
    tags: ['blockquote', 'citation', 'excerpt', '인용', '따옴표'],
    nodes: [
      g(
        'left',
        p('M10 11.5V7.3a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v2.2a2 2 0 0 0 2 2h4Zm0 0v2.2a4 4 0 0 1-4 4')
      ),
      g(
        'right',
        p('M20 11.5V7.3a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v2.2a2 2 0 0 0 2 2h4Zm0 0v2.2a4 4 0 0 1-4 4')
      ),
    ],
    // The marks hop in turn.
    motion: [
      push('left', { y: -2.2 }, { hold: 80, spring: spring.bouncy }),
      push('right', { y: -2.2 }, { at: 70, hold: 80, spring: spring.bouncy }),
    ],
  },
]
