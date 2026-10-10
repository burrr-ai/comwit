import type { IconDefinition, IconMotion, IconNode } from '../types'

// Original 24-unit geometry. Small gaps and softened corners keep dense toolbars clear.
const path = (d: string): IconNode => ({ tag: 'path', attrs: { d } })
const circle = (cx: number, cy: number, r: number): IconNode => ({
  tag: 'circle',
  attrs: { cx, cy, r },
})
const rect = (x: number, y: number, width: number, height: number, rx: number): IconNode => ({
  tag: 'rect',
  attrs: { x, y, width, height, rx },
})
const group = (part: string, ...children: IconNode[]): IconNode => ({ tag: 'g', part, children })
const move = (part: string, transforms: string[], duration = 520): IconMotion => ({
  part,
  keyframes: transforms.map((transform) => ({ transform })),
  duration,
  easing: 'cubic-bezier(.22,.68,.2,1)',
})
const nudge = (part: string, x: number, y: number, duration = 480) =>
  move(part, ['translate(0, 0)', `translate(${x}px, ${y}px)`, 'translate(0, 0)'], duration)
const turn = (part: string, degrees: number, duration = 620) =>
  move(part, ['rotate(0deg)', `rotate(${degrees}deg)`], duration)
const track = (part: string, scale: number, transformOrigin: string): IconMotion => ({
  ...move(part, ['scaleX(1)', `scaleX(${scale})`, 'scaleX(1)'], 560),
  keyframes: [1, scale, 1].map((value) => ({ transform: `scaleX(${value})`, transformOrigin })),
})

