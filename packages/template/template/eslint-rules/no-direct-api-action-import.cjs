/**
 * API action 구현 파일은 해당 도메인의 index.ts만 import할 수 있다.
 * 외부 소비자는 항상 domain index를 거쳐야 build loader가 client/server facade를 만들 수 있다.
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
        'API action 파일을 직접 import할 수 없습니다. 해당 도메인의 index.ts API 객체를 사용하세요 (see src/services/api.ai.md)',
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
