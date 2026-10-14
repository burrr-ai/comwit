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

  // Watch directories so adding/removing action files in development invalidates the manifest.
  this.addContextDependency?.(servicesRoot)

  const files = findActionFiles(servicesRoot)
  for (const file of files) this.addDependency?.(file)
  return createManifestSource(projectRoot, files)
}
