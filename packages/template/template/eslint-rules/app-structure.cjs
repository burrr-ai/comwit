/**
 * ESLint rule to enforce App Router structure
 *
 * Rules:
 * - src/app/page.tsx is FORBIDDEN (causes route conflict with (app)/page.tsx)
 * - Home page must be at src/app/(app)/page.tsx
 */

const path = require('path');

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce App Router folder structure',
      category: 'Best Practices',
      recommended: true,
    },
    messages: {
      forbiddenRootPage: 'src/app/page.tsx is forbidden. Use src/app/(app)/page.tsx for the home page instead. (see src/app/.ai.md)',
    },
    schema: [],
  },

  create(context) {
    const filename = context.filename || context.getFilename();

    // Normalize path separators
    const normalizedPath = filename.replace(/\\/g, '/');

    // Check if this is src/app/page.tsx (not in any subfolder)
    const isRootAppPage = /src\/app\/page\.tsx$/.test(normalizedPath);

    if (!isRootAppPage) return {};

    return {
      Program(node) {
        context.report({
          node,
          messageId: 'forbiddenRootPage',
        });
      },
    };
  },
};
