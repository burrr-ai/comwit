/** Drizzle Kit loads config in Node, where server-only throws on import. */
module.exports = {
  meta: {
    type: 'problem',
    schema: [],
    messages: { serverConfig: 'Drizzle config runs in Node: load .env and use process.env directly; do not import server-only or src/server/config.' },
  },
  create(context) {
    const filename = (context.filename || context.getFilename()).replace(/\\/g, '/');
    if (!/(^|\/)drizzle\.config\.(?:[cm]?[jt]s)$/.test(filename)) return {};
    function check(node, source) {
      if (typeof source === 'string' && (source === 'server-only' ||
          /(?:^@\/|(?:^|\/)src\/)server\/config(?:\.[cm]?[jt]s)?$/.test(source))) {
        context.report({ node, messageId: 'serverConfig' });
      }
    }
    return {
      ImportDeclaration(node) { check(node, node.source.value); },
      ExportNamedDeclaration(node) { if (node.source) check(node, node.source.value); },
      ExportAllDeclaration(node) { check(node, node.source.value); },
      ImportExpression(node) { check(node, node.source.value); },
      CallExpression(node) {
        if (node.callee.name === 'require') check(node, node.arguments[0]?.value);
      },
    };
  },
};
