import type { Metadata } from 'next'
import { Gallery } from '../_components/gallery'

export const metadata: Metadata = {
  title: 'Components',
  description: 'Every Comwit UI component, live. Mobile app chrome and glass first, basics last.',
}

export default function ComponentsPage() {
  return (
    <div>
      <header className="max-w-2xl">
        <h1 className="text-display-lg text-foreground">Components</h1>
        <p className="mt-3 text-body text-soft-foreground">
          Every component, live. Open Code on any of them to copy the source or the install command.
        </p>
      </header>
      <Gallery />
    </div>
  )
}
