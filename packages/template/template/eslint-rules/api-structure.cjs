/**
 * ESLint rule to enforce API domain folder structure
 *
 * Required structure for src/api/{domain}/:
 *   ├── index.ts         # Must import from actions/ and re-export types
 *   ├── types.ts         # API method signatures
 *   └── actions/         # Server actions directory
 *       └── *.ts         # Action files
 */

const fs = require('fs');
const path = require('path');

const REQUIRED_FILES = ['types.ts'];
const REQUIRED_DIRS = ['actions'];

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce API domain folder structure',
      category: 'Best Practices',
      recommended: true,
    },
    messages: {
      missingFile: 'API domain "{{domain}}" is missing required file: {{file}} (see src/services/api.ai.md)',
      missingDir: 'API domain "{{domain}}" is missing required directory: {{dir}} (see src/services/api.ai.md)',
      emptyActionsDir: 'API domain "{{domain}}" has empty actions directory - add at least one action file (see src/services/api.ai.md)',
      missingTypesExport: 'API domain "{{domain}}" index.ts must re-export from ./types (add: export type { ... } from \'./types\') (see src/services/api.ai.md)',
      missingActionsImport: 'API domain "{{domain}}" index.ts must import from ./actions/ and export as object (see src/services/api.ai.md)',
      missingResolveActions: 'API domain "{{domain}}" index.ts must export via resolveActions() (see src/services/api.ai.md)',
      noDirectActionReExport: 'API domain "{{domain}}" 에서 action을 직접 re-export 금지. resolveActions()로 감싸서 export하세요 (see src/services/api.ai.md)',
      noUnwrappedExport: 'API domain "{{domain}}" 에서 resolveActions() 없이 export 금지. resolveActions()로 감싸서 export하세요 (see src/services/api.ai.md)',
    },
    schema: [],
  },

  create(context) {
    const filename = context.filename || context.getFilename();

    // Normalize path separators
    const normalizedPath = filename.replace(/\\/g, '/');

    // Only check index.ts files in src/api/{domain}/
    const apiMatch = normalizedPath.match(/src\/services\/[^/]+\/api\/([^/]+)\/index\.ts$/);
    if (!apiMatch) return {};

    const domain = apiMatch[1];

    // Skip dotfiles and internal folders (starting with _)
    if (domain.startsWith('.') || domain.startsWith('_')) return {};

    const domainPath = path.dirname(filename);
    let hasTypesExport = false;
    let hasActionsImport = false;
    let hasResolveActions = false;

    return {
      // Check for export from './types'
      ExportAllDeclaration(node) {
        if (node.source && node.source.value === './types') {
          hasTypesExport = true;
        }
      },
      ExportNamedDeclaration(node) {
        // export * from './types' or export type { ... } from './types'
        if (node.source && node.source.value === './types') {
          hasTypesExport = true;
          return;
        }

        // Forbid: export { X } from './actions/...'
        if (node.source && node.source.value.startsWith('./actions')) {
          context.report({
            node,
            messageId: 'noDirectActionReExport',
            data: { domain },
          });
          return;
        }

        // Check exported variable declarations
        if (node.declaration?.type === 'VariableDeclaration') {
          for (const declarator of node.declaration.declarations) {
            const init = declarator.init;
            // resolveActions(...) — OK
            if (
              init?.type === 'CallExpression' &&
              init.callee?.type === 'Identifier' &&
              init.callee.name === 'resolveActions'
            ) {
              hasResolveActions = true;
            } else if (init) {
              // Any other export (raw object, identifier, etc.) — ERROR
              context.report({
                node: declarator,
                messageId: 'noUnwrappedExport',
                data: { domain },
              });
            }
          }
        }
      },

      // Check for import from './actions/*'
      ImportDeclaration(node) {
        if (node.source && node.source.value.startsWith('./actions')) {
          hasActionsImport = true;
        }
      },

      'Program:exit'(node) {
        // Check required files
        for (const file of REQUIRED_FILES) {
          const filePath = path.join(domainPath, file);
          if (!fs.existsSync(filePath)) {
            context.report({
              node,
              messageId: 'missingFile',
              data: { domain, file },
            });
          }
        }

        // Check required directories
        for (const dir of REQUIRED_DIRS) {
          const dirPath = path.join(domainPath, dir);
          if (!fs.existsSync(dirPath)) {
            context.report({
              node,
              messageId: 'missingDir',
              data: { domain, dir },
            });
          } else {
            // Check if actions directory has at least one .ts file
            try {
              const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.ts'));
              if (files.length === 0) {
                context.report({
                  node,
                  messageId: 'emptyActionsDir',
                  data: { domain },
                });
              }
            } catch (e) {
              // Directory read failed, skip
            }
          }
        }

        // Check types.ts re-export
        if (!hasTypesExport) {
          context.report({
            node,
            messageId: 'missingTypesExport',
            data: { domain },
          });
        }

        // Check actions import
        if (!hasActionsImport) {
          context.report({
            node,
            messageId: 'missingActionsImport',
            data: { domain },
          });
        }

        // Check resolveActions usage
        if (hasActionsImport && !hasResolveActions) {
          context.report({
            node,
            messageId: 'missingResolveActions',
            data: { domain },
          });
        }
      },
    };
  },
};
