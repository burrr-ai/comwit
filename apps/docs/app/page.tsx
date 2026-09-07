import Link from 'next/link'
import hljs from 'highlight.js/lib/core'
import typescript from 'highlight.js/lib/languages/typescript'
import { SiteHeader } from './site-header'
import { CopyButton } from './copy-button'
import { StateDemo } from './state-demo'
import { GardenScene } from './garden-scene'

hljs.registerLanguage('typescript', typescript)

const examples = [
  {
    title: 'Model',
    file: 'state/counter/model.ts',
    code: `import { model } from '@comwit/state'\n\nexport type CounterState = {\n  count: number\n}\n\nexport const counter = model<CounterState>({\n  count: 1,\n})`,
    note: 'Your state is just an object. Start there.',
    href: '/docs/api/model',
  },
  {
    title: 'Actions',
    file: 'state/counter/actions.ts',
    code: `import { action } from '@comwit/state'\nimport { counter } from './model'\n\nexport const counterActions = action(({ state }) => ({\n  increment() {\n    state(counter).count += 1\n  },\n  reset() {\n    state(counter).count = 1\n  },\n}))`,
    note: 'Give changes a name. Mutate state directly.',
    href: '/docs/api/action',
  },
  {
    title: 'React',
    file: 'state/counter/index.tsx',
    code: `'use client'\n\nimport { create, ComwitProvider } from '@comwit/state'\nimport { counter, type CounterState } from './model'\nimport { counterActions } from './actions'\n\ntype Actions = { increment(): void; reset(): void }\nconst useCounter = create<CounterState, Actions>(\n  counter, { actions: [counterActions] }\n)\n\nfunction Counter() {\n  const { count, actions } = useCounter()\n  return <button onClick={actions.increment}>{count}</button>\n}\n\nexport default function App() {\n  return <ComwitProvider><Counter /></ComwitProvider>\n}`,
    note: 'Read through a hook. React follows along.',
    href: '/docs/api/create',
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
            <p className="eyebrow">REACT STATE MANAGEMENT, IN GOOD COMPANY</p>
            <h1>
              A little state.
              <br />A lot of <em>possibility.</em>
            </h1>
          </div>
          <div className="hero-right">
            <p className="hero-description">
              Built for you and your coding agent.
              <br />
              One <a href="/llms.txt">llms.txt</a>. Then get back to making things.
            </p>
            <div className="hero-actions">
              <CopyButton text="https://library.comwit.io/llms.txt" className="button-lilac">
                Give your agent llms.txt
              </CopyButton>
              <Link href="/docs/guide/quickstart" className="hero-docs-link">
                Get started
              </Link>
            </div>
            <StateDemo examples={examples} />
          </div>
        </main>
        <div className="hero-bottom">
          <span>Move your cursor. Stay a little.</span>
          <CopyButton text="npm i @comwit/state" className="install-command">
            <code>npm i @comwit/state</code>
          </CopyButton>
          <a href="#why-comwit">Meet comwit</a>
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
          <span>projects use comwit</span>
        </p>
        <p>
          Made for React.
          <br />
          Ready for your coding agent.
        </p>
      </section>

      <section id="why-comwit" className="home-story">
        <div>
          <p className="eyebrow">SMALL SURFACE. ROOM TO GROW.</p>
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
            <span>01</span>
            <div>
              <h3>One file. Your agent is up to speed.</h3>
              <p>
                Pass in llms.txt for the core patterns. Detailed references are there when you need
                them.
              </p>
            </div>
          </Link>
          <Link href="/docs/api/query">
            <span>02</span>
            <div>
              <h3>Client state. Server data. Together.</h3>
              <p>Reactive models, query loading, and server hydration in the same domain.</p>
            </div>
          </Link>
          <Link href="/docs/api/local">
            <span>03</span>
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
          <p className="eyebrow">YOUR NEXT FEATURE STARTS HERE</p>
          <h2>Let your agent meet comwit.</h2>
        </div>
        <div>
          <CopyButton text="https://library.comwit.io/llms.txt" className="agent-url">
            <code>library.comwit.io/llms.txt</code>
          </CopyButton>
          <a href="/llms.txt">Or read it yourself</a>
        </div>
      </section>
      <footer className="site-footer">
        <Link href="/" className="wordmark">
          comwit<span>.</span>
        </Link>
        <p>Open source. MIT licensed.</p>
        <a href="https://burrr.ai" target="_blank" rel="noreferrer">
          Supported by burrr.ai
        </a>
        <a href="https://github.com/meursyphus/comwit" target="_blank" rel="noreferrer">
          Made in the open
        </a>
      </footer>
    </>
  )
}
