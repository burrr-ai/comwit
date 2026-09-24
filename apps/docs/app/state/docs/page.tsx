import Link from 'next/link'
import { CopyButton } from '../../copy-button'
import { StateDemo } from '../../state-demo'
import { GardenScene } from '../../garden-scene'
import { Brand } from '../../brand'
import { counterExamples } from '@/lib/counter-examples'

export const metadata = { title: 'Introduction · Comwit State' }

export default function StateIntroduction() {
  return (
    <div className="state-docs-original">
      <GardenScene>
        <div className="hero-main">
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
              Just pass <a href="/state/llms.txt">llms.txt</a>.
            </p>
            <div className="hero-actions">
              <CopyButton text="https://library.comwit.io/state/llms.txt" className="button-lilac">
                Copy llms.txt
              </CopyButton>
              <Link href="/state/docs/guide/quickstart" className="hero-docs-link">
                Get started
              </Link>
            </div>
            <StateDemo examples={counterExamples} />
          </div>
        </div>
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
          <Link className="text-link" href="/state/docs/guide/quickstart">
            Get to know comwit
          </Link>
        </div>
        <div className="feature-list">
          <Link href="/state/docs/llm-setup">
            <div>
              <h3>One file. Your agent is up to speed.</h3>
              <p>
                Pass in llms.txt for the core patterns. Detailed references are there when you need
                them.
              </p>
            </div>
          </Link>
          <Link href="/state/docs/api/query">
            <div>
              <h3>Client state. Server data. Together.</h3>
              <p>Reactive models, query loading, and server hydration in the same domain.</p>
            </div>
          </Link>
          <Link href="/state/docs/api/local">
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
          <CopyButton text="https://library.comwit.io/state/llms.txt" className="agent-url">
            <code>library.comwit.io/state/llms.txt</code>
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
    </div>
  )
}
