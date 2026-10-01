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
 * Server Function의 client/server 변환과 가상 manifest 생성을 Next config에 연결한다.
 * 호출자는 loader 경로나 Turbopack 조건을 직접 관리하지 않는다.
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
        // `*`로 후보를 받은 뒤 project-relative path 조건으로 정확한 파일만 고른다.
        // Turbopack의 rule key glob은 slash 유무에 따라 기준이 달라져 이 형태가 안정적이다.
        '*': [
          ...existingWildcardRules,
          {
            // 소스의 'use server'를 산출물에서 server-only import로 바꾼다. 이후 browser
            // action loader가 실행되면 handler와 이 import를 함께 함수 id 참조로 치환한다.
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
