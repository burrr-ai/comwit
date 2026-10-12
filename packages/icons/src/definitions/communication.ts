import type { IconDefinition } from '../types'
import { c, enter, fly, g, ink, p, pivot, pop, push, r, spring, swing, write } from './kit'

const bell = 'M5 16.7c1.3-1.5 1.7-3.4 1.7-6a5.3 5.3 0 0 1 10.6 0c0 2.6.4 4.5 1.7 6H5Z'
const clapper = 'M9.7 19a2.5 2.5 0 0 0 4.6 0'

export const communicationIcons: readonly IconDefinition[] = [
  {
    name: 'Bell',
    category: 'Communication',
    tags: ['notification', 'alert', 'reminder', '알림', '벨'],
    nodes: [
      p('M12 3.5v1.9'),
      pivot(g('bell', p(bell)), 12, 4.6),
      pivot(g('clapper', p(clapper)), 12, 4.6),
    ],
    // The clapper hangs from the same crown and lags a beat behind the shell.
    motion: [
      swing('bell', { rotate: 15 }, { beats: 5, interval: 90 }),
      swing('clapper', { rotate: 22 }, { at: 45, beats: 5, interval: 90 }),
    ],
  },
  {
    name: 'BellRing',
    category: 'Communication',
    tags: ['ringing', 'notification', 'alarm', '알림', '울림'],
    nodes: [
      p('M12 3.5v1.9'),
      pivot(g('bell', p(bell)), 12, 4.6),
      pivot(g('clapper', p(clapper)), 12, 4.6),
      g('left-wave', p('M3.6 8.2a8.6 8.6 0 0 1 2.2-4.3')),
      g('right-wave', p('M20.4 8.2a8.6 8.6 0 0 0-2.2-4.3')),
    ],
    motion: [
      swing('bell', { rotate: 15 }, { beats: 5, interval: 90 }),
      swing('clapper', { rotate: 22 }, { at: 45, beats: 5, interval: 90 }),
      enter('left-wave', { x: 1.6, y: 1, opacity: 0 }, { at: 60, spring: spring.snappy }),
      enter('right-wave', { x: -1.6, y: 1, opacity: 0 }, { at: 60, spring: spring.snappy }),
    ],
  },
  {
    name: 'MessageCircle',
    category: 'Communication',
    tags: ['chat', 'comment', 'reply', '대화', '댓글'],
    nodes: [
      g(
        'bubble',
        p(
          'M12 3.5c5 0 8.5 3.1 8.5 7.5s-3.5 7.5-8.5 7.5c-1.1 0-2.2-.2-3.2-.5L4 20l1-4.2A6.9 6.9 0 0 1 3.5 11C3.5 6.6 7 3.5 12 3.5Z'
        ),
        ink('first-line', 'M8 9.5h8'),
        ink('second-line', 'M8 12.8h5')
      ),
    ],
    motion: [
      pop('bubble', { scale: 1.08, rotate: -4 }, { origin: '10% 100%' }),
      write('first-line', { at: 110 }),
      write('second-line', { at: 200 }),
    ],
  },
  {
    name: 'MessageSquare',
    category: 'Communication',
    tags: ['chat', 'comment', 'feedback', '메시지', '의견'],
    nodes: [
      g('bubble', p('M20.5 15a2 2 0 0 1-2 2H8.2l-4.7 3.5V6a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2Z')),
    ],
    motion: [pop('bubble', { scale: 1.08, rotate: -4 }, { origin: '0% 100%' })],
  },
  {
    name: 'MessagesSquare',
    category: 'Communication',
    tags: ['conversation', 'thread', 'discussion', '대화', '스레드'],
    nodes: [
      g(
        'message',
        p(
          'M15.5 4H5.2a1.7 1.7 0 0 0-1.7 1.7V16l3.4-2.8h8.6a1.7 1.7 0 0 0 1.7-1.7V5.7A1.7 1.7 0 0 0 15.5 4Z'
        ),
        ink('words', 'M7.5 8.6h5.7')
      ),
      g('reply', p('M8 16.5v.3a1.7 1.7 0 0 0 1.7 1.7h7.4l3.4 2V10.2A1.7 1.7 0 0 0 19 8.5')),
    ],
    motion: [
      push('message', { y: -1.4 }, { hold: 90, spring: spring.bouncy }),
      push('reply', { y: 1.2, x: 0.6 }, { at: 110, hold: 90, spring: spring.bouncy }),
      write('words', { at: 60 }),
    ],
  },
  {
    name: 'Send',
    category: 'Communication',
    tags: ['submit', 'paper plane', 'share', '보내기', '전송'],
    nodes: [
      g(
        'plane',
        p(
          'M4.5 10.2 19 4.1a.7.7 0 0 1 .9.9l-6.1 14.5a.7.7 0 0 1-1.3 0l-2.3-5.7-5.7-2.3a.7.7 0 0 1 0-1.3Z'
        ),
        p('M10.2 13.8l5.4-5.4')
      ),
    ],
    // Out through the top-right corner, back in from the bottom-left.
    motion: [fly('plane', { x: 9, y: -9 }, { away: 160 })],
  },
  {
    name: 'Share2',
    category: 'Communication',
    tags: ['share', 'network', 'distribute', '공유', '네트워크'],
    nodes: [
      ink('upper-link', 'm8.2 10.6 7.6-4.2'),
      ink('lower-link', 'M8.2 13.4l7.6 4.2'),
      g('source', c(6, 12, 2.5)),
      g('upper', c(18, 5, 2)),
      g('lower', c(18, 19, 2)),
    ],
    // The signal leaves the source, travels both links, then lands on each node.
    motion: [
      pop('source', { scale: 1.25 }, { dip: 0.4 }),
      write('upper-link', { at: 70, spring: { duration: 300, bounce: 0 } }),
      write('lower-link', { at: 70, spring: { duration: 300, bounce: 0 } }),
      pop('upper', { scale: 1.3 }, { at: 180, dip: 0.3 }),
      pop('lower', { scale: 1.3 }, { at: 220, dip: 0.3 }),
    ],
  },
  {
    name: 'Mail',
    category: 'Communication',
    tags: ['email', 'inbox', 'letter', '메일', '편지'],
    nodes: [
      g('envelope', r(3.5, 5.5, 17, 13, 2)),
      g('flap', p('m4.2 7.2 6.9 5.2a1.5 1.5 0 0 0 1.8 0l6.9-5.2')),
    ],
    // The flap folds up over the top edge and drops back.
    motion: [
      push('flap', { scaleY: -0.55 }, { hold: 160, origin: '50% 0%', spring: spring.bouncy }),
      push('envelope', { y: 0.6 }, { at: 40, hold: 80 }),
    ],
  },
  {
    name: 'Megaphone',
    category: 'Communication',
    tags: ['announce', 'broadcast', 'marketing', '공지', '홍보'],
    nodes: [
      pivot(
        g(
          'horn',
          p(
            'M4.5 9.5h2.8l7.4-4.1a.9.9 0 0 1 1.3.8v11.6a.9.9 0 0 1-1.3.8l-7.4-4.1H4.5a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1Z'
          ),
          p('M7.3 14.5l1.3 5.2a.9.9 0 0 0 .9.7h.8a.6.6 0 0 0 .6-.8l-1.3-4.4')
        ),
        7.3,
        12
      ),
      g('near-wave', p('M19 10a3 3 0 0 1 0 4.5')),
      g('far-wave', p('M21 8a6 6 0 0 1 0 8.5')),
    ],
    motion: [
      push('horn', { rotate: -9 }, { hold: 110, spring: spring.bouncy }),
      enter('near-wave', { x: -1.5, opacity: 0 }, { at: 70, spring: spring.snappy }),
      enter('far-wave', { x: -2.5, opacity: 0 }, { at: 140, spring: spring.snappy }),
    ],
  },
]
