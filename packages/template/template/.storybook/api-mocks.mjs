import { existsSync } from 'node:fs'
import path from 'node:path'

/**
 * Replace API entry points before Vite can load their server implementations.
 * @param {string} root
 * @returns {import('vite').Plugin}
 */
export function apiMocks(root) {
  const src = path.join(root, 'src')
  return {
    name: 'comwit-storybook-api-mocks',
    enforce: 'pre',
    resolveId(source, importer) {
      const clean = source.split('?')[0]
      const absolute = clean.startsWith('@/') ? path.join(src, clean.slice(2))
        : clean.startsWith('.') && importer ? path.resolve(path.dirname(importer.split('?')[0]), clean)
          : clean.startsWith('/@fs/') ? clean.slice(4) : clean
      if (!path.isAbsolute(absolute)) return

      const relative = path.relative(src, absolute).split(path.sep).join('/')
      const api = relative.match(/^services\/([^/]+)\/api\/([^/]+)(?:\/index(?:\.ts)?)?\/?$/)
      if (api) {
        const mock = path.join(root, '.storybook/mocks/api', `${api[1]}-${api[2]}.ts`)
        if (!existsSync(mock)) {
          throw new Error(`Storybook API mock required: ${api[1]}/${api[2]} → ${mock}`)
        }
        return mock
      }

      if (/^server(?:\/|$)/.test(relative) || /^services\/[^/]+\/api(?:\/|$)/.test(relative)) {
        throw new Error(`Server implementation reached Storybook; mock the API index: ${source}`)
      }
      if (/^lib\/auth-client(?:\/|\.|$)/.test(relative)) {
        throw new Error(`Storybook auth mock required before connecting authentication: ${source}`)
      }
    },
  }
}
