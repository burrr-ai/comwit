import type { NextConfig } from 'next'
import { fileURLToPath } from 'node:url'

const indexLoader = fileURLToPath(
  new URL('./build/index-loader.cjs', import.meta.url),
)
const manifestLoader = fileURLToPath(
  new URL('./build/manifest-loader.cjs', import.meta.url),
)
const serverOnlyLoader = fileURLToPath(
  new URL('./build/server-only-action-loader.cjs', import.meta.url),
)

/**
 * Connect Server Function client/server transforms and virtual manifest generation to Next config.
 * Callers do not manage loader paths or Turbopack conditions directly.
 */
export function withServerFn(config: NextConfig): NextConfig {
  const projectRoot = process.cwd()
  const wildcardRule = config.turbopack?.rules?.['*']
  const existingWildcardRules = wildcardRule
    ? Array.isArray(wildcardRule)
      ? wildcardRule
      : [wildcardRule]
    : []

  return {
    ...config,
    turbopack: {
      ...config.turbopack,
      rules: {
        ...config.turbopack?.rules,
        // Receive candidates with '*' and select exact files using project-relative path conditions.
        // This avoids Turbopack rule-key glob semantics changing depending on whether a slash is present.
        '*': [
          ...existingWildcardRules,
          {
            // Replace source 'use server' with a server-only import in output. The browser
            // action loader then replaces the handler and import with a function-ID reference.
            condition: {
              path: /src\/services\/[^/]+\/api\/[^/]+\/actions\/.*\.ts$/,
            },
            loaders: [serverOnlyLoader],
            as: '*.js',
          },
          {
            condition: {
              all: [
                {
                  path: /src\/services\/[^/]+\/api\/[^/]+\/index\.ts$/,
                },
                { content: /\bresolveActions\s*\(/ },
              ],
            },
            loaders: [
              {
                loader: indexLoader,
                options: { projectRoot },
              },
            ],
            as: '*.js',
          },
          {
            condition: {
              all: [
                { not: 'browser' },
                { path: /src\/lib\/server-action\/manifest\.ts$/ },
              ],
            },
            loaders: [
              {
                loader: manifestLoader,
                options: { projectRoot },
              },
            ],
            as: '*.js',
          },
        ],
      },
    },
  }
}
