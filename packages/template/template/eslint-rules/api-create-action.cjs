/**
 * ESLint rule to enforce createAction / resolveActions usage
 *
 * 1. In src/services/{service}/api/{domain}/actions/*.ts:
 *    - All exported functions must be wrapped with createAction
 *    - createAction must be imported from '@/lib/utils'
 *    - Cross-action imports forbidden
 *
 * 2. Everywhere else:
 *    - createAction / resolveActions import 금지
 *    (api layer 전용 — auth, state, page 등에서 사용 불가)
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
        'Action 파일 간 크로스 import 금지. DB 접근은 repository를 통해 각각 구현하고, 공통 로직은 유틸로 분리하세요 (see src/services/api.ai.md)',
      noCreateActionOutsideApi:
        '"{{name}}"은 src/services/{service}/api/ 내에서만 사용 가능합니다 (see src/services/api.ai.md)',
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
