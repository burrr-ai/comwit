/**
 * ESLint rule to enforce server action rules in src/api/{domain}/actions/*.ts
 *
 * Rules:
 * 1. Files must start with "use server" directive
 * 2. All exported functions must be async
 * 3. Cannot export non-function values (objects, constants, etc.)
 */

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce server action rules for API action files',
      category: 'Best Practices',
      recommended: true,
    },
    messages: {
      missingUseServer: 'Server action files must start with "use server" directive (see src/services/api.ai.md)',
      mustBeAsync: 'Exported function "{{name}}" must be async in server action files (see src/services/api.ai.md)',
      noExportNonFunction: 'Cannot export non-function "{{name}}" in server action files. Only async functions are allowed. (see src/services/api.ai.md)',
    },
    schema: [],
  },

  create(context) {
    const filename = context.filename || context.getFilename();

    // Only check files in src/api/{domain}/actions/
    const actionsMatch = filename.match(/src[/\\]services[/\\][^/\\]+[/\\]api[/\\][^/\\]+[/\\]actions[/\\].*\.ts$/);
    if (!actionsMatch) return {};

    let hasUseServerDirective = false;

    return {
      Program(node) {
        // Check for "use server" directive at the top
        const firstStatement = node.body[0];

        if (
          firstStatement?.type === 'ExpressionStatement' &&
          firstStatement.expression?.type === 'Literal' &&
          firstStatement.expression.value === 'use server'
        ) {
          hasUseServerDirective = true;
        }

        if (!hasUseServerDirective) {
          context.report({
            node: firstStatement || node,
            messageId: 'missingUseServer',
          });
        }
      },

      // Check: export function foo() {} or export async function foo() {}
      ExportNamedDeclaration(node) {
        // Case 1: export function declaration
        if (node.declaration?.type === 'FunctionDeclaration') {
          if (!node.declaration.async) {
            context.report({
              node: node.declaration,
              messageId: 'mustBeAsync',
              data: { name: node.declaration.id?.name || 'anonymous' },
            });
          }
        }

        // Case 2: export const/let/var
        if (node.declaration?.type === 'VariableDeclaration') {
          for (const declarator of node.declaration.declarations) {
            const init = declarator.init;
            const name = declarator.id?.name || 'unknown';

            // Arrow function: export const foo = async () => {}
            if (init?.type === 'ArrowFunctionExpression') {
              if (!init.async) {
                context.report({
                  node: declarator,
                  messageId: 'mustBeAsync',
                  data: { name },
                });
              }
            }
            // Function expression: export const foo = async function() {}
            else if (init?.type === 'FunctionExpression') {
              if (!init.async) {
                context.report({
                  node: declarator,
                  messageId: 'mustBeAsync',
                  data: { name },
                });
              }
            }
            // createAction(...) wrapping is allowed
            else if (
              init?.type === 'CallExpression' &&
              init.callee?.type === 'Identifier' &&
              init.callee.name === 'createAction'
            ) {
              // OK — action wrapper and build-time registry marker
            }
            // Non-function export (object, string, number, etc.)
            else {
              context.report({
                node: declarator,
                messageId: 'noExportNonFunction',
                data: { name },
              });
            }
          }
        }

        // Case 3: export { foo, bar } - named exports from specifiers
        if (node.specifiers && node.specifiers.length > 0 && !node.source) {
          // This is re-exporting local variables, harder to check
          // For now, we skip this case as it's less common in action files
        }
      },

      // Check: export default
      ExportDefaultDeclaration(node) {
        const decl = node.declaration;

        if (decl.type === 'FunctionDeclaration') {
          if (!decl.async) {
            context.report({
              node: decl,
              messageId: 'mustBeAsync',
              data: { name: decl.id?.name || 'default' },
            });
          }
        } else if (decl.type === 'ArrowFunctionExpression' || decl.type === 'FunctionExpression') {
          if (!decl.async) {
            context.report({
              node: decl,
              messageId: 'mustBeAsync',
              data: { name: 'default' },
            });
          }
        } else {
          // Exporting non-function as default
          context.report({
            node: decl,
            messageId: 'noExportNonFunction',
            data: { name: 'default' },
          });
        }
      },
    };
  },
};
