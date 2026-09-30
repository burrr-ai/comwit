/**
 * ESLint rule: api/actions/*.ts 안에서 throw 시 new Error(...) 대신 new ActionError(...) 강제
 *
 * 클라이언트로 메시지를 노출하려면 ActionError를 써야 한다 (그 외 throw는 Next가 마스킹).
 * 의도치 않게 사용자 메시지가 사라지는 것을 막기 위해 raw Error 사용을 금지한다.
 */

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce ActionError instead of raw Error in api/actions/*.ts',
      category: 'Best Practices',
      recommended: true,
    },
    messages: {
      useActionError:
        'api/actions/*.ts 에서는 new Error(...) 대신 new ActionError(...)를 사용하세요. 그래야 메시지가 클라이언트에 전달됩니다 (see src/services/api.ai.md)',
    },
    schema: [],
  },

  create(context) {
    const filename = context.filename || context.getFilename();
    const normalizedPath = filename.replace(/\\/g, '/');

    const actionsMatch = normalizedPath.match(
      /src\/services\/[^/]+\/api\/[^/]+\/actions\/.*\.ts$/
    );

    if (!actionsMatch) return {};

    return {
      NewExpression(node) {
        if (
          node.callee?.type === 'Identifier' &&
          node.callee.name === 'Error'
        ) {
          context.report({
            node,
            messageId: 'useActionError',
          });
        }
      },
    };
  },
};
