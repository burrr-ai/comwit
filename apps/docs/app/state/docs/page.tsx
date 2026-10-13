import { localizeMetadata } from '@/i18n/metadata'

import { Copy } from '@/i18n/copy'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { CopyButton } from '../../copy-button'
import { StateDemo } from '../../state-demo'
import { GardenScene } from '../../garden-scene'
import { Brand } from '../../brand'
import { counterExamples } from '@/lib/counter-examples'

const metadata = { title: 'Introduction · Comwit State' }

export default function StateIntroduction() {
  const copy = useTranslations('Copy')

  return (
    <div className="state-docs-original">
      <GardenScene>
        <div className="hero-main">
          <div className="hero-copy">
            <h1>
              <Copy id="text018" /> <br />
              <Copy id="text019" />{' '}
              <em>
                <Copy id="text020" />
              </em>
            </h1>
          </div>
          <div className="hero-right">
            <p className="hero-description">
              <Copy id="text021" /> <br />
              <Copy id="text022" /> <a href="/state/llms.txt">llms.txt</a>.
            </p>
            <div className="hero-actions">
              <CopyButton text="https://library.comwit.io/state/llms.txt" className="button-lilac">
                <Copy id="text024" />{' '}
              </CopyButton>
              <Link href="/state/docs/guide/quickstart" className="hero-docs-link">
                <Copy id="text025" />{' '}
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

      <section className="proof-strip" aria-label={copy('text027')}>
        <p>
          {copy.rich('productionProof', {
            site: (chunks) => (
              <a href="https://comwit.io" target="_blank" rel="noreferrer">
                {chunks}
              </a>
            ),
          })}
        </p>
        <p>
          <strong>1,000+</strong>
          <span>
            <Copy id="text031" />
          </span>
        </p>
      </section>

      <section id="why-comwit" className="home-story">
        <div>
          <h2>
            <Copy id="text032" /> <br />
            <Copy id="text033" />{' '}
          </h2>
          <p>
            <Copy id="text034" />{' '}
          </p>
          <Link className="text-link" href="/state/docs/guide/quickstart">
            <Copy id="text035" />{' '}
          </Link>
        </div>
        <div className="feature-list">
          <Link href="/state/docs/llm-setup">
            <div>
              <h3>
                <Copy id="text036" />
              </h3>
              <p>
                <Copy id="text037" />{' '}
              </p>
            </div>
          </Link>
          <Link href="/state/docs/api/query">
            <div>
              <h3>
                <Copy id="text038" />
              </h3>
              <p>
                <Copy id="text039" />
              </p>
            </div>
          </Link>
          <Link href="/state/docs/api/local">
            <div>
              <h3>
                <Copy id="text040" />
              </h3>
              <p>
                <Copy id="text041" />{' '}
              </p>
            </div>
          </Link>
        </div>
      </section>

      <section className="agent-strip">
        <div>
          <h2>
            <Copy id="text042" />
          </h2>
        </div>
        <div>
          <CopyButton text="https://library.comwit.io/state/llms.txt" className="agent-url">
            <code>library.comwit.io/state/llms.txt</code>
          </CopyButton>
        </div>
      </section>
      <footer className="site-footer">
        <Brand />
        <p>
          <Copy id="text044" />
        </p>
        <a href="https://burrr.ai" target="_blank" rel="noreferrer">
          <Copy id="text045" />{' '}
        </a>
      </footer>
    </div>
  )
}

export async function generateMetadata() {
  return localizeMetadata(metadata)
}
