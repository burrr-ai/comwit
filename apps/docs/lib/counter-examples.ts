import hljs from 'highlight.js/lib/core'
import typescript from 'highlight.js/lib/languages/typescript'

hljs.registerLanguage('typescript', typescript)

export const counterExamples = [
  {
    title: 'Model',
    code: `import { model } from '@comwit/state'\n\nexport const counter = model({ count: 1 })`,
  },
  {
    title: 'Actions',
    code: `import { action } from '@comwit/state'\nimport { counter } from './model'\n\nexport const counterActions = action(({ state }) => {\n  const m = state(counter)\n\n  return {\n    increment() { m.count += 1 },\n    reset() { m.count = 1 },\n  }\n})`,
  },
  {
    title: 'Class',
    code: `import { action } from '@comwit/state'\nimport { counter } from './model'\n\nexport const counterActions = action(({ state }) => {\n  class Actions {\n    private m = state(counter)\n\n    increment() { this.m.count += 1 }\n    reset() { this.m.count = 1 }\n  }\n\n  return new Actions()\n})`,
  },
  {
    title: 'React',
    code: `'use client'\n\nimport { create, ComwitProvider } from '@comwit/state'\nimport { counter } from './model'\nimport { counterActions } from './actions'\n\ntype Actions = { increment(): void; reset(): void }\nconst useCounter = create<{ count: number }, Actions>(\n  counter, { actions: [counterActions] }\n)\n\nfunction Counter() {\n  const { count, actions } = useCounter((s) => ({ count: s.count, actions: s.actions }))\n  return <button onClick={actions.increment}>{count}</button>\n}\n\nexport default function App() {\n  return <ComwitProvider><Counter /></ComwitProvider>\n}`,
  },
].map((example) => ({
  ...example,
  html: hljs.highlight(example.code, { language: 'typescript' }).value,
}))
