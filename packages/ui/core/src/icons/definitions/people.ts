import type { IconDefinition } from '../types'
import { c, cog, g, ink, p, pop, push, spring, turn, write } from './kit'

export const peopleIcons: readonly IconDefinition[] = [
  {
    name: 'UserRound',
    category: 'People',
    tags: ['profile', 'account', 'person', '프로필', '사용자'],
    nodes: [
      g('head', c(12, 7.5, 3.5)),
      g('shoulders', p('M5 20.5v-1.2a5.3 5.3 0 0 1 5.3-5.3h3.4a5.3 5.3 0 0 1 5.3 5.3v1.2')),
    ],
    motion: [
      push('head', { y: -1.8 }, { hold: 80, spring: spring.bouncy }),
      push('shoulders', { scaleY: 0.86 }, { hold: 60, origin: '50% 100%', spring: spring.bouncy }),
    ],
  },
  {
    name: 'Users',
    category: 'People',
    tags: ['team', 'members', 'group', '사용자', '팀'],
    nodes: [
      g('leader-head', c(9, 8, 3)),
      p('M3.5 20v-2.2A4.3 4.3 0 0 1 7.8 13.5h2.4a4.3 4.3 0 0 1 4.3 4.3V20'),
      g('companion-head', p('M15.2 5.3a3 3 0 0 1 0 5.4')),
      g('companion-shoulders', p('M17 13.7a4.2 4.2 0 0 1 3.5 4.1V20')),
    ],
    motion: [
      push('leader-head', { y: -1.7 }, { hold: 80, spring: spring.bouncy }),
      push('companion-head', { y: -1.5 }, { at: 100, hold: 80, spring: spring.bouncy }),
      push(
        'companion-shoulders',
        { scaleY: 0.88 },
        { at: 100, hold: 60, origin: '50% 100%', spring: spring.bouncy }
      ),
    ],
  },
  {
    name: 'UserPlus',
    category: 'People',
    tags: ['invite', 'add member', 'sign up', '초대', '멤버 추가'],
    nodes: [
      g('head', c(9.5, 7.8, 3.3)),
      p('M3.5 20.5v-1.2a5 5 0 0 1 5-5h2a5 5 0 0 1 5 5v1.2'),
      g('plus', p('M18.5 8v5.6'), p('M15.7 10.8h5.6')),
    ],
    motion: [
      turn('plus', { rotate: 90 }),
      push('head', { y: -1.6 }, { at: 60, hold: 80, spring: spring.bouncy }),
    ],
  },
  {
    name: 'UserCheck',
    category: 'People',
    tags: ['approved', 'verified member', 'active', '승인', '활성 사용자'],
    nodes: [
      g('head', c(9.5, 7.8, 3.3)),
      p('M3.5 20.5v-1.2a5 5 0 0 1 5-5h2a5 5 0 0 1 5 5v1.2'),
      ink('check', 'm15.5 11.8 2 2 3.5-3.8'),
    ],
    motion: [
      write('check', { spring: { duration: 340, bounce: 0 } }),
      push('head', { y: -1.6 }, { at: 60, hold: 80, spring: spring.bouncy }),
    ],
  },
  {
    name: 'UserMinus',
    category: 'People',
    tags: ['remove member', 'deactivate', 'leave', '멤버 제거', '비활성'],
    nodes: [
      g('head', c(9.5, 7.8, 3.3)),
      p('M3.5 20.5v-1.2a5 5 0 0 1 5-5h2a5 5 0 0 1 5 5v1.2'),
      g('minus', p('M15.7 10.8h5.6')),
    ],
    motion: [
      pop('minus', { scaleX: 1.2 }, { dip: 0.9 }),
      push('head', { y: -1.6 }, { at: 60, hold: 80, spring: spring.bouncy }),
    ],
  },
  {
    name: 'UserRoundCog',
    category: 'People',
    tags: ['account settings', 'manage user', 'role', '계정 설정', '사용자 관리'],
    nodes: [
      g('head', c(9.5, 7.5, 3.5)),
      p('M3 20.5v-1.2a5.3 5.3 0 0 1 5.3-5.3h3.2'),
      cog(17.2, 16.3),
    ],
    motion: [
      turn('cog', { rotate: 120 }, { spring: { duration: 620, bounce: 0.38 } }),
      push('head', { y: -1.6 }, { at: 60, hold: 80, spring: spring.bouncy }),
    ],
  },
]
