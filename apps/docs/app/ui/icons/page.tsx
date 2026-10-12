import type { Metadata } from 'next'
import { IconGallery } from './icon-gallery'
import './icons.css'

export const metadata: Metadata = {
  title: 'Icons',
  description:
    'Original Comwit icons, drawn on a 24px grid with a little movement. Browse, preview, and copy React examples.',
}

export default function IconsPage() {
  return <IconGallery />
}
