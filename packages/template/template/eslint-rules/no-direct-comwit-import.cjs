/**
 * ESLint rule: disallow direct @comwit/state imports
 *
 * Direct use of @comwit/state is allowed only in:
 * - src/state/**
 * - src/lib/state/**
 * - src/services/{service}/state/**
 * - src/lib/utils/action.ts (state→server-action boundary that auto-snapshots proxies)
 */

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow direct comwit imports outside the state layer",
      category: "Best Practices",
      recommended: true,
    },
    messages: {
      noDirectComwit:
        'Do not import from "@comwit/state" directly here. Keep state-layer boundaries in src/state/* and src/lib/state/*. (see src/services/state.ai.md)',
    },
    schema: [],
  },

  create(context) {
    const filename = context.filename || context.getFilename();
    const normalizedPath = filename.replace(/\\/g, "/");
    const isAllowed =
      normalizedPath.includes("/src/state/") ||
      normalizedPath.includes("/src/lib/state/") ||
      /\/src\/services\/[^/]+\/state\//.test(normalizedPath) ||
      normalizedPath.endsWith("/src/lib/utils/action.ts");

    if (isAllowed) return {};

    return {
      ImportDeclaration(node) {
        const source = node.source.value;

        if (
          typeof source === "string" &&
          (source === "@comwit/state" ||
            source.startsWith("@comwit/state/") ||
            source === "comwit" ||
            source.startsWith("comwit/"))
        ) {
          context.report({
            node,
            messageId: "noDirectComwit",
          });
        }
      },
    };
  },
};
