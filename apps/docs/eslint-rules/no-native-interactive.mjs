const replacements = {
  button: 'Button',
  input: 'Input (or Checkbox / RadioGroup / DatePicker)',
  select: 'Select',
  textarea: 'Textarea',
}

// Match the template's exception for nonvisual form plumbing.
function isInvisibleInput(node) {
  if (node.name.name !== 'input') return false
  const type = node.attributes.find(
    (attribute) => attribute.type === 'JSXAttribute' && attribute.name.name === 'type'
  )?.value
  const value = type?.type === 'JSXExpressionContainer' ? type.expression : type
  return value?.type === 'Literal' && ['file', 'hidden'].includes(value.value)
}

const noNativeInteractive = {
  meta: {
    type: 'problem',
    docs: { description: 'Use Comwit UI components for docs interaction controls.' },
    schema: [],
    messages: {
      noNative:
        'Do not use native <{{tag}}> in docs. Use {{replacement}} from @comwit/ui-templates instead.',
    },
  },
  create(context) {
    return {
      JSXOpeningElement(node) {
        if (node.name.type !== 'JSXIdentifier') return
        const tag = node.name.name
        if (!Object.hasOwn(replacements, tag) || isInvisibleInput(node)) return
        context.report({
          node,
          messageId: 'noNative',
          data: { tag, replacement: replacements[tag] },
        })
      },
    }
  },
}

export default noNativeInteractive
