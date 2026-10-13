/**
 * ESLint rule: require new ActionError(...) instead of new Error(...) in api/actions/*.ts.
 *
 * ActionError exposes its message to clients; other throws are masked.
 * Forbid raw Error so intended user messages are not accidentally lost.
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
        'Use new ActionError(...) instead of new Error(...) in api/actions/*.ts so the message reaches the client (see src/services/api.ai.md)',
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
