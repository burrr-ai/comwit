/**
 * ESLint rule to forbid direct repository imports in page components
 *
 * Dependency Flow: page -> state -> api
 * Page components should never import from @/server/repository directly
 * Repository data should be accessed through state/api layers
 */

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Forbid direct repository imports in page components',
      category: 'Best Practices',
      recommended: true,
    },
    messages: {
      noMockImportInPage:
        'Page components should not import from "@/server/repository" directly. Use state layer instead. (Dependency Flow: page -> state -> api) (see src/services/page.ai.md)',
    },
    schema: [],
  },

  create(context) {
    const filename = context.filename || context.getFilename();
    const normalizedPath = filename.replace(/\\/g, '/');

    // Only check files in src/services/*/page/
    const isPageComponent = /src\/services\/[^/]+\/page\/.*\.(tsx|ts)$/.test(normalizedPath);
    if (!isPageComponent) return {};

    return {
      ImportDeclaration(node) {
        const source = node.source.value;

        // Check for @/server/repository imports
        if (source.startsWith('@/server/repository')) {
          context.report({
            node,
            messageId: 'noMockImportInPage',
          });
        }
      },

      // Also check dynamic imports
      CallExpression(node) {
        if (
          node.callee.type === 'Import' &&
          node.arguments[0]?.type === 'Literal'
        ) {
          const source = node.arguments[0].value;
          if (source.startsWith('@/server/repository')) {
            context.report({
              node,
              messageId: 'noMockImportInPage',
            });
          }
        }
      },
    };
  },
};
