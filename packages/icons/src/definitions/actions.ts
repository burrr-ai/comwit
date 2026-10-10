import type { IconDefinition, IconMotion, IconNode } from '../types'

// Original 24-unit drawings. Motion follows each object's mechanics, then returns to rest.
const path = (d: string): IconNode => ({ tag: 'path', attrs: { d } })
const ink = (part: string, d: string): IconNode => ({
  tag: 'path',
  part,
  attrs: { d, pathLength: 1 },
})
const circle = (cx: number, cy: number, r: number): IconNode => ({
  tag: 'circle',
  attrs: { cx, cy, r },
})
const rect = (x: number, y: number, width: number, height: number, rx: number): IconNode => ({
  tag: 'rect',
  attrs: { x, y, width, height, rx },
})
const group = (part: string, ...children: IconNode[]): IconNode => ({ tag: 'g', part, children })
const ease = 'cubic-bezier(.22,.68,.2,1)'
const motion = (part: string, keyframes: Keyframe[], duration = 860, delay = 0): IconMotion => ({
  part,
  keyframes: keyframes.map((frame) => ({ easing: ease, ...frame })),
  duration,
  delay,
  easing: 'linear',
})
const transform = (
  part: string,
  frames: [number, string, string?][],
  duration = 860,
  transformOrigin?: string
): IconMotion =>
  motion(
    part,
    frames.map(([offset, transform, easing]) => ({
      offset,
      transform,
      ...(easing ? { easing } : {}),
      ...(transformOrigin ? { transformOrigin } : {}),
    })),
    duration
  )
const stroke = (part: string, frames: [number, number][], duration = 860): IconMotion =>
  motion(
    part,
    frames.map(([offset, strokeDashoffset]) => ({
      offset,
      strokeDasharray: '1 1',
      strokeDashoffset,
    })),
    duration
  )
const slider = (
  knob: string,
  left: string,
  right: string,
  leftLength: number,
  rightLength: number,
  frames: [number, number][]
): IconMotion[] => [
  transform(
    knob,
    frames.map(([time, distance]) => [time, 'translateX(' + distance + 'px)']),
    1000
  ),
  transform(
    left,
    frames.map(([time, distance]) => [time, 'scaleX(' + (1 + distance / leftLength) + ')']),
    1000,
    'left center'
  ),
  transform(
    right,
    frames.map(([time, distance]) => [time, 'scaleX(' + (1 - distance / rightLength) + ')']),
    1000,
    'right center'
  ),
]

