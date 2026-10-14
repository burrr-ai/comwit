/**
 * Only a domain's index.ts may import its action implementation files.
 * Consumers must use the domain index so the build loader can create client/server facades.
 */
const path = require('node:path');

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Forbid importing API action implementation files outside their domain index',
      category: 'Best Practices',
      recommended: true,
    },
    messages: {
      noDirectApiActionImport:
        'Do not import API action files directly. Use the domain index.ts API object (see src/services/api.ai.md)',
    },
    schema: [],
  },

  create(context) {
    const filename = (context.filename || context.getFilename()).replace(/\\/g, '/');
    const isApiIndex =
      /src\/services\/[^/]+\/api\/[^/]+\/index\.ts$/.test(filename);
    const isDirectApiActionImport = (source) => {
      if (/^@\/services\/[^/]+\/api\/[^/]+\/actions(?:\/|$)/.test(source)) {
        return true;
      }
      if (!source.startsWith('.')) return false;
      const resolved = path.resolve(path.dirname(filename), source).replace(/\\/g, '/');
      return /src\/services\/[^/]+\/api\/[^/]+\/actions(?:\/|$)/.test(resolved);
    };

    const check = (node, source) => {
      if (!isDirectApiActionImport(source)) return;
      if (
        isApiIndex &&
        (source === './actions' || source.startsWith('./actions/'))
      ) {
        return;
      }
      context.report({ node, messageId: 'noDirectApiActionImport' });
    };

    return {
      ImportDeclaration(node) {
        check(node, node.source.value);
      },
      CallExpression(node) {
        if (
          node.callee.type === 'Import' &&
          node.arguments[0]?.type === 'Literal' &&
          typeof node.arguments[0].value === 'string'
        ) {
          check(node, node.arguments[0].value);
        }
      },
    };
  },
};
