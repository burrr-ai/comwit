/**
 * ESLint rule to prevent using root app/ folder
 *
 * All App Router files must be in src/app/, not app/
 */

const path = require('path');

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow files in root app/ folder, must use src/app/',
      category: 'Best Practices',
      recommended: true,
    },
    messages: {
      noRootAppFolder: 'Files must be in src/app/, not app/. Move this file to src/app/. (see src/app/.ai.md)',
    },
    schema: [],
  },

  create(context) {
    const filename = context.filename || context.getFilename();
    const normalizedPath = filename.replace(/\\/g, '/');

    // Check if file is in root app/ folder (not src/app/ or src/services/)
    const isRootAppFolder = /\/app\//.test(normalizedPath) && !/\/src\/app\//.test(normalizedPath) && !/\/src\/services\//.test(normalizedPath);

    if (!isRootAppFolder) return {};

    return {
      Program(node) {
        context.report({
          node,
          messageId: 'noRootAppFolder',
        });
      },
    };
  },
};
