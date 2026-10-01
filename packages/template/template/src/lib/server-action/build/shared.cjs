/* oxlint-disable custom/kebab-case-filename, typescript/no-require-imports -- Turbopack loader entrypoints are CommonJS. */
'use strict'

const fs = require('node:fs')
const path = require('node:path')
const ts = require('typescript')

const ACTION_FILE_PATTERN =
  /src\/services\/[^/]+\/api\/[^/]+\/actions\/.*\.ts$/
const CREATE_ACTION_MODULES = new Set(['@/lib/utils', '@/lib/utils/action'])
const RESOLVE_ACTION_MODULES = new Set(['@/lib/utils', '@/lib/utils/action'])

function normalizePath(filePath) {
  return filePath.replace(/\\/g, '/')
}

function projectRelative(projectRoot, filePath) {
  return normalizePath(path.relative(projectRoot, filePath))
}

/** 파일 경로와 export 이름만으로 환경에 무관한 registry id를 만든다. */
function createActionId(projectRoot, filePath, exportName) {
  const relative = projectRelative(projectRoot, filePath)
  const match = relative.match(
    /^src\/services\/([^/]+)\/api\/([^/]+)\/actions\/(.+)\.ts$/,
  )
  if (!match) {
    throw new Error(`Unsupported Server Function path: ${relative}`)
  }
  return `${match[1]}/${match[2]}/${match[3]}#${exportName}`
}

function parseSource(filePath, source) {
  return ts.createSourceFile(
    filePath,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  )
}

/** createAction을 alias import한 경우까지 정확히 추적한다. */
function findCreateActionAliases(sourceFile) {
  const aliases = new Set()
  for (const statement of sourceFile.statements) {
    if (
      !ts.isImportDeclaration(statement) ||
      !CREATE_ACTION_MODULES.has(statement.moduleSpecifier.text)
    ) {
      continue
    }

    const bindings = statement.importClause?.namedBindings
    if (!bindings || !ts.isNamedImports(bindings)) continue

    for (const element of bindings.elements) {
      const importedName = element.propertyName?.text ?? element.name.text
      if (importedName === 'createAction') aliases.add(element.name.text)
    }
  }
  return aliases
}

