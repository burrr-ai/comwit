import { localizeMetadata } from '@/i18n/metadata'

import { Copy } from '@/i18n/copy'
import type { Metadata } from 'next'
import { Gallery } from '../_components/gallery'

const metadata: Metadata = {
  title: 'Components',
  description: 'Every Comwit UI component, live. Mobile app chrome and glass first, basics last.',
}

export default function ComponentsPage() {
  return (
    <div>
      <header className="max-w-2xl">
        <h1 className="text-display-lg text-foreground">
          <Copy id="text158" />
        </h1>
        <p className="mt-3 text-body text-soft-foreground">
          <Copy id="text247" />{' '}
        </p>
      </header>
      <Gallery />
    </div>
  )
}

export async function generateMetadata() {
  return localizeMetadata(metadata)
}
