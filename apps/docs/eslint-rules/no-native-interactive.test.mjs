import assert from 'node:assert/strict'
import { describe, it, test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { ESLint, RuleTester } from 'eslint'
import rule from './no-native-interactive.mjs'

RuleTester.describe = describe
RuleTester.it = it

const tester = new RuleTester({
  languageOptions: { parserOptions: { ecmaFeatures: { jsx: true } } },
})

tester.run('no-native-interactive', rule, {
  valid: [
    '<Button />',
    '<Input type="text" />',
    '<Select><SelectTrigger /></Select>',
    '<Textarea />',
    '<UI.Input />',
    '<input type="hidden" />',
    '<input type={"file"} />',
    'const example = `<input type="text" />`',
    '<div>input</div>',
  ],
  invalid: [
    ...['button', 'input', 'select', 'textarea'].map((tag) => ({
      code: `<${tag} />`,
      errors: [{ messageId: 'noNative' }],
    })),
    ...['text', 'search', 'range', 'color', 'checkbox', 'radio'].map((type) => ({
      code: `<input type="${type}" />`,
      errors: [{ messageId: 'noNative' }],
    })),
    { code: '<input type={inputType} />', errors: [{ messageId: 'noNative' }] },
  ],
})

test('docs config enforces controls while excluding generated code and library source', async () => {
  const cwd = fileURLToPath(new URL('../', import.meta.url))
  const eslint = new ESLint({ cwd })
  const [result] = await eslint.lintText('export const Example = () => <input />', {
    filePath: 'app/rule-check.tsx',
  })
  assert.ok(
    result.messages.some(
      (message) => message.ruleId === 'docs/no-native-interactive' && message.severity === 2
    )
  )
  assert.equal(await eslint.isPathIgnored('app/ui/_generated/example.tsx'), true)
  assert.equal(
    await eslint.isPathIgnored('../../packages/ui/templates/src/components/ui/input.tsx'),
    true
  )
})
