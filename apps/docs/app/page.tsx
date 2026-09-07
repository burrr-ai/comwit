import Link from 'next/link'
import hljs from 'highlight.js/lib/core'
import typescript from 'highlight.js/lib/languages/typescript'
import { SiteHeader } from './site-header'
import { CopyButton } from './copy-button'
import { StateDemo } from './state-demo'
import { GardenScene } from './garden-scene'
import { Brand } from './brand'

hljs.registerLanguage('typescript', typescript)

const examples = [
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
    code: `'use client'\n\nimport { create, ComwitProvider } from '@comwit/state'\nimport { counter } from './model'\nimport { counterActions } from './actions'\n\ntype Actions = { increment(): void; reset(): void }\nconst useCounter = create<{ count: number }, Actions>(\n  counter, { actions: [counterActions] }\n)\n\nfunction Counter() {\n  const { count, actions } = useCounter()\n  return <button onClick={actions.increment}>{count}</button>\n}\n\nexport default function App() {\n  return <ComwitProvider><Counter /></ComwitProvider>\n}`,
  },
].map((example) => ({
  ...example,
  html: hljs.highlight(example.code, { language: 'typescript' }).value,
}))

export default function Home() {
  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <GardenScene>
        <SiteHeader home />
        <main id="main" className="hero-main">
          <div className="hero-copy">
            <h1>
              A little state.
              <br />A lot of <em>possibility.</em>
            </h1>
          </div>
          <div className="hero-right">
            <p className="hero-description">
              React state for you and your agent.
              <br />
              Just pass <a href="/llms.txt">llms.txt</a>.
            </p>
            <div className="hero-actions">
              <CopyButton text="https://library.comwit.io/llms.txt" className="button-lilac">
                Copy llms.txt
              </CopyButton>
              <Link href="/docs/guide/quickstart" className="hero-docs-link">
                Get started
              </Link>
            </div>
            <StateDemo examples={examples} />
          </div>
        </main>
        <div className="hero-bottom">
          <CopyButton text="npm i @comwit/state" className="install-command">
            <code>npm i @comwit/state</code>
          </CopyButton>
        </div>
      </GardenScene>

      <section className="proof-strip" aria-label="Used in production">
        <p>
          At home in{' '}
          <a href="https://comwit.io" target="_blank" rel="noreferrer">
            comwit.io
          </a>
          ,<br />
          the vibe coding platform.
        </p>
        <p>
          <strong>1,000+</strong>
          <span>projects</span>
        </p>
      </section>

      <section id="why-comwit" className="home-story">
        <div>
          <h2>
            Keep the idea.
            <br />
            Lose the ceremony.
          </h2>
          <p>
            State, actions, and a hook. A predictable pattern for you and your agent, from the first
            counter to the whole app.
          </p>
          <Link className="text-link" href="/docs">
            Get to know comwit
          </Link>
        </div>
        <div className="feature-list">
          <Link href="/docs/llm-setup">
            <div>
              <h3>One file. Your agent is up to speed.</h3>
              <p>
                Pass in llms.txt for the core patterns. Detailed references are there when you need
                them.
              </p>
            </div>
          </Link>
          <Link href="/docs/api/query">
            <div>
              <h3>Client state. Server data. Together.</h3>
              <p>Reactive models, query loading, and server hydration in the same domain.</p>
            </div>
          </Link>
          <Link href="/docs/api/local">
            <div>
              <h3>A little memory goes a long way.</h3>
              <p>
                Persist preferences. Restore local data. Add history when your app calls for it.
              </p>
            </div>
          </Link>
        </div>
      </section>

      <section className="agent-strip">
        <div>
          <h2>Let your agent meet comwit.</h2>
        </div>
        <div>
          <CopyButton text="https://library.comwit.io/llms.txt" className="agent-url">
            <code>library.comwit.io/llms.txt</code>
          </CopyButton>
        </div>
      </section>
      <footer className="site-footer">
        <Brand />
        <p>Open source. MIT licensed.</p>
        <a href="https://burrr.ai" target="_blank" rel="noreferrer">
          Supported by burrr.ai
        </a>
      </footer>
    </>
  )
}
