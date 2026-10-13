/**
 * ESLint rule to enforce createAction / resolveActions usage.
 *
 * 1. In src/services/{service}/api/{domain}/actions/*.ts:
 *    - All exported functions must be wrapped with createAction.
 *    - Import createAction from '@/lib/utils'.
 *    - Cross-action imports are forbidden.
 * 2. Everywhere else:
 *    - Do not import createAction / resolveActions.
 *    - These belong only to the API layer, never auth, state, or page.
 */

const RESTRICTED_NAMES = ['createAction', 'resolveActions'];

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce createAction wrapping for server actions',
      category: 'Best Practices',
      recommended: true,
    },
    messages: {
      mustWrapWithCreateAction:
        'Exported server action "{{name}}" must be wrapped with createAction (see src/services/api.ai.md)',
      missingCreateActionImport:
        'Server action file must import createAction from "@/lib/utils" (see src/services/api.ai.md)',
      noCrossActionImport:
        'Cross-action imports are forbidden. Access data through repositories and extract shared logic into utilities (see src/services/api.ai.md)',
      noCreateActionOutsideApi:
        '"{{name}}" is only allowed inside src/services/{service}/api/ (see src/services/api.ai.md)',
    },
    schema: [],
  },

  create(context) {
    const filename = context.filename || context.getFilename();
    const normalizedPath = filename.replace(/\\/g, '/');

    const actionsMatch = normalizedPath.match(
      /src\/services\/[^/]+\/api\/[^/]+\/actions\/.*\.ts$/
    );

    const apiIndexMatch = normalizedPath.match(
      /src\/services\/[^/]+\/api\/[^/]+\/index\.ts$/
    );

    const insideApi = normalizedPath.match(
      /src\/services\/[^/]+\/api\//
    );

    if (!insideApi) {
      return {
        ImportDeclaration(node) {
          if (!node.source) return;
          for (const spec of node.specifiers) {
            if (
              spec.type === 'ImportSpecifier' &&
              RESTRICTED_NAMES.includes(spec.imported?.name)
            ) {
              context.report({
                node: spec,
                messageId: 'noCreateActionOutsideApi',
                data: { name: spec.imported.name },
              });
            }
          }
        },
      };
    }

    if (apiIndexMatch && !actionsMatch) return {};
    if (!actionsMatch) return {};

    let hasCreateActionImport = false;
    let hasExports = false;

    return {
      ImportDeclaration(node) {
        if (!node.source) return;
        const src = node.source.value;

        if (src === '@/lib/utils' || src === '@/lib/utils/action') {
          for (const spec of node.specifiers) {
            if (
              spec.type === 'ImportSpecifier' &&
              spec.imported?.name === 'createAction'
            ) {
              hasCreateActionImport = true;
            }
          }
        }

        if (src.startsWith('./') || src.startsWith('../')) {
          const isRelativeToSibling = src.startsWith('./') && !src.startsWith('./types');
          const isParentActions = src.startsWith('../') && src.includes('actions');
          if (isRelativeToSibling || isParentActions) {
            context.report({
              node,
              messageId: 'noCrossActionImport',
            });
          }
        }
      },

      ExportNamedDeclaration(node) {
        if (node.declaration?.type === 'FunctionDeclaration') {
          hasExports = true;
          context.report({
            node: node.declaration,
            messageId: 'mustWrapWithCreateAction',
            data: { name: node.declaration.id?.name || 'anonymous' },
          });
        }

        if (node.declaration?.type === 'VariableDeclaration') {
          for (const declarator of node.declaration.declarations) {
            const init = declarator.init;
            const name = declarator.id?.name || 'unknown';

            hasExports = true;

            if (
              init?.type === 'CallExpression' &&
              init.callee?.type === 'Identifier' &&
              init.callee.name === 'createAction'
            ) {
              continue;
            }

            if (init?.type === 'ArrowFunctionExpression' || init?.type === 'FunctionExpression') {
              context.report({
                node: declarator,
                messageId: 'mustWrapWithCreateAction',
                data: { name },
              });
            }
          }
        }
      },

      ExportDefaultDeclaration(node) {
        hasExports = true;
        const decl = node.declaration;
        if (
          decl.type === 'FunctionDeclaration' ||
          decl.type === 'ArrowFunctionExpression' ||
          decl.type === 'FunctionExpression'
        ) {
          context.report({
            node: decl,
            messageId: 'mustWrapWithCreateAction',
            data: { name: decl.id?.name || 'default' },
          });
        }
      },

      'Program:exit'(node) {
        if (hasExports && !hasCreateActionImport) {
          context.report({
            node,
            messageId: 'missingCreateActionImport',
          });
        }
      },
    };
  },
};
