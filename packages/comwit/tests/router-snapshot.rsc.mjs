import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { createRouterSnapshot } from '@comwit/state/router-snapshot'

const require = createRequire(import.meta.url)
const commonJS = require('@comwit/state/router-snapshot')
const input = {
  pathname: '/projects/example',
  searchParams: { thread: 'server value', tag: ['one', 'two'], omitted: undefined },
}
const expected = '/projects/example?thread=server+value&tag=one&tag=two'
assert.equal(createRouterSnapshot(input), expected)
assert.equal(commonJS.createRouterSnapshot(input), expected)
console.log('Router snapshot ESM/CJS exports work under the react-server condition')
