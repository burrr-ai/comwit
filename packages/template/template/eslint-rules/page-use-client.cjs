/**
 * ESLint rule to enforce 'use client' directive in page components
 *
 * All files in src/page/ must have 'use client' at the top
 * (except for types.ts, *.d.ts files)
 */

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce "use client" directive in page components',
      category: 'Best Practices',
      recommended: true,
    },
    messages: {
      missingUseClient: 'Page components must have "use client" directive at the top of the file (see src/services/page.ai.md)',
    },
    schema: [],
  },

  create(context) {
    const filename = context.filename || context.getFilename();

    // Normalize path separators
    const normalizedPath = filename.replace(/\\/g, '/');

    // Only check .tsx files in src/page/
    const isPageComponent = /src\/services\/[^/]+\/page\/.*\.tsx$/.test(normalizedPath);
    if (!isPageComponent) return {};

    // Skip type definition files
    if (normalizedPath.endsWith('.d.ts')) return {};

    // Skip server components in layout folder (e.g., root-layout/index.tsx is a Server Component)
    // Only client.tsx files in layout/ require 'use client'
    if (normalizedPath.includes('/layout/') && !normalizedPath.endsWith('client.tsx')) {
      return {};
    }

    return {
      Program(node) {
        const firstStatement = node.body[0];

        const hasUseClient =
          firstStatement?.type === 'ExpressionStatement' &&
          firstStatement.expression?.type === 'Literal' &&
          firstStatement.expression.value === 'use client';

        if (!hasUseClient) {
          context.report({
            node: firstStatement || node,
            messageId: 'missingUseClient',
          });
        }
      },
    };
  },
};
