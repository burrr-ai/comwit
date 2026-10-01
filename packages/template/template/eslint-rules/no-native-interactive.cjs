/**
 * ESLint rule to forbid native interaction elements in service pages.
 *
 * Interaction primitives must come from the design system (`@/lib/components/ui`)
 * so appearance is unified and driven by variants — not hand-rolled native markup.
 *
 * Forbidden: <button> <input> <select> <textarea>
 * Use instead: Button / Input (+ DatePicker/TimePicker/Checkbox/RadioGroup) / Select / Textarea
 *
 * Scope is applied in .oxlintrc.json (services pages only); the ui primitives
 * in src/lib/components/ui and admin _components are excluded there.
 *
 * 예외: 시각이 없는 input — `type="file"`(숨겨두고 Button 으로 트리거) 과 `type="hidden"`.
 * 이 둘은 디자인 시스템이 대체할 외형 자체가 없다.
 */

const REPLACEMENT = {
  button: "Button",
  input: "Input (또는 Checkbox / RadioGroup / DatePicker)",
  select: "Select",
  textarea: "Textarea",
};

/** 외형이 없어 디자인 시스템으로 대체할 수 없는 input type. */
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
        "native <{{tag}}> 사용 금지 → '@/lib/components/ui' 의 {{replacement}} 컴포넌트를 쓰세요. (스타일은 variant 로만 조절)",
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
