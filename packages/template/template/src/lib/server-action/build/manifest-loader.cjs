/* oxlint-disable custom/kebab-case-filename, typescript/no-require-imports -- Turbopack loader entrypoints are CommonJS. */
'use strict'

const path = require('node:path')
const {
  createManifestSource,
  findActionFiles,
} = require('./shared.cjs')

module.exports = function manifestLoader() {
  this.cacheable?.(true)
  const options = this.getOptions?.() ?? this.query ?? {}
  const projectRoot = options.projectRoot ?? process.cwd()
  const servicesRoot = path.join(projectRoot, 'src/services')

  // dev 중 action 파일 추가/삭제도 manifest 모듈을 무효화하도록 디렉터리를 감시한다.
  this.addContextDependency?.(servicesRoot)

  const files = findActionFiles(servicesRoot)
  for (const file of files) this.addDependency?.(file)
  return createManifestSource(projectRoot, files)
}
