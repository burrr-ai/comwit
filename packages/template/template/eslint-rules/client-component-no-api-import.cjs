/**
 * ESLint rule to forbid direct API imports in client components
 *
 * Dependency Flow: page -> state -> api
 * Client components ('use client') should use state layer, not import from @/api directly
 * Server components CAN import from @/api directly
 */

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Forbid direct API imports in client components',
      category: 'Best Practices',
      recommended: true,
    },
    messages: {
      noApiImportInClientComponent:
        'Client components should not import from "@/services/*/api" directly. Use state layer from "@/services/*/state" instead. (Dependency Flow: page -> state -> api) (see src/services/page.ai.md)',
    },
    schema: [],
  },

  create(context) {
    const filename = context.filename || context.getFilename();

    // Normalize path separators
    const normalizedPath = filename.replace(/\\/g, '/');

    // Only check files in src/page/
    const isPageComponent = /src\/services\/[^/]+\/page\/.*\.(tsx|ts)$/.test(normalizedPath);
    if (!isPageComponent) return {};

    // Skip type files
    if (normalizedPath.endsWith('.d.ts') || normalizedPath.endsWith('types.ts')) {
      return {};
    }

    let isClientComponent = false;

    return {
      Program(node) {
        // Check for 'use client' directive at the top
        const firstStatement = node.body[0];
        isClientComponent =
          firstStatement?.type === 'ExpressionStatement' &&
          firstStatement.expression?.type === 'Literal' &&
          firstStatement.expression.value === 'use client';
      },

      ImportDeclaration(node) {
        // Only check client components
        if (!isClientComponent) return;

        const source = node.source.value;

        // Check for @/services/*/api imports
        if (source.match(/^@\/services\/[^/]+\/api(\/|$)/)) {
          context.report({
            node,
            messageId: 'noApiImportInClientComponent',
          });
        }
      },

      // Also check dynamic imports
      CallExpression(node) {
        // Only check client components
        if (!isClientComponent) return;

        if (
          node.callee.type === 'Import' &&
          node.arguments[0]?.type === 'Literal'
        ) {
          const source = node.arguments[0].value;
          if (source.match(/^@\/services\/[^/]+\/api(\/|$)/)) {
            context.report({
              node,
              messageId: 'noApiImportInClientComponent',
            });
          }
        }
      },
    };
  },
};
