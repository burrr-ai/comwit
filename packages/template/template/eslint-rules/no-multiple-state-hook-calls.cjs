/**
 * ESLint rule: no-multiple-state-hook-calls
 *
 * Disallows calling the same state hook multiple times in a component.
 * Hooks from @/state/* should be called once with combined selectors.
 */

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow calling the same state hook multiple times. Combine selectors into a single object.",
      category: "Best Practices",
    },
    messages: {
      multipleHookCalls: "Do not call '{{ hookName }}' multiple times in the same component. Combine selectors into a single object: {{ hookName }}(s => ({ prop1: s.prop1, prop2: s.prop2 }))",
    },
    schema: [],
  },

  create(context) {
    // Track imports from @/state/* or src/state/*
    const stateHooks = new Set();

    // Track hook calls per function scope
    // Map<functionNode, Map<hookName, callNodes[]>>
    const scopeHookCalls = new Map();

    // Current function scope stack
    const scopeStack = [];

    function isStateImport(source) {
      return source.startsWith('@/state') ||
             source.startsWith('src/state') ||
             source.match(/^['"]@\/state/);
    }

    function getCurrentScope() {
      return scopeStack[scopeStack.length - 1];
    }

    function enterScope(node) {
      scopeStack.push(node);
      scopeHookCalls.set(node, new Map());
    }

    function exitScope() {
      const scope = scopeStack.pop();
      const hookCalls = scopeHookCalls.get(scope);

      if (hookCalls) {
        // Report errors for hooks called more than once
        for (const [hookName, calls] of hookCalls.entries()) {
          if (calls.length > 1) {
            // Report on second and subsequent calls
            for (let i = 1; i < calls.length; i++) {
              context.report({
                node: calls[i],
                messageId: "multipleHookCalls",
                data: { hookName },
              });
            }
          }
        }
      }

      scopeHookCalls.delete(scope);
    }

    return {
      // Track imports from state
      ImportDeclaration(node) {
        const source = node.source.value;
        if (isStateImport(source)) {
          for (const specifier of node.specifiers) {
            if (specifier.type === 'ImportSpecifier' || specifier.type === 'ImportDefaultSpecifier') {
              const name = specifier.local.name;
              // Only track hooks (functions starting with 'use')
              if (name.startsWith('use')) {
                stateHooks.add(name);
              }
            }
          }
        }
      },

      // Enter function scopes
      FunctionDeclaration(node) {
        enterScope(node);
      },
      FunctionExpression(node) {
        enterScope(node);
      },
      ArrowFunctionExpression(node) {
        enterScope(node);
      },

      // Exit function scopes
      'FunctionDeclaration:exit'() {
        exitScope();
      },
      'FunctionExpression:exit'() {
        exitScope();
      },
      'ArrowFunctionExpression:exit'() {
        exitScope();
      },

      // Track hook calls
      CallExpression(node) {
        if (node.callee.type !== 'Identifier') return;

        const hookName = node.callee.name;

        // Only check state hooks
        if (!stateHooks.has(hookName)) return;

        const currentScope = getCurrentScope();
        if (!currentScope) return;

        const hookCalls = scopeHookCalls.get(currentScope);
        if (!hookCalls) return;

        if (!hookCalls.has(hookName)) {
          hookCalls.set(hookName, []);
        }
        hookCalls.get(hookName).push(node);
      },
    };
  },
};