export const actionIcons: readonly IconDefinition[] = [
  {
    name: 'Loader2',
    category: 'Status',
    tags: ['loading', 'spinner', 'progress', '로딩', '진행'],
    nodes: [
      group(
        'orbit',
        ink('leading', 'M12 3.5a8.5 8.5 0 0 1 8.5 8.5'),
        ink('following', 'M19.4 16.2A8.5 8.5 0 0 1 8 19.5'),
        ink('trailing', 'M4.5 16A8.5 8.5 0 0 1 6 6')
      ),
    ],
    motion: [
      transform(
        'orbit',
        [
          [0, 'rotate(0deg)'],
          [0.14, 'rotate(-14deg)', 'cubic-bezier(.5,0,.35,1)'],
          [0.8, 'rotate(348deg)'],
          [1, 'rotate(360deg)'],
        ],
        1000
      ),
      stroke(
        'leading',
        [
          [0, 0],
          [0.16, 0.65],
          [0.48, 0],
          [1, 0],
        ],
        1000
      ),
      stroke(
        'following',
        [
          [0, 0],
          [0.3, 0.72],
          [0.7, 0],
          [1, 0],
        ],
        1000
      ),
      stroke(
        'trailing',
        [
          [0, 0],
          [0.44, 0.7],
          [0.88, 0],
          [1, 0],
        ],
        1000
      ),
    ],
  },
  {
    name: 'Plus',
    category: 'Actions',
    tags: ['add', 'create', 'new', '추가', '생성'],
    nodes: [group('horizontal', path('M5 12h14')), group('vertical', path('M12 5v14'))],
    motion: [
      transform(
        'horizontal',
        [
          [0, 'scaleX(1)'],
          [0.17, 'scaleX(.55)'],
          [0.46, 'scaleX(1)'],
          [1, 'scaleX(1)'],
        ],
        760
      ),
      transform(
        'vertical',
        [
          [0, 'rotate(0deg) scaleY(1)'],
          [0.17, 'rotate(90deg) scaleY(.55)'],
          [0.3, 'rotate(90deg) scaleY(.55)'],
          [0.74, 'rotate(-5deg) scaleY(1)'],
          [1, 'rotate(0deg) scaleY(1)'],
        ],
        760
      ),
    ],
  },
  {
    name: 'Check',
    category: 'Status',
    tags: ['done', 'success', 'confirm', '완료', '확인'],
    nodes: [group('settle', ink('tick', 'm4.5 12.5 4.6 4.6a1 1 0 0 0 1.4 0l9-10'))],
    motion: [
      stroke(
        'tick',
        [
          [0, 0],
          [0.13, 1],
          [0.22, 1],
          [0.48, 0.66],
          [0.8, 0],
          [1, 0],
        ],
        850
      ),
      transform(
        'settle',
        [
          [0, 'translateY(0px)'],
          [0.2, 'translateY(.7px)'],
          [0.78, 'translateY(-.35px)'],
          [1, 'translateY(0px)'],
        ],
        850
      ),
    ],
  },
  {
    name: 'Trash2',
    category: 'Actions',
    tags: ['delete', 'remove', 'bin', '삭제', '휴지통'],
    nodes: [
      group(
        'body',
        path('m6.5 9 .6 9.3a2 2 0 0 0 2 1.7h5.8a2 2 0 0 0 2-1.7l.6-9'),
        group('ribs', path('M10 10.5v5.8M14 10.5v5.8'))
      ),
      group('lid', path('M4.5 6.5h15M9 6.5V5a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 5v1.5')),
    ],
    motion: [
      transform(
        'lid',
        [
          [0, 'translate(0px, 0px) rotate(0deg) scale(1)'],
          [0.16, 'translateY(.3px) rotate(0deg)'],
          [0.42, 'translateY(-1.1px) rotate(-9deg)'],
          [0.6, 'translateY(-1.1px) rotate(-9deg)'],
          [0.8, 'translateY(.35px) rotate(2deg)'],
          [1, 'translate(0px, 0px) rotate(0deg) scale(1)'],
        ],
        960
      ),
      transform(
        'body',
        [
          [0, 'scaleY(1)'],
          [0.18, 'scaleY(.96)'],
          [0.42, 'scaleY(1)'],
          [0.8, 'scaleY(.94)'],
          [1, 'scaleY(1)'],
        ],
        960,
        'center bottom'
      ),
      transform(
        'ribs',
        [
          [0, 'translateY(0px)'],
          [0.48, 'translateY(0px)'],
          [0.68, 'translateY(1.2px)'],
          [1, 'translateY(0px)'],
        ],
        960
      ),
    ],
  },
  {
    name: 'X',
    category: 'Actions',
    tags: ['close', 'dismiss', 'cancel', '닫기', '취소'],
    nodes: [group('descending', path('m6 6 12 12')), group('ascending', path('M18 6 6 18'))],
    motion: [
      transform(
        'descending',
        [
          [0, 'rotate(0deg) scale(1)'],
          [0.2, 'rotate(-45deg) scale(.72)'],
          [0.4, 'rotate(-45deg) scale(.72)'],
          [0.8, 'rotate(3deg) scale(1)'],
          [1, 'rotate(0deg) scale(1)'],
        ],
        760
      ),
      transform(
        'ascending',
        [
          [0, 'rotate(0deg) scale(1)'],
          [0.2, 'rotate(45deg) scale(.72)'],
          [0.47, 'rotate(45deg) scale(.72)'],
          [0.86, 'rotate(-3deg) scale(1)'],
          [1, 'rotate(0deg) scale(1)'],
        ],
        760
      ),
    ],
  },
  {
    name: 'ArrowUpRight',
    category: 'Navigation',
    tags: ['diagonal', 'open', 'north east', '이동', '우상단'],
    nodes: [group('shaft', path('M6 18 18 6')), group('head', path('M7.5 6H17a1 1 0 0 1 1 1v9.5'))],
    motion: [
      transform(
        'shaft',
        [
          [0, 'scale(1)'],
          [0.18, 'scale(0.9458333333333333)'],
          [0.52, 'scale(1.1125)'],
          [0.76, 'scale(1.0583333333333333)'],
          [1, 'scale(1)'],
        ],
        820,
        'left bottom'
      ),
      transform(
        'head',
        [
          [0, 'translate(0px, 0px)'],
          [0.18, 'translate(-0.65px, 0.65px)'],
          [0.52, 'translate(1.35px, -1.35px)'],
          [0.76, 'translate(0.7px, -0.7px)'],
          [1, 'translate(0px, 0px)'],
        ],
        820
      ),
    ],
  },
  {
    name: 'ArrowRight',
    category: 'Navigation',
    tags: ['next', 'forward', 'right', '다음', '오른쪽'],
    nodes: [
      group('shaft', path('M4 12h15')),
      group('head', path('M13 5.5l6 5.8a1 1 0 0 1 0 1.4l-6 5.8')),
    ],
    motion: [
      transform(
        'shaft',
        [
          [0, 'scaleX(1)'],
          [0.18, 'scaleX(0.9566666666666667)'],
          [0.52, 'scaleX(1.09)'],
          [0.76, 'scaleX(1.0466666666666666)'],
          [1, 'scaleX(1)'],
        ],
        820,
        'left center'
      ),
      transform(
        'head',
        [
          [0, 'translate(0px, 0px)'],
          [0.18, 'translate(-0.65px, 0px)'],
          [0.52, 'translate(1.35px, 0px)'],
          [0.76, 'translate(0.7px, 0px)'],
          [1, 'translate(0px, 0px)'],
        ],
        820
      ),
    ],
  },
  {
    name: 'ChevronRight',
    category: 'Navigation',
    tags: ['next', 'expand', 'right', '다음', '펼치기'],
    nodes: [group('advance', ink('contour', 'm9 5.5 6 5.8a1 1 0 0 1 0 1.4l-6 5.8'))],
    motion: [
      transform(
        'advance',
        [
          [0, 'translateX(0px)'],
          [0.18, 'translateX(-0.75px)'],
          [0.55, 'translateX(1.9px)'],
          [0.78, 'translateX(0.9px)'],
          [1, 'translateX(0px)'],
        ],
        740
      ),
      stroke(
        'contour',
        [
          [0, 0],
          [0.18, 0.65],
          [0.52, 0],
          [1, 0],
        ],
        740
      ),
    ],
  },
  {
    name: 'Copy',
    category: 'Actions',
    tags: ['duplicate', 'clipboard', 'copy', '복사', '복제'],
    nodes: [
      group('original', path('M7 15.5H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h7.5a2 2 0 0 1 2 2v1')),
      group('duplicate', rect(8.5, 8.5, 11.5, 11.5, 2.5)),
    ],
    motion: [
      transform(
        'original',
        [
          [0, 'translate(0px, 0px) rotate(0deg) scale(1)'],
          [0.2, 'translate(.5px,.5px) rotate(0deg)'],
          [0.5, 'translate(-.8px,-.8px) rotate(-3deg)'],
          [0.75, 'translate(-.8px,-.8px) rotate(-3deg)'],
          [1, 'translate(0px, 0px) rotate(0deg) scale(1)'],
        ],
        940
      ),
      transform(
        'duplicate',
        [
          [0, 'translate(0px, 0px) rotate(0deg) scale(1)'],
          [0.2, 'translate(-2.2px,-2.2px) rotate(0deg)'],
          [0.53, 'translate(.9px,.9px) rotate(4deg)'],
          [0.77, 'translate(.4px,.4px) rotate(1deg)'],
          [1, 'translate(0px, 0px) rotate(0deg) scale(1)'],
        ],
        940
      ),
    ],
  },
  {
    name: 'ArrowLeft',
    category: 'Navigation',
    tags: ['back', 'previous', 'left', '이전', '왼쪽'],
    nodes: [
      group('shaft', path('M20 12H5')),
      group('head', path('M11 5.5l-6 5.8a1 1 0 0 0 0 1.4l6 5.8')),
    ],
    motion: [
      transform(
        'shaft',
        [
          [0, 'scaleX(1)'],
          [0.18, 'scaleX(0.9566666666666667)'],
          [0.52, 'scaleX(1.09)'],
          [0.76, 'scaleX(1.0466666666666666)'],
          [1, 'scaleX(1)'],
        ],
        820,
        'right center'
      ),
      transform(
        'head',
        [
          [0, 'translate(0px, 0px)'],
          [0.18, 'translate(0.65px, 0px)'],
          [0.52, 'translate(-1.35px, 0px)'],
          [0.76, 'translate(-0.7px, 0px)'],
          [1, 'translate(0px, 0px)'],
        ],
        820
      ),
    ],
  },
  {
    name: 'ExternalLink',
    category: 'Navigation',
    tags: ['open', 'new tab', 'external', '외부링크', '새창'],
    nodes: [
      ink('window', 'M10 4.5H6.5a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V14'),
      group('shaft', path('M11 13 19.5 4.5')),
      group('head', path('M13.5 4.5h6v6')),
    ],
    motion: [
      stroke(
        'window',
        [
          [0, 0],
          [0.2, 0.18],
          [0.66, 0],
          [1, 0],
        ],
        900
      ),
      transform(
        'shaft',
        [
          [0, 'scale(1)'],
          [0.16, 'scale(.92)'],
          [0.5, 'scale(1.105)'],
          [0.73, 'scale(1.105)'],
          [1, 'scale(1)'],
        ],
        900,
        'left bottom'
      ),
      transform(
        'head',
        [
          [0, 'translate(0px,0px)'],
          [0.16, 'translate(-.68px,.68px)'],
          [0.5, 'translate(.89px,-.89px)'],
          [0.73, 'translate(.89px,-.89px)'],
          [1, 'translate(0px,0px)'],
        ],
        900
      ),
    ],
  },
  {
    name: 'Pencil',
    category: 'Actions',
    tags: ['edit', 'write', 'compose', '편집', '수정'],
    nodes: [
      ink('ink', 'M4 20h6'),
      group(
        'pencil',
        path(
          'm5 18 .8-6L15.5 3.8a1.8 1.8 0 0 1 2.5.1l2.1 2.3a1.8 1.8 0 0 1-.2 2.5l-9.7 8.2L5 18ZM13.6 5.5l4.4 4.8M5.8 12l4.4 4.9'
        )
      ),
    ],
    motion: [
      transform(
        'pencil',
        [
          [0, 'translate(0px, 0px) rotate(0deg) scale(1)'],
          [0.16, 'translate(-.6px,1px) rotate(-4deg)'],
          [0.34, 'translate(.2px,.6px) rotate(1deg)'],
          [0.49, 'translate(.7px,1px) rotate(-2deg)'],
          [0.67, 'translate(1.1px,.5px) rotate(1deg)'],
          [0.8, 'translate(.5px,-.4px) rotate(-4deg)'],
          [1, 'translate(0px, 0px) rotate(0deg) scale(1)'],
        ],
        1000
      ),
      stroke(
        'ink',
        [
          [0, 0],
          [0.12, 1],
          [0.25, 1],
          [0.65, 0],
          [1, 0],
        ],
        1000
      ),
    ],
  },
  {
    name: 'ChevronLeft',
    category: 'Navigation',
    tags: ['previous', 'back', 'left', '이전', '뒤로'],
    nodes: [group('advance', ink('contour', 'm15 5.5-6 5.8a1 1 0 0 0 0 1.4l6 5.8'))],
    motion: [
      transform(
        'advance',
        [
          [0, 'translateX(0px)'],
          [0.18, 'translateX(0.75px)'],
          [0.55, 'translateX(-1.9px)'],
          [0.78, 'translateX(-0.9px)'],
          [1, 'translateX(0px)'],
        ],
        740
      ),
      stroke(
        'contour',
        [
          [0, 0],
          [0.18, 0.65],
          [0.52, 0],
          [1, 0],
        ],
        740
      ),
    ],
  },
  {
    name: 'ChevronDown',
    category: 'Navigation',
    tags: ['expand', 'dropdown', 'down', '펼치기', '아래'],
    nodes: [group('advance', ink('contour', 'm5.5 9 5.8 6a1 1 0 0 0 1.4 0l5.8-6'))],
    motion: [
      transform(
        'advance',
        [
          [0, 'translateY(0px)'],
          [0.18, 'translateY(-0.75px)'],
          [0.55, 'translateY(1.9px)'],
          [0.78, 'translateY(0.9px)'],
          [1, 'translateY(0px)'],
        ],
        740
      ),
      stroke(
        'contour',
        [
          [0, 0],
          [0.18, 0.65],
          [0.52, 0],
          [1, 0],
        ],
        740
      ),
    ],
  },
  {
    name: 'Search',
    category: 'Actions',
    tags: ['find', 'magnify', 'query', '검색', '찾기'],
    nodes: [
      group(
        'scan',
        group('lens', circle(10.5, 10.5, 6.5)),
        group('handle', path('m15.2 15.2 4.8 4.8'))
      ),
    ],
    motion: [
      transform(
        'scan',
        [
          [0, 'translate(0px,0px)'],
          [0.18, 'translate(-1px,.2px)'],
          [0.43, 'translate(.8px,-.6px)'],
          [0.63, 'translate(.8px,.7px)'],
          [0.8, 'translate(-.25px,.2px)'],
          [1, 'translate(0px,0px)'],
        ],
        980
      ),
      transform(
        'handle',
        [
          [0, 'rotate(0deg)'],
          [0.18, 'rotate(-7deg)'],
          [0.43, 'rotate(5deg)'],
          [0.63, 'rotate(-3deg)'],
          [1, 'rotate(0deg)'],
        ],
        980,
        'left top'
      ),
      transform(
        'lens',
        [
          [0, 'scale(1)'],
          [0.52, 'scale(1)'],
          [0.68, 'scale(1.045)'],
          [1, 'scale(1)'],
        ],
        980
      ),
    ],
  },
  {
    name: 'RotateCcw',
    category: 'Actions',
    tags: ['undo', 'reset', 'rotate', '되돌리기', '초기화'],
    nodes: [
      group('rewind', ink('arc', 'M5 9a7.5 7.5 0 1 1-.2 6.1'), group('head', path('M4 4.5V9h4.5'))),
    ],
    motion: [
      transform(
        'rewind',
        [
          [0, 'rotate(0deg)'],
          [0.18, 'rotate(12deg)'],
          [0.6, 'rotate(-16deg)'],
          [0.8, 'rotate(-16deg)'],
          [1, 'rotate(0deg)'],
        ],
        960
      ),
      stroke(
        'arc',
        [
          [0, 0],
          [0.18, 0.14],
          [0.62, 0.55],
          [0.82, 0.18],
          [1, 0],
        ],
        960
      ),
      transform(
        'head',
        [
          [0, 'translate(0px,0px)'],
          [0.2, 'translate(.3px,0px)'],
          [0.6, 'translate(.25px,.35px)'],
          [1, 'translate(0px,0px)'],
        ],
        960
      ),
    ],
  },
  {
    name: 'RefreshCcw',
    category: 'Actions',
    tags: ['refresh', 'reload', 'sync', '새로고침', '동기화'],
    nodes: [
      group(
        'cycle',
        ink('first', 'M5 9a7.4 7.4 0 0 1 12-3M4 4.5V9h4.5'),
        ink('second', 'M19 15a7.4 7.4 0 0 1-12 3M20 19.5V15h-4.5')
      ),
    ],
    motion: [
      transform(
        'cycle',
        [
          [0, 'rotate(0deg)'],
          [0.14, 'rotate(10deg)'],
          [0.69, 'rotate(-325deg)'],
          [0.88, 'rotate(-360deg)'],
          [1, 'rotate(-360deg)'],
        ],
        1000
      ),
      stroke(
        'first',
        [
          [0, 0],
          [0.22, 0.52],
          [0.58, 0],
          [1, 0],
        ],
        1000
      ),
      stroke(
        'second',
        [
          [0, 0],
          [0.36, 0.52],
          [0.73, 0],
          [1, 0],
        ],
        1000
      ),
    ],
  },
  {
    name: 'RefreshCw',
    category: 'Actions',
    tags: ['refresh', 'reload', 'retry', '새로고침', '재시도'],
    nodes: [
      group(
        'cycle',
        ink('first', 'M19 9A7.4 7.4 0 0 0 7 6M20 4.5V9h-4.5'),
        ink('second', 'M5 15a7.4 7.4 0 0 0 12 3M4 19.5V15h4.5')
      ),
    ],
    motion: [
      transform(
        'cycle',
        [
          [0, 'rotate(0deg)'],
          [0.14, 'rotate(-10deg)'],
          [0.69, 'rotate(325deg)'],
          [0.88, 'rotate(360deg)'],
          [1, 'rotate(360deg)'],
        ],
        1000
      ),
      stroke(
        'first',
        [
          [0, 0],
          [0.22, 0.52],
          [0.58, 0],
          [1, 0],
        ],
        1000
      ),
      stroke(
        'second',
        [
          [0, 0],
          [0.36, 0.52],
          [0.73, 0],
          [1, 0],
        ],
        1000
      ),
    ],
  },
  {
    name: 'ArrowDown',
    category: 'Navigation',
    tags: ['down', 'below', 'south', '아래', '내리기'],
    nodes: [
      group('shaft', path('M12 4v15')),
      group('head', path('M5.5 13l5.8 6a1 1 0 0 0 1.4 0l5.8-6')),
    ],
    motion: [
      transform(
        'shaft',
        [
          [0, 'scaleY(1)'],
          [0.18, 'scaleY(0.9566666666666667)'],
          [0.52, 'scaleY(1.09)'],
          [0.76, 'scaleY(1.0466666666666666)'],
          [1, 'scaleY(1)'],
        ],
        820,
        'center top'
      ),
      transform(
        'head',
        [
          [0, 'translate(0px, 0px)'],
          [0.18, 'translate(0px, -0.65px)'],
          [0.52, 'translate(0px, 1.35px)'],
          [0.76, 'translate(0px, 0.7px)'],
          [1, 'translate(0px, 0px)'],
        ],
        820
      ),
    ],
  },
  {
    name: 'Upload',
    category: 'Files',
    tags: ['upload', 'import', 'transfer', '업로드', '올리기'],
    nodes: [
      group('tray', path('M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3')),
      group('shaft', path('M12 15V4')),
      group('head', path('M7.5 8.5l3.8-3.8a1 1 0 0 1 1.4 0l3.8 3.8')),
    ],
    motion: [
      transform(
        'tray',
        [
          [0, 'scaleY(1)'],
          [0.2, 'scaleY(.87)'],
          [0.46, 'scaleY(1)'],
          [1, 'scaleY(1)'],
        ],
        900,
        'center bottom'
      ),
      transform(
        'shaft',
        [
          [0, 'scaleY(1)'],
          [0.2, 'scaleY(.9)'],
          [0.52, 'scaleY(1.1)'],
          [0.73, 'scaleY(1.1)'],
          [1, 'scaleY(1)'],
        ],
        900,
        'center bottom'
      ),
      transform(
        'head',
        [
          [0, 'translateY(0px)'],
          [0.2, 'translateY(1.1px)'],
          [0.52, 'translateY(-1.1px)'],
          [0.73, 'translateY(-1.1px)'],
          [1, 'translateY(0px)'],
        ],
        900
      ),
    ],
  },
  {
    name: 'Send',
    category: 'Communication',
    tags: ['send', 'submit', 'paper plane', '전송', '보내기'],
    nodes: [
      group(
        'plane',
        ink(
          'outline',
          'M4.5 10.2 19 4.1a.7.7 0 0 1 .9.9l-6.1 14.5a.7.7 0 0 1-1.3 0l-2.3-5.7-5.7-2.3a.7.7 0 0 1 0-1.3Z'
        ),
        ink('fold', 'M10.2 13.8l5.4-5.4')
      ),
    ],
    motion: [
      motion(
        'plane',
        [
          { offset: 0, transform: 'translate(0px, 0px) rotate(0deg) scale(1)', opacity: 1 },
          { offset: 0.2, transform: 'translate(-.7px,.7px) rotate(-7deg) scale(.94)', opacity: 1 },
          {
            offset: 0.46,
            transform: 'translate(1.2px,-1.2px) rotate(2deg) scale(.9)',
            opacity: 0,
            easing: 'steps(1, end)',
          },
          { offset: 0.5, transform: 'translate(-.6px,.6px) rotate(-3deg) scale(.94)', opacity: 0 },
          { offset: 0.78, transform: 'translate(0px, 0px) rotate(0deg) scale(1)', opacity: 1 },
          { offset: 1, transform: 'translate(0px, 0px) rotate(0deg) scale(1)', opacity: 1 },
        ],
        1000
      ),
      stroke(
        'fold',
        [
          [0, 0],
          [0.17, 0.7],
          [0.34, 0],
          [1, 0],
        ],
        1000
      ),
      stroke(
        'outline',
        [
          [0, 0],
          [0.49, 0],
          [0.5, 0.7],
          [0.82, 0],
          [1, 0],
        ],
        1000
      ),
    ],
  },
  {
    name: 'ArrowUp',
    category: 'Navigation',
    tags: ['up', 'above', 'north', '위', '올리기'],
    nodes: [
      group('shaft', path('M12 20V5')),
      group('head', path('M5.5 11l5.8-6a1 1 0 0 1 1.4 0l5.8 6')),
    ],
    motion: [
      transform(
        'shaft',
        [
          [0, 'scaleY(1)'],
          [0.18, 'scaleY(0.9566666666666667)'],
          [0.52, 'scaleY(1.09)'],
          [0.76, 'scaleY(1.0466666666666666)'],
          [1, 'scaleY(1)'],
        ],
        820,
        'center bottom'
      ),
      transform(
        'head',
        [
          [0, 'translate(0px, 0px)'],
          [0.18, 'translate(0px, 0.65px)'],
          [0.52, 'translate(0px, -1.35px)'],
          [0.76, 'translate(0px, -0.7px)'],
          [1, 'translate(0px, 0px)'],
        ],
        820
      ),
    ],
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
      motion(
        'first',
        [
          { offset: 0, transform: 'translateY(0px) scale(1)', opacity: 1 },
          { offset: 0.16, transform: 'translateY(.5px) scale(.85)', opacity: 0.7 },
          { offset: 0.43, transform: 'translateY(-2px) scale(1.12)', opacity: 1 },
          { offset: 0.7, transform: 'translateY(.3px) scale(1)', opacity: 1 },
          { offset: 1, transform: 'translateY(0px) scale(1)', opacity: 1 },
        ],
        650,
        0
      ),
      motion(
        'second',
        [
          { offset: 0, transform: 'translateY(0px) scale(1)', opacity: 1 },
          { offset: 0.16, transform: 'translateY(.5px) scale(.85)', opacity: 0.7 },
          { offset: 0.43, transform: 'translateY(-2px) scale(1.12)', opacity: 1 },
          { offset: 0.7, transform: 'translateY(.3px) scale(1)', opacity: 1 },
          { offset: 1, transform: 'translateY(0px) scale(1)', opacity: 1 },
        ],
        650,
        110
      ),
      motion(
        'third',
        [
          { offset: 0, transform: 'translateY(0px) scale(1)', opacity: 1 },
          { offset: 0.16, transform: 'translateY(.5px) scale(.85)', opacity: 0.7 },
          { offset: 0.43, transform: 'translateY(-2px) scale(1.12)', opacity: 1 },
          { offset: 0.7, transform: 'translateY(.3px) scale(1)', opacity: 1 },
          { offset: 1, transform: 'translateY(0px) scale(1)', opacity: 1 },
        ],
        650,
        220
      ),
    ],
  },
  {
    name: 'ChevronsUpDown',
    category: 'Navigation',
    tags: ['sort', 'select', 'switch', '정렬', '선택'],
    nodes: [
      group('upper', ink('upperStroke', 'm7 9 4.3-4.3a1 1 0 0 1 1.4 0L17 9')),
      group('lower', ink('lowerStroke', 'm7 15 4.3 4.3a1 1 0 0 0 1.4 0L17 15')),
    ],
    motion: [
      transform(
        'upper',
        [
          [0, 'translateY(0px)'],
          [0.18, 'translateY(.8px)'],
          [0.46, 'translateY(-1px)'],
          [0.68, 'translateY(-1px)'],
          [1, 'translateY(0px)'],
        ],
        820
      ),
      transform(
        'lower',
        [
          [0, 'translateY(0px)'],
          [0.18, 'translateY(-.8px)'],
          [0.55, 'translateY(1px)'],
          [0.75, 'translateY(1px)'],
          [1, 'translateY(0px)'],
        ],
        820
      ),
      stroke(
        'upperStroke',
        [
          [0, 0],
          [0.18, 0.4],
          [0.5, 0],
          [1, 0],
        ],
        820
      ),
      stroke(
        'lowerStroke',
        [
          [0, 0],
          [0.27, 0.4],
          [0.6, 0],
          [1, 0],
        ],
        820
      ),
    ],
  },
  {
    name: 'LogOut',
    category: 'Navigation',
    tags: ['exit', 'sign out', 'leave', '로그아웃', '나가기'],
    nodes: [
      group('door', path('M10 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4')),
      group('shaft', path('M9 12h11')),
      group('head', path('M16 7.5l3.8 3.8a1 1 0 0 1 0 1.4L16 16.5')),
    ],
    motion: [
      transform(
        'door',
        [
          [0, 'scaleX(1)'],
          [0.2, 'scaleX(.82)'],
          [0.65, 'scaleX(.82)'],
          [1, 'scaleX(1)'],
        ],
        920,
        'left center'
      ),
      transform(
        'shaft',
        [
          [0, 'scaleX(1)'],
          [0.2, 'scaleX(.93)'],
          [0.54, 'scaleX(1.08)'],
          [0.73, 'scaleX(1.08)'],
          [1, 'scaleX(1)'],
        ],
        920,
        'left center'
      ),
      transform(
        'head',
        [
          [0, 'translateX(0px)'],
          [0.2, 'translateX(-.77px)'],
          [0.54, 'translateX(.88px)'],
          [0.73, 'translateX(.88px)'],
          [1, 'translateX(0px)'],
        ],
        920
      ),
    ],
  },
  {
    name: 'Download',
    category: 'Files',
    tags: ['download', 'save', 'export', '다운로드', '내려받기'],
    nodes: [
      group('tray', path('M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3')),
      group('shaft', path('M12 4v11')),
      group('head', path('M7.5 10.5l3.8 3.8a1 1 0 0 0 1.4 0l3.8-3.8')),
    ],
    motion: [
      transform(
        'shaft',
        [
          [0, 'scaleY(1)'],
          [0.16, 'scaleY(.93)'],
          [0.51, 'scaleY(1.16)'],
          [0.68, 'scaleY(1.16)'],
          [1, 'scaleY(1)'],
        ],
        940,
        'center top'
      ),
      transform(
        'head',
        [
          [0, 'translateY(0px)'],
          [0.16, 'translateY(-.77px)'],
          [0.51, 'translateY(1.76px)'],
          [0.68, 'translateY(1.76px)'],
          [1, 'translateY(0px)'],
        ],
        940
      ),
      transform(
        'tray',
        [
          [0, 'scaleY(1)'],
          [0.44, 'scaleY(1)'],
          [0.6, 'scaleY(.85)'],
          [0.8, 'scaleY(1.035)'],
          [1, 'scaleY(1)'],
        ],
        940,
        'center bottom'
      ),
    ],
  },
  {
    name: 'Share2',
    category: 'Communication',
    tags: ['share', 'network', 'distribute', '공유', '연결'],
    nodes: [
      ink('upperConnection', 'm8.2 10.6 7.6-4.2'),
      ink('lowerConnection', 'M8.2 13.4l7.6 4.2'),
      group('source', circle(6, 12, 2.5)),
      group('upper', circle(18, 5, 2)),
      group('lower', circle(18, 19, 2)),
    ],
    motion: [
      transform(
        'source',
        [
          [0, 'scale(1)'],
          [0.16, 'scale(.84)'],
          [0.35, 'scale(1)'],
          [1, 'scale(1)'],
        ],
        940
      ),
      stroke(
        'upperConnection',
        [
          [0, 0],
          [0.15, 1],
          [0.23, 1],
          [0.49, 0],
          [1, 0],
        ],
        940
      ),
      stroke(
        'lowerConnection',
        [
          [0, 0],
          [0.15, 1],
          [0.36, 1],
          [0.65, 0],
          [1, 0],
        ],
        940
      ),
      transform(
        'upper',
        [
          [0, 'scale(1)'],
          [0.44, 'scale(1)'],
          [0.59, 'scale(1.14)'],
          [0.8, 'scale(1)'],
          [1, 'scale(1)'],
        ],
        940
      ),
      transform(
        'lower',
        [
          [0, 'scale(1)'],
          [0.6, 'scale(1)'],
          [0.76, 'scale(1.14)'],
          [1, 'scale(1)'],
        ],
        940
      ),
    ],
  },
  {
    name: 'Menu',
    category: 'Navigation',
    tags: ['menu', 'navigation', 'hamburger', '메뉴', '탐색'],
    nodes: [ink('top', 'M4.5 6h15'), ink('middle', 'M4.5 12h15'), ink('bottom', 'M4.5 18h15')],
    motion: [
      stroke(
        'top',
        [
          [0, 0],
          [0.2, 0.8],
          [0.54, 0],
          [1, 0],
        ],
        800
      ),
      stroke(
        'middle',
        [
          [0, 0],
          [0.12, 0],
          [0.33, 0.65],
          [0.69, 0],
          [1, 0],
        ],
        800
      ),
      stroke(
        'bottom',
        [
          [0, 0],
          [0.24, 0],
          [0.46, 0.8],
          [0.84, 0],
          [1, 0],
        ],
        800
      ),
    ],
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
        )
      ),
      group('bearing', circle(12, 12, 3)),
    ],
    motion: [
      transform(
        'gear',
        [
          [0, 'rotate(0deg)'],
          [0.17, 'rotate(-9deg)'],
          [0.56, 'rotate(183deg)'],
          [0.73, 'rotate(298deg)'],
          [0.87, 'rotate(358deg)'],
          [1, 'rotate(360deg)'],
        ],
        960
      ),
      transform(
        'bearing',
        [
          [0, 'scale(1,1)'],
          [0.2, 'scale(.9,1.08)'],
          [0.55, 'scale(1.12,.88)'],
          [0.76, 'scale(.97,1.03)'],
          [1, 'scale(1,1)'],
        ],
        960
      ),
    ],
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
      ...slider('upper', 'upperLeftTrack', 'upperRightTrack', 3, 9, [
        [0, 0],
        [0.16, -0.6],
        [0.42, 2.5],
        [0.68, 2.5],
        [0.87, -0.2],
        [1, 0],
      ]),
      ...slider('lower', 'lowerLeftTrack', 'lowerRightTrack', 9, 3, [
        [0, 0],
        [0.24, 0],
        [0.4, 0.6],
        [0.65, -2.5],
        [0.82, -2.5],
        [1, 0],
      ]),
    ],
  },
]
