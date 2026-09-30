module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Forbid direct database imports in API layer',
      category: 'Best Practices',
      recommended: true,
    },
    messages: {
      noDbInApi: 'API layer should not import from "{{source}}" directly. Use repository layer (@/server/repository) instead. (see src/services/api.ai.md)',
    },
    schema: [],
  },
  create(context) {
    const filename = context.filename || context.getFilename();
    const normalizedPath = filename.replace(/\\/g, '/');
    const isApiFile = /src\/services\/[^/]+\/api\//.test(normalizedPath);
    if (!isApiFile) return {};
    return {
      ImportDeclaration(node) {
        const source = node.source.value;
        if (source === 'drizzle-orm' || source.startsWith('drizzle-orm/')) {
          context.report({ node, messageId: 'noDbInApi', data: { source } });
        }
      },
    };
  },
};
