import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFile } from 'node:fs/promises'
import { transform } from 'esbuild'

const source = await readFile(new URL('../../src/lib/service-worker/document-cache.ts', import.meta.url), 'utf8')
const { code } = await transform(source, { loader: 'ts', format: 'esm' })
const { cacheableDocument } = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`)
const complete = '<!doctype html><html><body>Ready</body></html>'
const headers = { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=3600' }

test('complete public HTML remains readable after the cache check', async () => {
  const response = new Response(complete, { headers })
  assert.equal(await cacheableDocument(response), response)
  assert.equal(response.bodyUsed, false)
  assert.equal(await response.text(), complete)
})

test('a 200 response containing only the suspended shell is not cached', async () => {
  const response = new Response('<html><body><!--$?--><template id="B:0"></template>', { headers })
  assert.equal(await cacheableDocument(response), null)
  assert.equal(response.bodyUsed, false)
})

for (const cacheControl of ['private, max-age=3600', 'no-store', 'public, no-cache', 'public, max-age=0, must-revalidate', 'public, max-age="0"', '']) {
  test(`does not cache a document with cache-control ${JSON.stringify(cacheControl)}`, async () => {
    assert.equal(await cacheableDocument(new Response(complete, { headers: { ...headers, 'cache-control': cacheControl } })), null)
  })
}

test('non-HTML, failed, and interrupted responses cannot become cached documents', async () => {
  assert.equal(await cacheableDocument(new Response(complete, { status: 500, headers })), null)
  assert.equal(await cacheableDocument(new Response(complete, { headers: { ...headers, 'content-type': 'text/x-component' } })), null)
  const interrupted = new Response(new ReadableStream({ start(controller) { controller.error(new Error('stream interrupted')) } }), { headers })
  assert.equal(await cacheableDocument(interrupted), null)
})
