import type { Metadata, Viewport } from 'next'
import { PWA_CONFIG } from './config'

/** App-service metadata: keep the root's existing SEO/title configuration. */
export const pwaMetadata: Metadata = {
  applicationName: PWA_CONFIG.name,
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, title: PWA_CONFIG.shortName, statusBarStyle: 'black-translucent' },
  icons: { apple: [{ url: '/pwa/apple-icon.png', sizes: '180x180', type: 'image/png' }] },
}

export const pwaViewport: Viewport = {
  width: 'device-width', initialScale: 1, viewportFit: 'cover',
  themeColor: PWA_CONFIG.themeColor,
}
