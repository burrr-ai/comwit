import { Suspense } from 'react'
import Link from 'next/link'
import { ReportPanel } from './report-panel'

// Server Component. With cacheComponents the heading and links are the static shell; reading
// `searchParams` inside the boundary makes it dynamic, so the report renders at request time.
// `.suspend()` resolves during that server render and the provider's `useServerInsertedHTML`
// inserts the result before the boundary chunk, so the browser hydrates without calling the
// query function again.
export default function SuspendPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  return (
    <main style={{ padding: 24, display: 'grid', gap: 16, maxWidth: 640 }}>
      <h1 style={{ margin: 0 }}>Streaming Suspense</h1>
      <p style={{ margin: 0 }}>
        <Link href="/">← Todo demo</Link> · <Link href="/suspend?id=alpha">alpha</Link> ·{' '}
        <Link href="/suspend?id=beta">beta</Link>
      </p>
      <Suspense fallback={<p data-testid="fallback">Rendering the report on the server…</p>}>
        <Report searchParams={searchParams} />
      </Suspense>
    </main>
  )
}

async function Report({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const { id = 'alpha' } = await searchParams
  return <ReportPanel id={id} />
}
