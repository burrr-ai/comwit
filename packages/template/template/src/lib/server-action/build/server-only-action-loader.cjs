/* oxlint-disable custom/kebab-case-filename, typescript/no-require-imports -- Turbopack loader entrypoints are CommonJS. */
'use strict'

const { transformServerOnlyActionSource } = require('./shared.cjs')

module.exports = function serverOnlyActionLoader(source) {
  this.cacheable?.(true)
  return transformServerOnlyActionSource(this.resourcePath, source)
}
