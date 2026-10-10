import type { IconDefinition, IconMotion, IconNode } from '../types'

const path = (d: string, attrs?: IconNode['attrs']): IconNode => ({
  tag: 'path',
  attrs: { d, ...attrs },
})
const circle = (cx: number, cy: number, r: number): IconNode => ({
  tag: 'circle',
  attrs: { cx, cy, r },
})
const rect = (x: number, y: number, width: number, height: number, rx = 1.5): IconNode => ({
  tag: 'rect',
  attrs: { x, y, width, height, rx },
})
const group = (part: string, ...children: IconNode[]): IconNode => ({ tag: 'g', part, children })
const move = (
  part: string,
  transforms: string[],
  duration = 560,
  origin = 'center'
): IconMotion => ({
  part,
  duration,
  easing: 'cubic-bezier(.22,.8,.3,1)',
  keyframes: transforms.map((transform) => ({ transform, transformOrigin: origin })),
})

/** Original Comwit geometry: a 24-unit canvas, open interiors and softly resolved corners. */
export const objectIcons: readonly IconDefinition[] = [
  {
    name: 'Users',
    category: 'People',
    tags: ['team', 'members', 'group', '사용자', '팀'],
    nodes: [
      circle(9, 8, 3),
      path('M3.5 20v-2.2A4.3 4.3 0 0 1 7.8 13.5h2.4a4.3 4.3 0 0 1 4.3 4.3V20'),
      group('companion', path('M15.2 5.3a3 3 0 0 1 0 5.4M17 13.7a4.2 4.2 0 0 1 3.5 4.1V20')),
    ],
    motion: [
      move('companion', ['translateX(0)', 'translateX(-1px)', 'translateX(.4px)', 'translateX(0)']),
    ],
  },
  {
    name: 'MessageCircle',
    category: 'Communication',
    tags: ['chat', 'comment', '대화', '댓글'],
    nodes: [
      path(
        'M12 3.5c5 0 8.5 3.1 8.5 7.5s-3.5 7.5-8.5 7.5c-1.1 0-2.2-.2-3.2-.5L4 20l1-4.2A6.9 6.9 0 0 1 3.5 11C3.5 6.6 7 3.5 12 3.5Z'
      ),
      group('words', path('M8 9.5h8M8 12.8h5')),
    ],
    motion: [
      {
        part: 'words',
        duration: 520,
        keyframes: [
          { opacity: 1 },
          { opacity: 0.25, transform: 'translateY(.7px)' },
          { opacity: 1, transform: 'translateY(0)' },
        ],
      },
    ],
  },
  {
    name: 'CheckCircle2',
    category: 'Status',
    tags: ['success', 'complete', 'done', '완료', '성공'],
    nodes: [circle(12, 12, 8.25), group('check', path('m8.1 12 2.6 2.8 5.5-5.6'))],
    motion: [move('check', ['scale(1)', 'scale(.72)', 'scale(1.12)', 'scale(1)'], 480)],
  },
  {
    name: 'FileText',
    category: 'Files',
    tags: ['document', 'page', '문서', '파일'],
    nodes: [
      path(
        'M14 3.5H6.7A1.7 1.7 0 0 0 5 5.2v13.6a1.7 1.7 0 0 0 1.7 1.7h10.6a1.7 1.7 0 0 0 1.7-1.7V8.5L14 3.5Z'
      ),
      path('M14 3.5v3.5A1.5 1.5 0 0 0 15.5 8.5H19'),
      group('lines', path('M8.5 12h7M8.5 15.5h5')),
    ],
    motion: [move('lines', ['translateY(0)', 'translateY(-1px)', 'translateY(0)'], 500)],
  },
  {
    name: 'Sparkles',
    category: 'Objects',
    tags: ['magic', 'ai', 'shine', '반짝임', '인공지능'],
    nodes: [
      group('spark', path('M9.7 4.8 12 10l5.2 2.3L12 14.6l-2.3 5.2-2.3-5.2-4.1-2.3L7.4 10Z')),
      group(
        'twinkle',
        path('m18 3.5.9 2.6 2.1.9-2.1.9-.9 2.6-.9-2.6-2.1-.9 2.1-.9ZM18.5 16v4M16.5 18h4')
      ),
    ],
    motion: [
      move('spark', ['scale(1)', 'scale(.86)', 'scale(1.06)', 'scale(1)'], 660),
      move('twinkle', ['scale(1)', 'scale(1.2)', 'scale(.85)', 'scale(1)'], 660),
    ],
  },
  {
    name: 'ImagePlus',
    category: 'Files',
    tags: ['photo', 'picture', 'upload', '이미지', '사진추가'],
    nodes: [
      path('M20.5 12.2v6.3a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2v-13a2 2 0 0 1 2-2h6.3'),
      circle(8.5, 8.5, 1.4),
      path('m3.5 17 4.2-4.2a1.2 1.2 0 0 1 1.7 0l3 3 2-2a1.2 1.2 0 0 1 1.7 0l4.4 4.4'),
      group('plus', path('M17.5 3.5v7M14 7h7')),
    ],
    motion: [move('plus', ['rotate(0deg)', 'rotate(90deg)', 'rotate(0deg)'], 520)],
  },
  {
    name: 'Heart',
    category: 'Objects',
    tags: ['like', 'favorite', 'love', '좋아요', '하트'],
    nodes: [
      group(
        'heart',
        path(
          'M12 20s-8.5-5.1-8.5-10.8a4.7 4.7 0 0 1 8.5-2.7 4.7 4.7 0 0 1 8.5 2.7C20.5 14.9 12 20 12 20Z'
        )
      ),
    ],
    motion: [
      move('heart', ['scale(1)', 'scale(1.12)', 'scale(.96)', 'scale(1.06)', 'scale(1)'], 650),
    ],
  },
  {
    name: 'CalendarDays',
    category: 'Objects',
    tags: ['date', 'schedule', 'calendar', '달력', '일정'],
    nodes: [
      rect(3.8, 5.8, 16.4, 14.7, 2),
      path('M7.8 3.5v4.2M16.2 3.5v4.2M3.8 10.3h16.4'),
      group('days', path('M7.5 14h.5M11.8 14h.5M16 14h.5M7.5 17h.5M11.8 17h.5')),
    ],
    motion: [
      {
        part: 'days',
        duration: 560,
        keyframes: [
          { opacity: 1, transform: 'translateY(0)' },
          { opacity: 0.2, transform: 'translateY(1px)' },
          { opacity: 1, transform: 'translateY(0)' },
        ],
      },
    ],
  },
  {
    name: 'Globe2',
    category: 'Objects',
    tags: ['world', 'language', 'web', '지구', '언어'],
    nodes: [
      circle(12, 12, 8.3),
      path('M3.7 12h16.6'),
      group(
        'meridians',
        path(
          'M12 3.7c2.2 2.1 3.4 4.9 3.4 8.3s-1.2 6.2-3.4 8.3C9.8 18.2 8.6 15.4 8.6 12s1.2-6.2 3.4-8.3Z'
        )
      ),
    ],
    motion: [move('meridians', ['scaleX(1)', 'scaleX(.25)', 'scaleX(1)'], 700)],
  },
  {
    name: 'Lock',
    category: 'Objects',
    tags: ['private', 'secure', 'locked', '잠금', '비공개'],
    nodes: [
      rect(5, 10, 14, 10.5, 2.2),
      group('shackle', path('M8 10V7.5a4 4 0 0 1 8 0V10')),
      path('M12 14v2.5'),
    ],
    motion: [
      move(
        'shackle',
        ['translateY(0)', 'translateY(-1px)', 'translateY(.4px)', 'translateY(0)'],
        520
      ),
    ],
  },
  {
    name: 'AlertTriangle',
    category: 'Status',
    tags: ['warning', 'danger', '주의', '경고'],
    nodes: [
      path('M10.5 4.9a1.7 1.7 0 0 1 3 0l7 12.9a1.7 1.7 0 0 1-1.5 2.5H5a1.7 1.7 0 0 1-1.5-2.5Z'),
      group('warning', path('M12 9.5v4.2M12 16.7v.1')),
    ],
    motion: [
      move(
        'warning',
        ['translateY(0)', 'translateY(-1px)', 'translateY(.5px)', 'translateY(0)'],
        480
      ),
    ],
  },
  {
    name: 'Link2',
    category: 'Actions',
    tags: ['url', 'chain', 'connect', '링크', '연결'],
    nodes: [
      group(
        'left-link',
        path('m9.3 15.9-1.4 1.4a3.7 3.7 0 0 1-5.2-5.2l3.4-3.4a3.7 3.7 0 0 1 5.2 0', {
          transform: 'translate(1 0)',
        })
      ),
      group(
        'right-link',
        path('m13.7 8.1 1.4-1.4a3.7 3.7 0 0 1 5.2 5.2l-3.4 3.4a3.7 3.7 0 0 1-5.2 0', {
          transform: 'translate(-1 0)',
        })
      ),
      path('m8.8 13.8 6.4-3.6'),
    ],
    motion: [
      move('left-link', ['translate(0,0)', 'translate(-.7px,.7px)', 'translate(0,0)'], 560),
      move('right-link', ['translate(0,0)', 'translate(.7px,-.7px)', 'translate(0,0)'], 560),
    ],
  },
  {
    name: 'UserRound',
    category: 'People',
    tags: ['person', 'profile', 'account', '사용자', '프로필'],
    nodes: [
      group('head', circle(12, 7.5, 3.5)),
      path('M5 20.5v-1.2a5.3 5.3 0 0 1 5.3-5.3h3.4a5.3 5.3 0 0 1 5.3 5.3v1.2'),
    ],
    motion: [
      move(
        'head',
        ['translateY(0)', 'translateY(-.8px)', 'translateY(.3px)', 'translateY(0)'],
        550
      ),
    ],
  },
  {
    name: 'Rocket',
    category: 'Objects',
    tags: ['launch', 'start', 'boost', '로켓', '시작'],
    nodes: [
      group(
        'rocket',
        path(
          'M10 15.7 8.3 14c.7-4.9 4.8-9.3 11.9-10.2.1 6.6-4.2 11.3-9 12.1L10 15.7ZM8.5 10.5 5.5 11.5 3.8 15l4.5-1M13.5 15.5l-1 4.7 3.5-1.7 1-3'
        ),
        circle(15.8, 8.3, 1.5)
      ),
      group('flame', path('M7.2 16.8c-2.4-.1-3.5 1.4-3.5 3.5 2.1 0 3.6-1.1 3.5-3.5Z')),
    ],
    motion: [
      move('rocket', ['translate(0,0)', 'translate(1px,-1px)', 'translate(0,0)'], 650),
      {
        part: 'flame',
        duration: 650,
        keyframes: [{ opacity: 1 }, { opacity: 0.35 }, { opacity: 1 }],
      },
    ],
  },
  {
    name: 'ShieldCheck',
    category: 'Status',
    tags: ['verified', 'security', 'trust', '보안', '인증'],
    nodes: [
      path(
        'M12 3.5c2.5 1.7 5 2.6 7.5 3v5.7c0 3.8-2.5 6.7-7.5 8.3-5-1.6-7.5-4.5-7.5-8.3V6.5c2.5-.4 5-1.3 7.5-3Z'
      ),
      group('check', path('m8.5 11.8 2.4 2.4 4.6-4.6')),
    ],
    motion: [move('check', ['scale(1)', 'scale(.8)', 'scale(1.1)', 'scale(1)'], 520)],
  },
  {
    name: 'Clock3',
    category: 'Objects',
    tags: ['time', 'history', 'clock', '시간', '시계'],
    nodes: [
      circle(12, 12, 8.3),
      path('M12 6v.3M18 12h-.3M12 18v-.3M6 12h.3'),
      group('hands', path('M12 8v4h3.5')),
    ],
    motion: [
      move(
        'hands',
        ['rotate(0deg)', 'rotate(18deg)', 'rotate(-4deg)', 'rotate(0deg)'],
        650,
        '0% 100%'
      ),
    ],
  },
  {
    name: 'GraduationCap',
    category: 'Objects',
    tags: ['education', 'course', 'learn', '교육', '학습'],
    nodes: [
      path('m3.5 8.5 8.5-4 8.5 4-8.5 4ZM6.5 10v6.2c3.8 2.3 7.2 2.3 11 0V10'),
      group('tassel', path('M20.5 8.5v8.3M20.5 16.8l-1 2.7h1.5')),
    ],
    motion: [
      move(
        'tassel',
        ['rotate(0deg)', 'rotate(8deg)', 'rotate(-5deg)', 'rotate(0deg)'],
        700,
        '50% 0%'
      ),
    ],
  },
  {
    name: 'LockKeyhole',
    category: 'Objects',
    tags: ['password', 'secure', 'privacy', '자물쇠', '비밀번호'],
    nodes: [
      rect(5, 10, 14, 10.5, 2.2),
      path('M8 10V7.5a4 4 0 0 1 8 0V10'),
      group('keyhole', circle(12, 14.3, 1.2), path('M12 15.5v2')),
    ],
    motion: [
      move('keyhole', ['rotate(0deg)', 'rotate(-15deg)', 'rotate(15deg)', 'rotate(0deg)'], 550),
    ],
  },
  {
    name: 'Star',
    category: 'Objects',
    tags: ['favorite', 'rating', 'bookmark', '별', '즐겨찾기'],
    nodes: [
      group('star', path('m12 3.7 2.6 5.4 5.9.8-4.3 4.2 1 6L12 17.3l-5.2 2.8 1-6-4.3-4.2 5.9-.8Z')),
    ],
    motion: [
      move(
        'star',
        [
          'rotate(0deg) scale(1)',
          'rotate(-10deg) scale(.9)',
          'rotate(7deg) scale(1.08)',
          'rotate(0deg) scale(1)',
        ],
        620
      ),
    ],
  },
  {
    name: 'KeyRound',
    category: 'Objects',
    tags: ['key', 'access', 'credential', '열쇠', '접근'],
    nodes: [
      group(
        'key',
        path('M13.2 12.2a5 5 0 1 0-2.1-2.1L3.5 17.7v2.8h3v-2.7h2.7v-2.6Z'),
        circle(16.5, 7.3, 1)
      ),
    ],
    motion: [move('key', ['rotate(0deg)', 'rotate(-9deg)', 'rotate(4deg)', 'rotate(0deg)'], 620)],
  },
  {
    name: 'MapPin',
    category: 'Objects',
    tags: ['location', 'place', 'address', '위치', '주소'],
    nodes: [
      path('M19 10.5c0 5-7 10-7 10s-7-5-7-10a7 7 0 0 1 14 0Z'),
      group('point', circle(12, 10.5, 2.5)),
    ],
    motion: [move('point', ['scale(1)', 'scale(.7)', 'scale(1.15)', 'scale(1)'], 560)],
  },
  {
    name: 'AlertCircle',
    category: 'Status',
    tags: ['notice', 'error', 'warning', '알림', '오류'],
    nodes: [circle(12, 12, 8.3), group('notice', path('M12 7.5v5.5M12 16.3v.2'))],
    motion: [
      move('notice', ['rotate(0deg)', 'rotate(-8deg)', 'rotate(8deg)', 'rotate(0deg)'], 480),
    ],
  },
  {
    name: 'Database',
    category: 'Objects',
    tags: ['storage', 'server', 'data', '데이터베이스', '저장소'],
    nodes: [
      { tag: 'ellipse', attrs: { cx: 12, cy: 6.5, rx: 7.5, ry: 3 } },
      path('M4.5 6.5v11c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3v-11'),
      group('layer', path('M4.5 11.8c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3')),
    ],
    motion: [move('layer', ['translateY(0)', 'translateY(1.6px)', 'translateY(0)'], 650)],
  },
  {
    name: 'CreditCard',
    category: 'Objects',
    tags: ['payment', 'billing', 'card', '결제', '카드'],
    nodes: [
      rect(3.5, 5.5, 17, 13, 2),
      path('M3.5 10h17'),
      group('details', path('M7 14.7h3.5M16 14.7h1')),
    ],
    motion: [move('details', ['translateX(0)', 'translateX(1.2px)', 'translateX(0)'], 550)],
  },
  {
    name: 'Briefcase',
    category: 'Objects',
    tags: ['work', 'business', 'job', '업무', '직장'],
    nodes: [
      rect(3.5, 7.5, 17, 13, 2),
      path(
        'M8.5 7.5V5a1.5 1.5 0 0 1 1.5-1.5h4A1.5 1.5 0 0 1 15.5 5v2.5M3.5 12.5c5.7 2 11.3 2 17 0'
      ),
      group('clasp', path('M10.5 13.5v3h3v-3')),
    ],
    motion: [
      move(
        'clasp',
        ['translateY(0)', 'translateY(.8px)', 'translateY(-.3px)', 'translateY(0)'],
        500
      ),
    ],
  },
  {
    name: 'MessagesSquare',
    category: 'Communication',
    tags: ['conversation', 'messages', 'discussion', '메시지', '채팅'],
    nodes: [
      path(
        'M15.5 4H5.2a1.7 1.7 0 0 0-1.7 1.7V16l3.4-2.8h8.6a1.7 1.7 0 0 0 1.7-1.7V5.7A1.7 1.7 0 0 0 15.5 4Z'
      ),
      group('reply', path('M8 16.5v.3a1.7 1.7 0 0 0 1.7 1.7h7.4l3.4 2V10.2A1.7 1.7 0 0 0 19 8.5')),
      path('M7.5 8.6h5.7'),
    ],
    motion: [move('reply', ['translateY(0)', 'translateY(-1px)', 'translateY(0)'], 560)],
  },
  {
    name: 'Smartphone',
    category: 'Objects',
    tags: ['mobile', 'phone', 'device', '휴대폰', '모바일'],
    nodes: [group('phone', rect(6.5, 3.5, 11, 17, 2), path('M10 6h4M11.2 17.8h1.6'))],
    motion: [
      move(
        'phone',
        ['rotate(0deg)', 'rotate(-5deg)', 'rotate(5deg)', 'rotate(-3deg)', 'rotate(0deg)'],
        580
      ),
    ],
  },
  {
    name: 'Bell',
    category: 'Communication',
    tags: ['notification', 'ring', '알림', '종'],
    nodes: [
      group(
        'bell',
        path('M5 16.7c1.3-1.5 1.7-3.4 1.7-6a5.3 5.3 0 0 1 10.6 0c0 2.6.4 4.5 1.7 6H5ZM12 3.5v1.9')
      ),
      group('clapper', path('M9.7 19a2.5 2.5 0 0 0 4.6 0')),
    ],
    motion: [
      move(
        'bell',
        ['rotate(0deg)', 'rotate(-12deg)', 'rotate(10deg)', 'rotate(-5deg)', 'rotate(0deg)'],
        700,
        '50% 0%'
      ),
      move(
        'clapper',
        ['translateX(0)', 'translateX(1px)', 'translateX(-.7px)', 'translateX(0)'],
        700
      ),
    ],
  },
  {
    name: 'Folder',
    category: 'Files',
    tags: ['directory', 'collection', '폴더', '디렉터리'],
    nodes: [
      path('M3.5 10V6a1.5 1.5 0 0 1 1.5-1.5h4l2.4 2.7H19a1.5 1.5 0 0 1 1.5 1.5V10'),
      group('front', path('M3.5 10h17v8a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 18Z')),
    ],
    motion: [move('front', ['scaleY(1)', 'scaleY(.87)', 'scaleY(1)'], 560, '50% 100%')],
  },
  {
    name: 'House',
    category: 'Navigation',
    tags: ['home', 'dashboard', '집', '홈'],
    nodes: [
      path(
        'm3.5 10.5 7.4-6.3a1.7 1.7 0 0 1 2.2 0l7.4 6.3M5.5 8.8v10.1a1.6 1.6 0 0 0 1.6 1.6h9.8a1.6 1.6 0 0 0 1.6-1.6V8.8'
      ),
      group('door', path('M9.5 20.5v-6.3h5v6.3')),
    ],
    motion: [move('door', ['scaleX(1)', 'scaleX(.65)', 'scaleX(1)'], 620, '0% 50%')],
  },
]
