/**
 * ESLint rule to forbid native interactive elements in service pages.
 * Use design-system primitives from @/lib/components/ui for consistent variants.
 *
 * Forbidden: <button> <input> <select> <textarea>
 * Use: Button / Input (+ DatePicker/TimePicker/Checkbox/RadioGroup) / Select / Textarea.
 * .oxlintrc.json scopes this to service pages, excluding UI primitives and admin _components.
 *
 * Exceptions: nonvisual input types "file" (hidden and triggered by Button) and "hidden".
 * These have no visual appearance for the design system to replace.
 */

const REPLACEMENT = {
  button: "Button",
  input: "Input (or Checkbox / RadioGroup / DatePicker)",
  select: "Select",
  textarea: "Textarea",
};

/** Input types with no appearance for the design system to replace. */
const INVISIBLE_INPUT_TYPES = new Set(["file", "hidden"]);

function isInvisibleInput(node) {
  if (node.name.name !== "input") return false;
  return node.attributes.some(
    (attr) =>
      attr.type === "JSXAttribute" &&
      attr.name.name === "type" &&
      attr.value?.type === "Literal" &&
      INVISIBLE_INPUT_TYPES.has(attr.value.value),
  );
}

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Forbid native interaction elements (button/input/select/textarea); use @/lib/components/ui",
      category: "Best Practices",
      recommended: true,
    },
    messages: {
      noNative:
        "Native <{{tag}}> is forbidden. Use {{replacement}} from '@/lib/components/ui' and style it through variants.",
    },
    schema: [],
  },

  create(context) {
    return {
      JSXOpeningElement(node) {
        if (node.name.type !== "JSXIdentifier") return;
        const tag = node.name.name;
        if (!Object.prototype.hasOwnProperty.call(REPLACEMENT, tag)) return;
        if (isInvisibleInput(node)) return;

        context.report({
          node,
          messageId: "noNative",
          data: { tag, replacement: REPLACEMENT[tag] },
        });
      },
    };
  },
};
