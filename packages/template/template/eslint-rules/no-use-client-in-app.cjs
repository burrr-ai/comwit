/**
 * ESLint rule to forbid 'use client' directive in app router files
 *
 * Files in src/app/ should be Server Components (no 'use client')
 * They should import client components from src/page/
 */

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Forbid "use client" directive in app router files',
      category: 'Best Practices',
      recommended: true,
    },
    messages: {
      noUseClientInApp:
        'App router files should be Server Components. Move client logic to src/page/ and import it here. (see src/app/.ai.md)',
    },
    schema: [],
  },

  create(context) {
    const filename = context.filename || context.getFilename();

    // Normalize path separators
    const normalizedPath = filename.replace(/\\/g, '/');

    // Only check files in src/app/
    const isAppRouterFile = /src\/app\/.*\.(tsx|ts)$/.test(normalizedPath);
    if (!isAppRouterFile) return {};

    // Skip type definition files
    if (normalizedPath.endsWith('.d.ts')) return {};

    // Next.js error boundaries are required to be Client Components.
    if (/(^|\/)(global-)?error\.tsx$/.test(normalizedPath)) return {};

    // Next.js private folders (_foo) are colocated, non-route modules.
    // Route segments stay Server Components, but colocated impl (e.g. design/_catalog)
    // may be client. Allow 'use client' anywhere under a '_'-prefixed segment.
    const appRelative = normalizedPath.split('/src/app/')[1] || '';
    if (/(^|\/)_[^/]+\//.test(appRelative)) return {};

    return {
      Program(node) {
        const firstStatement = node.body[0];

        const hasUseClient =
          firstStatement?.type === 'ExpressionStatement' &&
          firstStatement.expression?.type === 'Literal' &&
          firstStatement.expression.value === 'use client';

        if (hasUseClient) {
          context.report({
            node: firstStatement,
            messageId: 'noUseClientInApp',
          });
        }
      },
    };
  },
};
