/**
 * ESLint rule to enforce required Better Auth options.
 * Prevent betterAuth(...) from omitting options defined by the auth-server.ts.ref asset.
 *
 * Required:
 *   emailAndPassword.enabled === true
 *   account.skipStateCookieCheck === true
 *   advanced.cookiePrefix (nonempty string)
 *   advanced.useSecureCookies === true
 *   advanced.defaultCookieAttributes.sameSite === "None"
 *   trustedOrigins (nonempty array)
 *
 * Find betterAuth(...) calls and inspect ObjectExpression arguments directly.
 * For Identifier arguments, resolve the ObjectExpression declared in the same file/scope.
 */

const REQUIRED = [
  { path: ['emailAndPassword', 'enabled'], expect: 'true' },
  { path: ['account', 'skipStateCookieCheck'], expect: 'true' },
  { path: ['advanced', 'cookiePrefix'], expect: 'non-empty-string' },
  { path: ['advanced', 'useSecureCookies'], expect: 'true' },
  { path: ['advanced', 'defaultCookieAttributes', 'sameSite'], expect: '"None"' },
  { path: ['trustedOrigins'], expect: 'non-empty-array' },
];

function getProperty(objectExpr, key) {
  if (!objectExpr || objectExpr.type !== 'ObjectExpression') return null;
  for (const prop of objectExpr.properties) {
    if (prop.type !== 'Property') continue;
    const k = prop.key;
    const name = k.type === 'Identifier' ? k.name : k.type === 'Literal' ? k.value : null;
    if (name === key) return prop;
  }
  return null;
}

function valueMatches(node, expect) {
  if (!node) return false;
  switch (expect) {
    case 'true':
      return node.type === 'Literal' && node.value === true;
    case '"None"':
      return node.type === 'Literal' && node.value === 'None';
    case 'non-empty-string':
      return node.type === 'Literal' && typeof node.value === 'string' && node.value.length > 0;
    case 'non-empty-array':
      return node.type === 'ArrayExpression' && node.elements.length > 0;
    default:
      return false;
  }
}

function checkOptions(context, optionsNode, reportNode) {
  if (!optionsNode || optionsNode.type !== 'ObjectExpression') {
    context.report({
      node: reportNode,
      messageId: 'optionsMustBeObjectLiteral',
    });
    return;
  }

  for (const { path, expect } of REQUIRED) {
    let current = optionsNode;
    let prop = null;
    for (const key of path) {
      prop = getProperty(current, key);
      if (!prop) {
        context.report({
          node: reportNode,
          messageId: 'missingOption',
          data: { path: path.join('.'), expect },
        });
        current = null;
        break;
      }
      current = prop.value;
    }

    if (current && !valueMatches(current, expect)) {
      context.report({
        node: prop ? prop.value : reportNode,
        messageId: 'wrongOptionValue',
        data: { path: path.join('.'), expect },
      });
    }
  }
}

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Enforce required Better Auth options as documented in .claude/skills/auth-setup/assets/auth-server.ts.ref',
      category: 'Best Practices',
      recommended: true,
    },
    messages: {
      optionsMustBeObjectLiteral:
        'betterAuth(...) options must be an object literal in the same file (so this rule can verify required fields). See .claude/skills/auth-setup/assets/auth-server.ts.ref.',
      missingOption:
        'betterAuth options missing required field "{{path}}" (expected {{expect}}). See .claude/skills/auth-setup/assets/auth-server.ts.ref.',
      wrongOptionValue:
        'betterAuth options field "{{path}}" must be {{expect}}. See .claude/skills/auth-setup/assets/auth-server.ts.ref.',
    },
    schema: [],
  },

  create(context) {
    const objectsByName = new Map();

    const unwrap = (node) => {
      if (!node) return null;
      if (node.type === 'TSAsExpression' || node.type === 'TSSatisfiesExpression') {
        return unwrap(node.expression);
      }
      return node;
    };

    return {
      VariableDeclarator(node) {
        const init = unwrap(node.init);
        if (
          node.id?.type === 'Identifier' &&
          init &&
          init.type === 'ObjectExpression'
        ) {
          objectsByName.set(node.id.name, init);
        }
      },

      CallExpression(node) {
        const callee = node.callee;
        if (!callee || callee.type !== 'Identifier' || callee.name !== 'betterAuth') {
          return;
        }
        const arg = unwrap(node.arguments[0]);
        if (!arg) {
          context.report({ node, messageId: 'optionsMustBeObjectLiteral' });
          return;
        }

        let optionsNode = null;
        if (arg.type === 'ObjectExpression') {
          optionsNode = arg;
        } else if (arg.type === 'Identifier') {
          optionsNode = objectsByName.get(arg.name) || null;
        }

        checkOptions(context, optionsNode, node);
      },
    };
  },
};
