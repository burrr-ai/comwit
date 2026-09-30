/* oxlint-disable custom/kebab-case-filename, typescript/no-require-imports -- Turbopack loader entrypoints are CommonJS. */
'use strict'

const { transformApiIndexSource } = require('./shared.cjs')

module.exports = function indexLoader(source) {
  this.cacheable?.(true)
  const options = this.getOptions?.() ?? this.query ?? {}
  return transformApiIndexSource(
    options.projectRoot ?? process.cwd(),
    this.resourcePath,
    source,
  )
}
