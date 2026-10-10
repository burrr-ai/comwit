import type { IconDefinition } from '../types'
import { fly, g, nudge, p, push, spring } from './kit'

const arrow = (
  name: string,
  tags: string[],
  shaft: string,
  head: string,
  x: number,
  y: number
): IconDefinition => ({
  name,
  category: 'Navigation',
  tags,
  nodes: [g('arrow', p(shaft), p(head))],
  motion: [nudge('arrow', { x, y })],
})
const chevron = (name: string, tags: string[], d: string, x: number, y: number) => ({
  name,
  category: 'Navigation' as const,
  tags,
  nodes: [g('chevron', p(d))],
  motion: [nudge('chevron', { x, y }, { windup: 0.3, spring: spring.bouncy })],
})

export const navigationIcons: readonly IconDefinition[] = [
  arrow(
    'ArrowRight',
    ['next', 'forward', 'continue', '다음', '오른쪽'],
    'M4 12h15',
    'M13 5.5l6 5.8a1 1 0 0 1 0 1.4l-6 5.8',
    3,
    0
  ),
  arrow(
    'ArrowLeft',
    ['back', 'previous', 'return', '뒤로', '왼쪽'],
    'M20 12H5',
    'M11 5.5l-6 5.8a1 1 0 0 0 0 1.4l6 5.8',
    -3,
    0
  ),
  arrow(
    'ArrowUp',
    ['up', 'top', 'raise', '위', '올리기'],
    'M12 20V5',
    'M5.5 11l5.8-6a1 1 0 0 1 1.4 0l5.8 6',
    0,
    -3
  ),
  arrow(
    'ArrowDown',
    ['down', 'bottom', 'lower', '아래', '내리기'],
    'M12 4v15',
    'M5.5 13l5.8 6a1 1 0 0 0 1.4 0l5.8-6',
    0,
    3
  ),
  arrow(
    'ArrowUpRight',
    ['external', 'trend', 'diagonal', '외부', '대각선'],
    'M6 18 18 6',
    'M7.5 6H17a1 1 0 0 1 1 1v9.5',
    2.4,
    -2.4
  ),
  chevron(
    'ChevronRight',
    ['next', 'expand', 'disclosure', '다음', '펼치기'],
    'm9 5.5 6 5.8a1 1 0 0 1 0 1.4l-6 5.8',
    2.4,
    0
  ),
  chevron(
    'ChevronLeft',
    ['previous', 'back', 'collapse', '이전', '뒤로'],
    'm15 5.5-6 5.8a1 1 0 0 0 0 1.4l6 5.8',
    -2.4,
    0
  ),
  chevron(
    'ChevronDown',
    ['open', 'dropdown', 'expand', '열기', '드롭다운'],
    'm5.5 9 5.8 6a1 1 0 0 0 1.4 0l5.8-6',
    0,
    2.4
  ),
  chevron(
    'ChevronUp',
    ['close', 'collapse', 'scroll top', '닫기', '접기'],
    'm5.5 15 5.8-6a1 1 0 0 1 1.4 0l5.8 6',
    0,
    -2.4
  ),
  {
    name: 'ChevronsUpDown',
    category: 'Navigation',
    tags: ['select', 'sort', 'combobox', '선택', '정렬'],
    nodes: [
      g('upper', p('m7 9 4.3-4.3a1 1 0 0 1 1.4 0L17 9')),
      g('lower', p('m7 15 4.3 4.3a1 1 0 0 0 1.4 0L17 15')),
    ],
    motion: [
      push('upper', { y: -2 }, { hold: 90, spring: spring.bouncy }),
      push('lower', { y: 2 }, { hold: 90, spring: spring.bouncy }),
    ],
  },
  {
    name: 'House',
    category: 'Navigation',
    tags: ['home', 'main', 'dashboard', '홈', '메인'],
    nodes: [
      g('roof', p('m3.5 10.5 7.4-6.3a1.7 1.7 0 0 1 2.2 0l7.4 6.3')),
      p('M5.5 8.8v10.1a1.6 1.6 0 0 0 1.6 1.6h9.8a1.6 1.6 0 0 0 1.6-1.6V8.8'),
      g('door', p('M9.5 20.5v-6.3h5v6.3')),
    ],
    motion: [
      push('roof', { y: -1.7 }, { hold: 90, spring: spring.bouncy }),
      push('door', { scaleX: 0.25 }, { at: 70, hold: 180, origin: '0% 50%' }),
    ],
  },
  {
    name: 'Menu',
    category: 'Navigation',
    tags: ['hamburger', 'navigation', 'list', '메뉴', '목록'],
    nodes: [g('top', p('M4.5 6h15')), g('middle', p('M4.5 12h15')), g('bottom', p('M4.5 18h15'))],
    motion: ['top', 'middle', 'bottom'].map((part, index) =>
      push(
        part,
        { scaleX: [0.45, 0.7, 0.3][index] },
        { at: index * 50, hold: 90, origin: '0% 50%', spring: spring.bouncy }
      )
    ),
  },
  {
    name: 'LogOut',
    category: 'Navigation',
    tags: ['sign out', 'exit', 'leave', '로그아웃', '나가기'],
    nodes: [
      p('M10 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4'),
      g('arrow', p('M9 12h11'), p('M16 7.5l3.8 3.8a1 1 0 0 1 0 1.4L16 16.5')),
    ],
    motion: [nudge('arrow', { x: 2.6 })],
  },
  {
    name: 'LogIn',
    category: 'Navigation',
    tags: ['sign in', 'enter', 'account', '로그인', '들어가기'],
    nodes: [
      p('M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4'),
      g('arrow', p('M3.5 12h11'), p('M10.5 7.5l3.8 3.8a1 1 0 0 1 0 1.4l-3.8 3.8')),
    ],
    motion: [nudge('arrow', { x: 2.4 })],
  },
  {
    name: 'ExternalLink',
    category: 'Navigation',
    tags: ['open', 'new tab', 'outside', '새 창', '외부 링크'],
    nodes: [
      p('M10 4.5H6.5a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V14'),
      g('arrow', p('M11 13 19.5 4.5'), p('M13.5 4.5h6v6')),
    ],
    motion: [fly('arrow', { x: 6, y: -6 })],
  },
  {
    name: 'Maximize2',
    category: 'Navigation',
    tags: ['fullscreen', 'expand', 'enlarge', '전체 화면', '확대'],
    nodes: [
      g('outward', p('M14.5 3.5h6v6'), p('M20.5 3.5 14 10')),
      g('inward', p('M9.5 20.5h-6v-6'), p('M3.5 20.5 10 14')),
    ],
    motion: [
      push('outward', { x: 1.3, y: -1.3 }, { hold: 100, spring: spring.bouncy }),
      push('inward', { x: -1.3, y: 1.3 }, { hold: 100, spring: spring.bouncy }),
    ],
  },
]
