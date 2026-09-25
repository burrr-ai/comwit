// Isomorphic on purpose: `.suspend()` runs this during the server render and, when the result was
// not streamed, again in the browser. A real app would call a Route Handler with an absolute URL.

export type Report = {
  id: string
  title: string
  /** Where the query function ran. Streaming hydration keeps this at 'server' after mount. */
  runtime: 'server' | 'browser'
  generatedAt: string
}

let sequence = 0

export async function getReport(id: string): Promise<Report> {
  await new Promise((resolve) => setTimeout(resolve, 800))
  sequence += 1
  return {
    id,
    title: `Report ${id} #${sequence}`,
    runtime: typeof window === 'undefined' ? 'server' : 'browser',
    generatedAt: new Date().toISOString(),
  }
}
