/**
 * ESLint rule to forbid Next.js Image component
 *
 * Use regular <img> tags instead of Next.js <Image> component so generated
 * projects keep one predictable image-loading path.
 */

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Forbid Next.js Image component',
      category: 'Best Practices',
      recommended: true,
    },
    messages: {
      noNextImage:
        'Do not use Next.js Image component. Use a regular <img> tag instead. (see AGENTS.md)',
    },
    schema: [],
  },

  create(context) {
    let imageImported = false;
    let imageLocalName = 'Image';

    return {
      ImportDeclaration(node) {
        const source = node.source.value;

        // Check for next/image imports
        if (source === 'next/image') {
          imageImported = true;

          // Get the local name if it's aliased
          for (const specifier of node.specifiers) {
            if (specifier.type === 'ImportDefaultSpecifier') {
              imageLocalName = specifier.local.name;
            }
          }

          context.report({
            node,
            messageId: 'noNextImage',
          });
        }
      },

      // Also catch usage of the Image component in JSX
      JSXOpeningElement(node) {
        if (imageImported && node.name.type === 'JSXIdentifier' && node.name.name === imageLocalName) {
          // Already reported on import, but could add additional reporting here
        }
      },
    };
  },
};
