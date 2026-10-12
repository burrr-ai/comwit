import { readdirSync, readFileSync } from 'node:fs'
import { resolve, join } from 'node:path'
import ts from 'typescript'

const directory = process.argv[2]
if (!directory) throw new Error('Usage: node scripts/audit-usage.mjs /path/to/app/src')
const counts = new Map()
let files = 0
function visit(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (['node_modules', '.next', '.git', 'dist'].includes(entry.name)) continue
    const path = join(directory, entry.name)
    if (entry.isDirectory()) visit(path)
    else if (/\.[jt]sx?$/.test(entry.name)) {
      const source = ts.createSourceFile(
        path,
        readFileSync(path, 'utf8'),
        ts.ScriptTarget.Latest,
        true
      )
      let usesLucide = false
      for (const statement of source.statements) {
        if (!ts.isImportDeclaration(statement) || statement.moduleSpecifier.text !== 'lucide-react')
          continue
        const clause = statement.importClause
        if (
          !clause ||
          clause.isTypeOnly ||
          !clause.namedBindings ||
          !ts.isNamedImports(clause.namedBindings)
        )
          continue
        for (const element of clause.namedBindings.elements) {
          const name = (element.propertyName ?? element.name).text
          if (element.isTypeOnly || ['LucideIcon', 'LucideProps', 'IconNode'].includes(name))
            continue
          counts.set(name, (counts.get(name) ?? 0) + 1)
          usesLucide = true
        }
      }
      if (usesLucide) files++
    }
  }
}
visit(resolve(directory))
console.log(
  JSON.stringify(
    {
      source:
        'Comwit application src; named runtime imports from lucide-react (not rendered instance counts)',
      files,
      distinctImports: counts.size,
      totalImports: [...counts.values()].reduce((a, b) => a + b, 0),
      icons: Object.fromEntries(
        [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      ),
    },
    null,
    2
  )
)