function hasExportModifier(statement) {
  return statement.modifiers?.some(
    (modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword,
  )
}

/** 린트가 허용하는 `export const x = createAction(handler)` 목록을 읽는다. */
function getActionExports(filePath, source) {
  const sourceFile = parseSource(filePath, source)
  const aliases = findCreateActionAliases(sourceFile)
  const exports = []

  for (const statement of sourceFile.statements) {
    if (!ts.isVariableStatement(statement) || !hasExportModifier(statement)) {
      continue
    }

    for (const declaration of statement.declarationList.declarations) {
      const initializer = declaration.initializer
      if (
        !ts.isIdentifier(declaration.name) ||
        !initializer ||
        !ts.isCallExpression(initializer) ||
        !ts.isIdentifier(initializer.expression) ||
        !aliases.has(initializer.expression.text)
      ) {
        continue
      }

      if (initializer.arguments.length !== 1) {
        throw new Error(
          `${normalizePath(filePath)}: createAction must receive exactly one handler`,
        )
      }

      exports.push({
        exportName: declaration.name.text,
        calleeName: initializer.expression.text,
      })
    }
  }

  if (exports.length === 0) {
    throw new Error(`No createAction export found in ${normalizePath(filePath)}`)
  }
  return { sourceFile, aliases, exports }
}

function transpile(filePath, source) {
  const result = ts.transpileModule(source, {
    fileName: filePath,
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
      isolatedModules: true,
      removeComments: false,
    },
    reportDiagnostics: true,
  })

  const errors = result.diagnostics?.filter(
    (diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error,
  )
  if (errors?.length) {
    throw new Error(
      errors.map((diagnostic) => ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')).join('\n'),
    )
  }
  return result.outputText
}

/**
 * 소스의 `'use server'`는 작성 규약으로만 남긴다. 산출물에서는 Next/React directive 대신
 * `server-only` poison import로 바꿔 action 구현이 서버 graph 밖으로 새면 빌드를 실패시킨다.
 */
function replaceUseServerWithServerOnly(source) {
  return source.replace(
    /^(\uFEFF?\s*)?(['"])use server\2;?\s*/,
    (_match, prefix = '') => `${prefix}import 'server-only'\n\n`,
  )
}

function transformServerOnlyActionSource(filePath, source) {
  return transpile(filePath, replaceUseServerWithServerOnly(source))
}

function findResolveActionsAliases(sourceFile) {
  const aliases = new Set()
  for (const statement of sourceFile.statements) {
    if (
      !ts.isImportDeclaration(statement) ||
      !RESOLVE_ACTION_MODULES.has(statement.moduleSpecifier.text)
    ) {
      continue
    }

    const bindings = statement.importClause?.namedBindings
    if (!bindings || !ts.isNamedImports(bindings)) continue
    for (const element of bindings.elements) {
      const importedName = element.propertyName?.text ?? element.name.text
      if (importedName === 'resolveActions') aliases.add(element.name.text)
    }
  }
  return aliases
}

function propertyNameText(name, sourceFile) {
  if (ts.isIdentifier(name) || ts.isStringLiteral(name)) return name.text
  throw new Error(
    `Unsupported API property name in ${normalizePath(sourceFile.fileName)}: ${name.getText(sourceFile)}`,
  )
}

function resolveActionModuleFile(importerPath, moduleSpecifier) {
  const candidate = path.resolve(path.dirname(importerPath), moduleSpecifier)
  const files = [`${candidate}.ts`, path.join(candidate, 'index.ts')]
  const filePath = files.find(
    (file) =>
      fs.existsSync(file) && ACTION_FILE_PATTERN.test(normalizePath(file)),
  )
  if (!filePath) {
    throw new Error(
      `Unsupported API action module "${moduleSpecifier}" in ${normalizePath(importerPath)}`,
    )
  }
  return filePath
}

/** `./actions` barrel의 공개 이름을 최종 createAction 구현 파일까지 추적한다. */
function resolveActionBarrelExport(barrelPath, exportName, seen = new Set()) {
  const normalized = normalizePath(barrelPath)
  const visitKey = `${normalized}#${exportName}`
  if (seen.has(visitKey)) {
    throw new Error(`Circular API action barrel export: ${visitKey}`)
  }
  seen.add(visitKey)

  const source = fs.readFileSync(barrelPath, 'utf8')
  try {
    const direct = getActionExports(barrelPath, source).exports.find(
      (entry) => entry.exportName === exportName,
    )
    if (direct) return { filePath: barrelPath, exportName }
  } catch (error) {
    if (!String(error?.message).startsWith('No createAction export found in ')) {
      throw error
    }
  }

  const sourceFile = parseSource(barrelPath, source)
  for (const statement of sourceFile.statements) {
    if (!ts.isExportDeclaration(statement) || !statement.moduleSpecifier) {
      continue
    }
    const targetPath = resolveActionModuleFile(
      barrelPath,
      statement.moduleSpecifier.text,
    )
    if (statement.exportClause && ts.isNamedExports(statement.exportClause)) {
      for (const element of statement.exportClause.elements) {
        if (element.name.text !== exportName) continue
        return resolveActionBarrelExport(
          targetPath,
          element.propertyName?.text ?? element.name.text,
          seen,
        )
      }
      continue
    }
    if (!statement.exportClause) {
      try {
        return resolveActionBarrelExport(targetPath, exportName, seen)
      } catch (error) {
        if (
          !String(error?.message).startsWith(
            'API action barrel does not export ',
          )
        ) {
          throw error
        }
      }
    }
  }

  throw new Error(
    `API action barrel does not export "${exportName}": ${normalized}`,
  )
}

/** API index의 public method 이름과 실제 action export를 연결한다. */
function getApiDefinitions(projectRoot, filePath, source) {
  const sourceFile = parseSource(filePath, source)
  const resolveAliases = findResolveActionsAliases(sourceFile)
  const actionImports = new Map()
  const passthroughExports = []

  for (const statement of sourceFile.statements) {
    if (ts.isExportDeclaration(statement)) {
      passthroughExports.push(statement.getText(sourceFile))
      continue
    }
    if (
      !ts.isImportDeclaration(statement) ||
      !(
        statement.moduleSpecifier.text === './actions' ||
        statement.moduleSpecifier.text.startsWith('./actions/')
      )
    ) {
      continue
    }

    const bindings = statement.importClause?.namedBindings
    if (!bindings || !ts.isNamedImports(bindings)) {
      throw new Error(
        `API action imports must be named imports: ${normalizePath(filePath)}`,
      )
    }

    for (const element of bindings.elements) {
      const importedName = element.propertyName?.text ?? element.name.text
      const resolved =
        statement.moduleSpecifier.text === './actions'
          ? resolveActionBarrelExport(
              resolveActionModuleFile(filePath, './actions'),
              importedName,
            )
          : {
              filePath: resolveActionModuleFile(
                filePath,
                statement.moduleSpecifier.text,
              ),
              exportName: importedName,
            }
      actionImports.set(element.name.text, {
        filePath: resolved.filePath,
        exportName: resolved.exportName,
      })
    }
  }

  const apiExports = []
  for (const statement of sourceFile.statements) {
    if (!ts.isVariableStatement(statement) || !hasExportModifier(statement)) {
      continue
    }
    for (const declaration of statement.declarationList.declarations) {
      const initializer = declaration.initializer
      if (
        !ts.isIdentifier(declaration.name) ||
        !initializer ||
        !ts.isCallExpression(initializer) ||
        !ts.isIdentifier(initializer.expression) ||
        !resolveAliases.has(initializer.expression.text) ||
        initializer.arguments.length !== 1 ||
        !ts.isObjectLiteralExpression(initializer.arguments[0])
      ) {
        continue
      }

      const methods = []
      for (const property of initializer.arguments[0].properties) {
        let publicName
        let localName
        if (ts.isShorthandPropertyAssignment(property)) {
          publicName = property.name.text
          localName = property.name.text
        } else if (
          ts.isPropertyAssignment(property) &&
          ts.isIdentifier(property.initializer)
        ) {
          publicName = propertyNameText(property.name, sourceFile)
          localName = property.initializer.text
        } else {
          throw new Error(
            `Unsupported resolveActions property in ${normalizePath(filePath)}: ${property.getText(sourceFile)}`,
          )
        }

        const imported = actionImports.get(localName)
        if (!imported) {
          throw new Error(
            `resolveActions method "${localName}" is not imported from ./actions in ${normalizePath(filePath)}`,
          )
        }
        methods.push({
          publicName,
          id: createActionId(
            projectRoot,
            imported.filePath,
            imported.exportName,
          ),
        })
      }
      apiExports.push({ exportName: declaration.name.text, methods })
    }
  }

  if (apiExports.length === 0) {
    throw new Error(`No resolveActions export found in ${normalizePath(filePath)}`)
  }
  return { apiExports, passthroughExports }
}

function transformApiIndexSource(projectRoot, filePath, source) {
  const { apiExports, passthroughExports } = getApiDefinitions(
    projectRoot,
    filePath,
    source,
  )
  const lines = []

  lines.push(
    "import { resolveCompiledActions } from '#comwit-server-fn-runtime'",
  )
  lines.push('', ...passthroughExports, '')

  for (const apiExport of apiExports) {
    lines.push(
      `export const ${apiExport.exportName} = resolveCompiledActions({`,
    )
    for (const method of apiExport.methods) {
      lines.push(
        `  ${JSON.stringify(method.publicName)}: ${JSON.stringify(method.id)},`,
      )
    }
    lines.push('})', '')
  }

  return transpile(filePath, lines.join('\n'))
}

function findActionFiles(directory) {
  const files = []
  if (!fs.existsSync(directory)) return files

  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const filePath = path.join(directory, entry.name)
    if (entry.isDirectory()) {
      files.push(...findActionFiles(filePath))
    } else if (
      entry.isFile() &&
      ACTION_FILE_PATTERN.test(normalizePath(filePath))
    ) {
      files.push(filePath)
    }
  }
  return files.sort()
}

/** 전체 action set을 정적 dynamic-import allowlist로 만든다. */
function createManifestSource(projectRoot, files) {
  const entries = new Map()
  const sourceRoot = path.join(projectRoot, 'src')

  for (const filePath of files) {
    const source = fs.readFileSync(filePath, 'utf8')
    let exports
    try {
      exports = getActionExports(filePath, source).exports
    } catch (error) {
      if (
        path.basename(filePath) === 'index.ts' &&
        String(error?.message).startsWith('No createAction export found in ')
      ) {
        continue
      }
      throw error
    }
    const modulePath = `@/${normalizePath(path.relative(sourceRoot, filePath)).replace(/\.ts$/, '')}`

    for (const { exportName } of exports) {
      const id = createActionId(projectRoot, filePath, exportName)
      const existing = entries.get(id)
      if (existing) {
        throw new Error(
          `Duplicate Server Function id "${id}": ${existing.filePath} and ${filePath}`,
        )
      }
      entries.set(id, { filePath, modulePath })
    }
  }

  const rows = [...entries]
    .map(
      ([id, entry]) =>
        `  [${JSON.stringify(id)}, async () => (await import(${JSON.stringify(entry.modulePath)}))[${JSON.stringify(id.slice(id.lastIndexOf('#') + 1))}], ${JSON.stringify(projectRelative(projectRoot, entry.filePath))}],`,
    )
    .join('\n')

  return [
    '// Generated in memory by withServerFn. Do not edit the stub manifest.',
    'const entries = [',
    rows,
    ']',
    'const manifest = Object.create(null)',
    'const sources = Object.create(null)',
    'for (const [id, loadAction, source] of entries) {',
    '  if (manifest[id]) {',
    '    throw new Error(`Duplicate Server Function id "${id}": ${sources[id]} and ${source}`)',
    '  }',
    '  manifest[id] = loadAction',
    '  sources[id] = source',
    '}',
    'export const serverFnManifest = Object.freeze(manifest)',
    '',
  ].join('\n')
}

module.exports = {
  createActionId,
  createManifestSource,
  findActionFiles,
  getApiDefinitions,
  getActionExports,
  transformApiIndexSource,
  transformServerOnlyActionSource,
}
