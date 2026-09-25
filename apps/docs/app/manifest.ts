import type { MetadataRoute } from 'next'

// 홈 화면에 추가했을 때의 이름과 아이콘. 아이콘은 scripts/gen-icons.mjs 산출물.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Comwit — State & UI',
    short_name: 'Comwit',
    description: 'The open-source State and UI libraries behind comwit.io templates.',
    start_url: '/',
    background_color: '#dcfa54',
    theme_color: '#dcfa54',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
