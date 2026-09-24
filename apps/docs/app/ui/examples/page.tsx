import Link from 'next/link'
import { UiShowcase } from '../_components/showcase'
import { ExampleGallery } from '../_components/example-gallery'

export const metadata = { title: 'Examples' }
export default function Examples() {
  return (
    <article>
      <h1 className="text-display-md">Examples</h1>
      <p className="mt-3 text-body text-muted-foreground">A few pieces, working together.</p>
      <h2 className="mt-10 mb-4 text-title-md">Workspace settings</h2>
      <div className="showcase-frame">
        <UiShowcase />
      </div>
      <h2 className="mt-12 mb-5 text-title-md">Forms</h2>
      <ExampleGallery name="form" />
      <h2 className="mt-12 mb-5 text-title-md">Data tables</h2>
      <ExampleGallery name="data-table" />
      <Link
        href="/ui/components"
        className="mt-8 inline-block text-sm underline underline-offset-4"
      >
        All components
      </Link>
    </article>
  )
}
