import type { MetadataRoute } from 'next'
import { PWA_CONFIG } from '@/lib/pwa'

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/', scope: '/', start_url: PWA_CONFIG.startUrl,
    name: PWA_CONFIG.name, short_name: PWA_CONFIG.shortName,
    description: PWA_CONFIG.description, display: 'standalone', lang: 'ko',
    background_color: PWA_CONFIG.backgroundColor, theme_color: PWA_CONFIG.themeColor,
    icons: [
      { src: '/pwa/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/pwa/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/pwa/icon-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      { src: '/pwa/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  }
}
