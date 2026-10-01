module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Require "server-only" import in src/server/ files',
      category: 'Best Practices',
      recommended: true,
    },
    messages: {
      missingServerOnly: 'Files in src/server/ must include `import "server-only"` to prevent client-side usage. (see src/services/.ai.md)',
    },
    schema: [],
  },
  create(context) {
    const filename = context.filename || context.getFilename();
    const normalizedPath = filename.replace(/\\/g, '/');
    const isServerFile = /src\/server\//.test(normalizedPath);
    if (!isServerFile) return {};
    // schema는 drizzle-kit 등 외부 도구가 직접 읽으므로 제외
    if (/(^|[/\-.])schema\.ts$/.test(normalizedPath)) return {};
    let hasServerOnly = false;
    return {
      ImportDeclaration(node) {
        if (node.source.value === 'server-only') {
          hasServerOnly = true;
        }
      },
      'Program:exit'(node) {
        if (!hasServerOnly) {
          context.report({ node, messageId: 'missingServerOnly' });
        }
      },
    };
  },
};
