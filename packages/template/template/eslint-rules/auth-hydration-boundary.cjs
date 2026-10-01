/** Keep basic-user hydration isolated from reactive subscribers and client bootstrap reads. */
module.exports = {
  meta: {
    type: 'problem',
    schema: [],
    messages: {
      reactiveHydrator: "Move '{{hook}}' subscriptions into a child of the auth hydration component; otherwise logout can replay its old server user.",
      clientBootstrap: 'Read the server-hydrated user query passively. Basic auth must resolve in the server layout before rendering children.',
    },
  },
  create(context) {
    const hooks = new Set()
    const scopes = []
    const selectors = new Map()
    const property = node => node?.computed ? node.property?.value : node?.property?.name
    const enter = node => scopes.push({ node, hydrated: new Set(), reads: [] })
    const leave = () => {
      const scope = scopes.pop()
      for (const read of scope.reads) {
        if (scope.hydrated.has(read.hook)) context.report({ node: read.node, messageId: 'reactiveHydrator', data: { hook: read.hook } })
      }
    }
    return {
      ImportDeclaration(node) {
        if (!/^@\/services\/[^/]+\/state\/user(?:\/index)?$/.test(node.source.value)) return
        for (const specifier of node.specifiers) {
          if (specifier.importKind !== 'type' && specifier.local?.name) hooks.add(specifier.local.name)
        }
      },
      FunctionDeclaration: enter,
      FunctionExpression: enter,
      ArrowFunctionExpression: enter,
      'FunctionDeclaration:exit': leave,
      'FunctionExpression:exit': leave,
      'ArrowFunctionExpression:exit': leave,
      CallExpression(node) {
        const scope = scopes.at(-1)
        if (!scope) return
        const callee = node.callee
        if (callee.type === 'Identifier' && hooks.has(callee.name)) {
          scope.reads.push({ node, hook: callee.name })
          const selector = node.arguments[0]
          if (selector?.type === 'ArrowFunctionExpression' || selector?.type === 'FunctionExpression') {
            selectors.set(selector, selector.params[0]?.name)
          }
        }
        if (callee.type !== 'MemberExpression') return
        if (callee.object.type === 'Identifier' && hooks.has(callee.object.name) && property(callee) === 'hydrate') {
          scope.hydrated.add(callee.object.name)
        }
        if (!['load', 'suspend'].includes(property(callee)) || callee.object.type !== 'MemberExpression' || property(callee.object) !== 'me') return
        const state = callee.object.object
        if (state.type === 'Identifier' && scopes.some(parent => selectors.get(parent.node) === state.name)) {
          context.report({ node, messageId: 'clientBootstrap' })
        }
      },
    }
  },
}
