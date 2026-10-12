/** Keep server settings lazy without changing the config.KEY API. */
module.exports = {
  meta: {
    type: 'problem',
    schema: [],
    messages: {
      object: 'Define server config as an object literal with getters so config.KEY resolves values on access.',
      getter: 'Every server config entry must be a getter: get KEY() { return value; }. Do not use values, methods, setters or spreads.',
      env: 'Read process.env inside a config getter; do not capture environment values at module load.',
    },
  },
  create(context) {
    const filename = (context.filename || context.getFilename()).replace(/\\/g, '/');
    if (!/(^|\/)src\/server\/config\.ts$/.test(filename)) return {};

    const getters = new Set();
    return {
      VariableDeclarator(node) {
        if (node.id.type !== 'Identifier' || node.id.name !== 'config') return;
        let value = node.init;
        while (value && ['TSAsExpression', 'TSSatisfiesExpression', 'TSTypeAssertion', 'ParenthesizedExpression'].includes(value.type)) {
          value = value.expression;
        }
        if (value?.type !== 'ObjectExpression') {
          context.report({ node, messageId: 'object' });
          return;
        }
        for (const property of value.properties) {
          if (property.type === 'Property' && property.kind === 'get') {
            getters.add(property.value);
          } else {
            context.report({ node: property, messageId: 'getter' });
          }
        }
      },
      MemberExpression(node) {
        if (node.object.type !== 'Identifier' || node.object.name !== 'process') return;
        const name = node.computed ? node.property.value : node.property.name;
        if (name !== 'env') return;
        for (let parent = node.parent; parent; parent = parent.parent) {
          if (getters.has(parent)) return;
        }
        context.report({ node, messageId: 'env' });
      },
    };
  },
};
