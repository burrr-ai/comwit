import type { IconDefinition } from '../types'
import { c, g, ink, p, pivot, pop, push, spring, swing, turn, write } from './kit'

const folderBack = 'M3.5 10V6a1.5 1.5 0 0 1 1.5-1.5h4l2.4 2.7H19a1.5 1.5 0 0 1 1.5 1.5V10'
const folderFront = 'M3.5 10h17v8a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 18Z'
const folder =
  'M3.5 18V6A1.5 1.5 0 0 1 5 4.5h4l2.4 2.7H19a1.5 1.5 0 0 1 1.5 1.5V18a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 18Z'
const tray = 'M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3'

export const fileIcons: readonly IconDefinition[] = [
  {
    name: 'FileText',
    category: 'Files',
    tags: ['document', 'page', 'note', '문서', '파일'],
    nodes: [
      p(
        'M14 3.5H6.7A1.7 1.7 0 0 0 5 5.2v13.6a1.7 1.7 0 0 0 1.7 1.7h10.6a1.7 1.7 0 0 0 1.7-1.7V8.5L14 3.5Z'
      ),
      g('fold', p('M14 3.5v3.5A1.5 1.5 0 0 0 15.5 8.5H19')),
      ink('line-one', 'M8.5 12h7'),
      ink('line-two', 'M8.5 15.5h5'),
    ],
    motion: [
      push('fold', { scale: 0.55 }, { hold: 120, origin: '100% 0%', spring: spring.bouncy }),
      write('line-one', { at: 60 }),
      write('line-two', { at: 160 }),
    ],
  },
  {
    name: 'Folder',
    category: 'Files',
    tags: ['directory', 'collection', 'project', '폴더', '디렉터리'],
    nodes: [g('back', p(folderBack)), g('front', p(folderFront))],
    // The front panel tips forward on its bottom edge, as a folder opening.
    motion: [
      push(
        'front',
        { skewX: -16, scaleY: 0.84 },
        { hold: 150, origin: '50% 100%', spring: spring.bouncy }
      ),
      push('back', { y: -0.7 }, { at: 40, hold: 110 }),
    ],
  },
  {
    name: 'FolderOpen',
    category: 'Files',
    tags: ['directory', 'browse', 'open', '폴더', '열기'],
    nodes: [
      g('back', p('M3.5 18V6A1.5 1.5 0 0 1 5 4.5h4l2.4 2.7H17a1.5 1.5 0 0 1 1.5 1.5v2')),
      g(
        'front',
        p(
          'M3.5 18l2.4-6.3a1.5 1.5 0 0 1 1.4-1h13a.9.9 0 0 1 .8 1.3l-2.5 6.5a1.5 1.5 0 0 1-1.4 1H5A1.5 1.5 0 0 1 3.5 18Z'
        )
      ),
    ],
    motion: [
      push(
        'front',
        { skewX: 12, scaleY: 0.82 },
        { hold: 150, origin: '50% 100%', spring: spring.bouncy }
      ),
      push('back', { y: -0.6 }, { at: 40, hold: 110 }),
    ],
  },
  {
    name: 'FolderKanban',
    category: 'Files',
    tags: ['board', 'project', 'workflow', '보드', '프로젝트'],
    nodes: [
      p(folder),
      g('first', p('M8.5 11v4.5')),
      g('second', p('M12 11v2.2')),
      g('third', p('M15.5 11v5.2')),
    ],
    motion: ['first', 'second', 'third'].map((part, index) =>
      push(
        part,
        { scaleY: [0.4, 2, 0.5][index] },
        { at: index * 60, hold: 110, origin: '50% 0%', spring: spring.bouncy }
      )
    ),
  },
  {
    name: 'FolderGit2',
    category: 'Files',
    tags: ['repository', 'git', 'source', '저장소', '깃'],
    nodes: [
      p(folder),
      ink('upstream', 'M12 9.6v2.6'),
      ink('downstream', 'M12 15.8v2.2'),
      g('commit', c(12, 14, 1.8)),
    ],
    motion: [
      write('upstream', { spring: { duration: 260, bounce: 0 } }),
      pop('commit', { scale: 1.45 }, { at: 90, dip: 0.3 }),
      write('downstream', { at: 220, spring: { duration: 260, bounce: 0 } }),
    ],
  },
  {
    name: 'Download',
    category: 'Files',
    tags: ['save', 'export', 'fetch', '다운로드', '받기'],
    nodes: [
      g('tray', p(tray)),
      g('arrow', p('M12 4v11'), p('M7.5 10.5l3.8 3.8a1 1 0 0 0 1.4 0l3.8-3.8')),
    ],
    // The arrow drops into the tray; the tray gives under it.
    motion: [
      push('arrow', { y: 3 }, { hold: 100, spring: spring.bouncy }),
      push('tray', { scaleY: 0.78 }, { at: 90, hold: 70, origin: '50% 100%' }),
    ],
  },
  {
    name: 'Upload',
    category: 'Files',
    tags: ['import', 'attach', 'send', '업로드', '올리기'],
    nodes: [
      g('tray', p(tray)),
      g('arrow', p('M12 15V4'), p('M7.5 8.5l3.8-3.8a1 1 0 0 1 1.4 0l3.8 3.8')),
    ],
    // The tray pushes off and the arrow springs up from it.
    motion: [
      push('tray', { scaleY: 0.78 }, { hold: 60, origin: '50% 100%' }),
      push('arrow', { y: -2.8 }, { at: 50, hold: 100, spring: spring.bouncy }),
    ],
  },
  {
    name: 'CloudUpload',
    category: 'Files',
    tags: ['cloud', 'backup', 'sync', '클라우드', '업로드'],
    nodes: [
      g(
        'cloud',
        p('M8 18H6.8a3.8 3.8 0 0 1-.5-7.6 5.8 5.8 0 0 1 11.3-1.1A4.4 4.4 0 0 1 17.4 18H16')
      ),
      g('arrow', p('M12 12.5v8'), p('m8.8 15.5 2.5-2.6a1 1 0 0 1 1.4 0l2.5 2.6')),
    ],
    motion: [
      push('arrow', { y: -2.6 }, { hold: 100, spring: spring.bouncy }),
      pop('cloud', { scale: 1.06 }, { at: 60, dip: 0.5 }),
    ],
  },
  {
    name: 'ImagePlus',
    category: 'Files',
    tags: ['photo', 'add image', 'upload', '이미지', '사진'],
    nodes: [
      p('M20.5 12.2v6.3a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2v-13a2 2 0 0 1 2-2h6.3'),
      g('sun', c(8.5, 8.5, 1.4)),
      p('m3.5 17 4.2-4.2a1.2 1.2 0 0 1 1.7 0l3 3 2-2a1.2 1.2 0 0 1 1.7 0l4.4 4.4'),
      g('plus', p('M14 7h7'), p('M17.5 3.5v7')),
    ],
    motion: [
      turn('plus', { rotate: 90 }),
      push('sun', { y: -1.8 }, { at: 80, hold: 100, spring: spring.bouncy }),
    ],
  },
  {
    name: 'Paperclip',
    category: 'Files',
    tags: ['attach', 'attachment', 'clip', '첨부', '클립'],
    nodes: [
      pivot(
        g(
          'clip',
          p(
            'M20 11.4l-7.8 7.8a5 5 0 0 1-7.1-7.1l8.3-8.3a3.3 3.3 0 0 1 4.7 4.7l-8.3 8.3a1.7 1.7 0 0 1-2.4-2.4l7.6-7.6'
          )
        ),
        13,
        11
      ),
    ],
    motion: [swing('clip', { rotate: 12 }, { beats: 4, interval: 100, spring: spring.wobbly })],
  },
]
