/**
 * ESLint rule to enforce kebab-case file naming
 *
 * All files in src/ should use kebab-case (e.g., hero-section.tsx, api-handler.ts)
 * Exceptions: index.ts, index.tsx, types.ts, store.ts, client.tsx, layout.tsx, page.tsx, *.d.ts
 */

const path = require('path');

// Files that are allowed to not follow kebab-case
const ALLOWED_FILES = [
  'index.ts',
  'index.tsx',
  'types.ts',
  'store.ts',
  'client.tsx',
  'layout.tsx',
  'page.tsx',
  'loading.tsx',
  'error.tsx',
  'not-found.tsx',
  'route.ts',
  'middleware.ts',
  'globals.css',
];

// Check if string is kebab-case (lowercase letters, numbers, hyphens)
function isKebabCase(str) {
  // Remove extension
  const nameWithoutExt = str.replace(/\.(tsx?|jsx?|css|md)$/, '');
  // Check if it's kebab-case
  return /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(nameWithoutExt);
}

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce kebab-case file naming in src/',
      category: 'Best Practices',
      recommended: true,
    },
    messages: {
      notKebabCase:
        'File name "{{filename}}" should be kebab-case (e.g., "{{suggestion}}") (see CLAUDE.md)',
    },
    schema: [],
  },

  create(context) {
    const filename = context.filename || context.getFilename();

    // Normalize path separators
    const normalizedPath = filename.replace(/\\/g, '/');

    // Only check files in src/
    if (!normalizedPath.includes('/src/')) return {};

    // Skip node_modules
    if (normalizedPath.includes('node_modules')) return {};

    const basename = path.basename(filename);

    // Skip allowed files
    if (ALLOWED_FILES.includes(basename)) return {};

    // Skip .d.ts files
    if (basename.endsWith('.d.ts')) return {};

    // Check if file name is kebab-case
    if (!isKebabCase(basename)) {
      // Generate suggestion
      const nameWithoutExt = basename.replace(/\.(tsx?|jsx?|css|md)$/, '');
      const ext = basename.slice(nameWithoutExt.length);
      const suggestion =
        nameWithoutExt
          // Convert camelCase/PascalCase to kebab-case
          .replace(/([a-z])([A-Z])/g, '$1-$2')
          .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
          .toLowerCase()
          // Replace underscores with hyphens
          .replace(/_/g, '-')
          // Remove consecutive hyphens
          .replace(/-+/g, '-') + ext;

      return {
        Program(node) {
          context.report({
            node,
            messageId: 'notKebabCase',
            data: { filename: basename, suggestion },
          });
        },
      };
    }

    return {};
  },
};
