import { Suspense } from 'react'
import Link from 'next/link'
import { ReportPanel } from './report-panel'

export const dynamic = 'force-dynamic'

// Server Component. The boundary streams once `.suspend()` resolves on the server; the provider's
// `useServerInsertedHTML` inserts the result before that chunk so the browser hydrates without
// calling the query function again.
export default async function SuspendPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>
}) {
  const { id = 'alpha' } = await searchParams

  return (
    <main style={{ padding: 24, display: 'grid', gap: 16, maxWidth: 640 }}>
      <h1 style={{ margin: 0 }}>Streaming Suspense</h1>
      <p style={{ margin: 0 }}>
        <Link href="/">← Todo demo</Link> · <Link href="/suspend?id=alpha">alpha</Link> ·{' '}
        <Link href="/suspend?id=beta">beta</Link>
      </p>
      <Suspense fallback={<p data-testid="fallback">Rendering report {id} on the server…</p>}>
        <ReportPanel id={id} />
      </Suspense>
    </main>
  )
}