export const actionIcons: readonly IconDefinition[] = [
  {
    name: 'Loader2',
    category: 'Status',
    tags: ['loading', 'spinner', 'progress', '로딩', '진행'],
    nodes: [
      group(
        'orbit',
        path('M12 3.5a8.5 8.5 0 0 1 8.5 8.5'),
        path('M19.4 16.2A8.5 8.5 0 0 1 8 19.5'),
        path('M4.5 16A8.5 8.5 0 0 1 6 6')
      ),
    ],
    motion: [turn('orbit', 360, 700)],
  },
  {
    name: 'Plus',
    category: 'Actions',
    tags: ['add', 'create', 'new', '추가', '생성'],
    nodes: [group('cross', path('M12 5v14M5 12h14'))],
    motion: [move('cross', ['scale(1)', 'scale(.8)', 'scale(1.12)', 'scale(1)'], 460)],
  },
  {
    name: 'Check',
    category: 'Status',
    tags: ['done', 'success', 'confirm', '완료', '확인'],
    nodes: [group('tick', path('m4.5 12.5 4.6 4.6a1 1 0 0 0 1.4 0l9-10'))],
    motion: [
      move(
        'tick',
        ['scale(1)', 'scale(.84) rotate(-7deg)', 'scale(1.08) rotate(2deg)', 'scale(1)'],
        520
      ),
    ],
  },
  {
    name: 'Trash2',
    category: 'Actions',
    tags: ['delete', 'remove', 'bin', '삭제', '휴지통'],
    nodes: [
      path('m6.5 9 .6 9.3a2 2 0 0 0 2 1.7h5.8a2 2 0 0 0 2-1.7l.6-9M10 10.5v5.8M14 10.5v5.8'),
      group('lid', path('M4.5 6.5h15M9 6.5V5a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 5v1.5')),
    ],
    motion: [
      move(
        'lid',
        [
          'translateY(0) rotate(0deg)',
          'translateY(-1.2px) rotate(-9deg)',
          'translateY(0) rotate(0deg)',
        ],
        580
      ),
    ],
  },
  {
    name: 'X',
    category: 'Actions',
    tags: ['close', 'dismiss', 'cancel', '닫기', '취소'],
    nodes: [group('cross', path('m6 6 12 12M18 6 6 18'))],
    motion: [move('cross', ['rotate(0deg)', 'rotate(12deg) scale(.86)', 'rotate(0deg)'], 430)],
  },
  {
    name: 'ArrowUpRight',
    category: 'Navigation',
    tags: ['diagonal', 'open', 'north east', '이동', '우상단'],
    nodes: [group('arrow', path('M6 18 18 6M7.5 6H17a1 1 0 0 1 1 1v9.5'))],
    motion: [nudge('arrow', 1.4, -1.4)],
  },
  {
    name: 'ArrowRight',
    category: 'Navigation',
    tags: ['next', 'forward', 'right', '다음', '오른쪽'],
    nodes: [group('arrow', path('M4 12h15M13 5.5l6 5.8a1 1 0 0 1 0 1.4l-6 5.8'))],
    motion: [nudge('arrow', 1.6, 0)],
  },
  {
    name: 'ChevronRight',
    category: 'Navigation',
    tags: ['next', 'expand', 'right', '다음', '펼치기'],
    nodes: [group('chevron', path('m9 5.5 6 5.8a1 1 0 0 1 0 1.4l-6 5.8'))],
    motion: [nudge('chevron', 2, 0, 430)],
  },
  {
    name: 'Copy',
    category: 'Actions',
    tags: ['duplicate', 'clipboard', 'copy', '복사', '복제'],
    nodes: [
      path('M7 15.5H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h7.5a2 2 0 0 1 2 2v1'),
      group('sheet', rect(8.5, 8.5, 11.5, 11.5, 2.5)),
    ],
    motion: [
      move(
        'sheet',
        [
          'translate(0, 0)',
          'translate(-1.8px, -1.8px)',
          'translate(.4px, .4px)',
          'translate(0, 0)',
        ],
        560
      ),
    ],
  },
  {
    name: 'ArrowLeft',
    category: 'Navigation',
    tags: ['back', 'previous', 'left', '이전', '왼쪽'],
    nodes: [group('arrow', path('M20 12H5M11 5.5l-6 5.8a1 1 0 0 0 0 1.4l6 5.8'))],
    motion: [nudge('arrow', -1.6, 0)],
  },
  {
    name: 'ExternalLink',
    category: 'Navigation',
    tags: ['open', 'new tab', 'external', '외부링크', '새창'],
    nodes: [
      path('M10 4.5H6.5a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V14'),
      group('arrow', path('M11 13 19.5 4.5M13.5 4.5h6v6')),
    ],
    motion: [nudge('arrow', 0.8, -0.8, 520)],
  },
  {
    name: 'Pencil',
    category: 'Actions',
    tags: ['edit', 'write', 'compose', '편집', '수정'],
    nodes: [
      path('M4 20h6'),
      group(
        'pencil',
        path(
          'm5 18 .8-6L15.5 3.8a1.8 1.8 0 0 1 2.5.1l2.1 2.3a1.8 1.8 0 0 1-.2 2.5l-9.7 8.2L5 18ZM13.6 5.5l4.4 4.8M5.8 12l4.4 4.9'
        )
      ),
    ],
    motion: [
      move(
        'pencil',
        [
          'translate(0, 0) rotate(0deg)',
          'translate(-.5px, 1px) rotate(-5deg)',
          'translate(1px, 0) rotate(3deg)',
          'translate(0, 0) rotate(0deg)',
        ],
        640
      ),
    ],
  },
  {
    name: 'ChevronLeft',
    category: 'Navigation',
    tags: ['previous', 'back', 'left', '이전', '뒤로'],
    nodes: [group('chevron', path('m15 5.5-6 5.8a1 1 0 0 0 0 1.4l6 5.8'))],
    motion: [nudge('chevron', -2, 0, 430)],
  },
  {
    name: 'ChevronDown',
    category: 'Navigation',
    tags: ['expand', 'dropdown', 'down', '펼치기', '아래'],
    nodes: [group('chevron', path('m5.5 9 5.8 6a1 1 0 0 0 1.4 0l5.8-6'))],
    motion: [nudge('chevron', 0, 2, 430)],
  },
  {
    name: 'Search',
    category: 'Actions',
    tags: ['find', 'magnify', 'query', '검색', '찾기'],
    nodes: [group('glass', circle(10.5, 10.5, 6.5), path('m15.2 15.2 4.8 4.8'))],
    motion: [
      move(
        'glass',
        [
          'translate(0, 0)',
          'translate(-.7px, -.7px) rotate(-6deg)',
          'translate(.5px, 0) rotate(3deg)',
          'translate(0, 0)',
        ],
        580
      ),
    ],
  },
  {
    name: 'RotateCcw',
    category: 'Actions',
    tags: ['undo', 'reset', 'rotate', '되돌리기', '초기화'],
    nodes: [group('rewind', path('M5 9a7.5 7.5 0 1 1-.2 6.1M4 4.5V9h4.5'))],
    motion: [move('rewind', ['rotate(0deg)', 'rotate(-32deg)', 'rotate(0deg)'], 600)],
  },
  {
    name: 'RefreshCcw',
    category: 'Actions',
    tags: ['refresh', 'reload', 'sync', '새로고침', '동기화'],
    nodes: [
      group(
        'cycle',
        path('M5 9a7.4 7.4 0 0 1 12-3M4 4.5V9h4.5M19 15a7.4 7.4 0 0 1-12 3M20 19.5V15h-4.5')
      ),
    ],
    motion: [turn('cycle', -360, 700)],
  },
  {
    name: 'RefreshCw',
    category: 'Actions',
    tags: ['refresh', 'reload', 'retry', '새로고침', '재시도'],
    nodes: [
      group(
        'cycle',
        path('M19 9A7.4 7.4 0 0 0 7 6M20 4.5V9h-4.5M5 15a7.4 7.4 0 0 0 12 3M4 19.5V15h4.5')
      ),
    ],
    motion: [turn('cycle', 360, 700)],
  },
  {
    name: 'ArrowDown',
    category: 'Navigation',
    tags: ['down', 'below', 'south', '아래', '내리기'],
    nodes: [group('arrow', path('M12 4v15M5.5 13l5.8 6a1 1 0 0 0 1.4 0l5.8-6'))],
    motion: [nudge('arrow', 0, 1.6)],
  },
  {
    name: 'Upload',
    category: 'Files',
    tags: ['upload', 'import', 'transfer', '업로드', '올리기'],
    nodes: [
      path('M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3'),
      group('arrow', path('M12 15V4M7.5 8.5l3.8-3.8a1 1 0 0 1 1.4 0l3.8 3.8')),
    ],
    motion: [nudge('arrow', 0, -1.2, 550)],
  },
  {
    name: 'Send',
    category: 'Communication',
    tags: ['send', 'submit', 'paper plane', '전송', '보내기'],
    nodes: [
      group(
        'plane',
        path(
          'M4.5 10.2 19 4.1a.7.7 0 0 1 .9.9l-6.1 14.5a.7.7 0 0 1-1.3 0l-2.3-5.7-5.7-2.3a.7.7 0 0 1 0-1.3ZM10.2 13.8l5.4-5.4'
        )
      ),
    ],
    motion: [
      move(
        'plane',
        ['translate(0, 0)', 'translate(-.8px, .8px)', 'translate(1px, -1px)', 'translate(0, 0)'],
        600
      ),
    ],
  },
  {
    name: 'ArrowUp',
    category: 'Navigation',
    tags: ['up', 'above', 'north', '위', '올리기'],
    nodes: [group('arrow', path('M12 20V5M5.5 11l5.8-6a1 1 0 0 1 1.4 0l5.8 6'))],
    motion: [nudge('arrow', 0, -1.6)],
  },
  {
    name: 'MoreHorizontal',
    category: 'Actions',
    tags: ['more', 'options', 'ellipsis', '더보기', '옵션'],
    nodes: [
      group('first', circle(5, 12, 1)),
      group('second', circle(12, 12, 1)),
      group('third', circle(19, 12, 1)),
    ],
    motion: [
      nudge('first', 0, -1.8, 420),
      { ...nudge('second', 0, -1.8, 420), delay: 70 },
      { ...nudge('third', 0, -1.8, 420), delay: 140 },
    ],
  },
  {
    name: 'ChevronsUpDown',
    category: 'Navigation',
    tags: ['sort', 'select', 'switch', '정렬', '선택'],
    nodes: [
      group('upper', path('m7 9 4.3-4.3a1 1 0 0 1 1.4 0L17 9')),
      group('lower', path('m7 15 4.3 4.3a1 1 0 0 0 1.4 0L17 15')),
    ],
    motion: [nudge('upper', 0, -0.9), nudge('lower', 0, 0.9)],
  },
  {
    name: 'LogOut',
    category: 'Navigation',
    tags: ['exit', 'sign out', 'leave', '로그아웃', '나가기'],
    nodes: [
      path('M10 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4'),
      group('exit', path('M9 12h11M16 7.5l3.8 3.8a1 1 0 0 1 0 1.4L16 16.5')),
    ],
    motion: [nudge('exit', 1, 0, 520)],
  },
  {
    name: 'Download',
    category: 'Files',
    tags: ['download', 'save', 'export', '다운로드', '내려받기'],
    nodes: [
      path('M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3'),
      group('arrow', path('M12 4v11M7.5 10.5l3.8 3.8a1 1 0 0 0 1.4 0l3.8-3.8')),
    ],
    motion: [nudge('arrow', 0, 1.5, 550)],
  },
  {
    name: 'Share2',
    category: 'Communication',
    tags: ['share', 'network', 'distribute', '공유', '연결'],
    nodes: [
      path('m8.2 10.6 7.6-4.2M8.2 13.4l7.6 4.2'),
      circle(6, 12, 2.5),
      group('upper', circle(18, 5, 2)),
      group('lower', circle(18, 19, 2)),
    ],
    motion: [
      move('upper', ['scale(1)', 'scale(1.18)', 'scale(1)'], 460),
      { ...move('lower', ['scale(1)', 'scale(1.18)', 'scale(1)'], 460), delay: 90 },
    ],
  },
  {
    name: 'Menu',
    category: 'Navigation',
    tags: ['menu', 'navigation', 'hamburger', '메뉴', '탐색'],
    nodes: [
      group('top', path('M4.5 6h15')),
      path('M4.5 12h15'),
      group('bottom', path('M4.5 18h15')),
    ],
    motion: [nudge('top', 1, 0), nudge('bottom', -1, 0)],
  },
  {
    name: 'Settings',
    category: 'Actions',
    tags: ['settings', 'preferences', 'gear', '설정', '환경설정'],
    nodes: [
      group(
        'gear',
        path(
          'm10 3.5 4 0 .6 2.2 1.6.9 2.2-.6 2 3.5-1.6 1.6v1.8l1.6 1.6-2 3.5-2.2-.6-1.6.9-.6 2.2h-4l-.6-2.2-1.6-.9-2.2.6-2-3.5 1.6-1.6v-1.8L3.6 9.5l2-3.5 2.2.6 1.6-.9.6-2.2Z'
        ),
        circle(12, 12, 3)
      ),
    ],
    motion: [move('gear', ['rotate(0deg)', 'rotate(60deg)', 'rotate(0deg)'], 660)],
  },
  {
    name: 'SlidersHorizontal',
    category: 'Actions',
    tags: ['adjust', 'filter', 'controls', '필터', '조절'],
    nodes: [
      group('upperLeftTrack', path('M4 7h3')),
      group('upperRightTrack', path('M11 7h9')),
      group('lowerLeftTrack', path('M4 17h9')),
      group('lowerRightTrack', path('M17 17h3')),
      group('upper', circle(9, 7, 2)),
      group('lower', circle(15, 17, 2)),
    ],
    motion: [
      nudge('upper', 1.5, 0, 560),
      nudge('lower', -1.5, 0, 560),
      track('upperLeftTrack', 1.5, 'left center'),
      track('upperRightTrack', 5 / 6, 'right center'),
      track('lowerLeftTrack', 5 / 6, 'left center'),
      track('lowerRightTrack', 1.5, 'right center'),
    ],
  },
]
