/**
 * ESLint rule to enforce server actions over route handlers and fetch
 *
 * 1. Forbid app/api/* route handlers (except auth and the Server Function transport)
 * 2. Forbid direct fetch() calls in client components
 *
 * Use server actions from @/api instead
 */

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce server actions over route handlers and direct fetch',
      category: 'Best Practices',
      recommended: true,
    },
    messages: {
      noRouteHandler:
        'Route handlers (app/api/*) are not allowed. Use server actions in @/api instead. Exceptions: app/api/auth/* and app/api/internal/server-fn/* transport. (see src/services/api.ai.md)',
      noFetchInClient:
        'Direct fetch() calls in client components are not allowed. Use server actions from @/api through @/state instead. (see src/services/api.ai.md)',
    },
    schema: [],
  },

  create(context) {
    const filename = context.filename || context.getFilename();
    const normalizedPath = filename.replace(/\\/g, '/');

    // Rule 1: Check for route handlers in app/api (except auth and Server Function transport)
    const isRouteHandler = /src\/app\/api\//.test(normalizedPath);
    const isAuthRoute = /src\/app\/api\/auth\//.test(normalizedPath);
    const isServerFnRoute = /src\/app\/api\/internal\/server-fn\//.test(normalizedPath);

    if (isRouteHandler && !isAuthRoute && !isServerFnRoute) {
      return {
        Program(node) {
          context.report({
            node,
            messageId: 'noRouteHandler',
          });
        },
      };
    }

    // Rule 2: Check for fetch in client components
    const isPageComponent = /src\/services\/[^/]+\/page\/.*\.(tsx|ts)$/.test(normalizedPath);
    if (!isPageComponent) return {};

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

      CallExpression(node) {
        // Only check client components
        if (!isClientComponent) return;

        // Check for fetch() calls
        if (node.callee.type === 'Identifier' && node.callee.name === 'fetch') {
          context.report({
            node,
            messageId: 'noFetchInClient',
          });
        }
      },
    };
  },
};
