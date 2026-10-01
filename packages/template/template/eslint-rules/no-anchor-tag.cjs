/**
 * ESLint rule to forbid <a> tags for internal navigation
 *
 * Use Next.js <Link> from "next/link" instead of <a> for internal links.
 * External links (http://, https://, mailto:, tel:, #anchor) are allowed.
 */

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Forbid <a> tags for internal navigation, require next/link',
      category: 'Best Practices',
      recommended: true,
    },
    messages: {
      noAnchorTag:
        'Do not use <a> for internal navigation. Use <Link> from "next/link" instead. (External links with http://, https://, mailto:, tel:, #anchor are allowed.)',
    },
    schema: [],
  },

  create(context) {
    const isExternalHref = (value) => {
      if (typeof value !== 'string') return false;
      return /^(https?:\/\/|mailto:|tel:|#)/.test(value);
    };

    return {
      JSXOpeningElement(node) {
        if (node.name.type !== 'JSXIdentifier' || node.name.name !== 'a') return;

        const hrefAttr = node.attributes.find(
          (attr) => attr.type === 'JSXAttribute' && attr.name && attr.name.name === 'href'
        );

        // No href → likely a placeholder/anchor, allow
        if (!hrefAttr || !hrefAttr.value) return;

        // String literal href
        if (hrefAttr.value.type === 'Literal') {
          if (isExternalHref(hrefAttr.value.value)) return;
          context.report({ node, messageId: 'noAnchorTag' });
          return;
        }

        // JSX expression: {`...`} or {variable}
        if (hrefAttr.value.type === 'JSXExpressionContainer') {
          const expr = hrefAttr.value.expression;

          // Template literal with static prefix
          if (expr.type === 'TemplateLiteral' && expr.quasis.length > 0) {
            const firstQuasi = expr.quasis[0].value.cooked;
            if (isExternalHref(firstQuasi)) return;
          }

          // String literal inside expression
          if (expr.type === 'Literal' && isExternalHref(expr.value)) return;

          // Dynamic href - we can't determine, flag it to be safe
          context.report({ node, messageId: 'noAnchorTag' });
        }
      },
    };
  },
};
