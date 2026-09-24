import Image from 'next/image'
import Link from 'next/link'
import { ArrowUpRightIcon } from '@phosphor-icons/react/dist/ssr/ArrowUpRight'
import { CopyButton } from '../../copy-button'
import { StateDemo } from '../../state-demo'
import { counterExamples } from '@/lib/counter-examples'
import { stateVersion } from '@/lib/products'

export const metadata = { title: 'Introduction · Comwit State' }

export default function StateIntroduction() {
  return (
    <article className="state-introduction">
      <div className="state-doc-cover">
        <Image
          src="/panda-garden.webp"
          alt="A panda coding in a purple garden"
          fill
          priority
          sizes="(max-width: 600px) 100vw, 80vw"
        />
        <div className="state-cover-copy">
          <p>COMWIT STATE / {stateVersion}</p>
          <h1>
            A little state.
            <br />A lot of possibility.
          </h1>
          <span>One domain. One hook.</span>
        </div>
      </div>
      <div className="state-intro-commands">
        <CopyButton
          text="npm install @comwit/state"
          className="state-install"
          label="Copy State install command"
        >
          <code>npm install @comwit/state</code>
          <span>Copy</span>
        </CopyButton>
        <a href="/state/llms.txt">
          llms.txt <ArrowUpRightIcon size={14} aria-hidden="true" />
        </a>
      </div>
      <div className="state-example-heading">
        <h2>Start with a little state.</h2>
        <span>TRY IT ↓</span>
      </div>
      <div className="state-intro-demo">
        <StateDemo examples={counterExamples} />
      </div>
      <div className="state-next-links">
        <Link href="/state/docs/guide/quickstart">
          <span>01 / START</span>
          <strong>Your first domain</strong>
          <ArrowUpRightIcon size={22} aria-hidden="true" />
        </Link>
        <Link href="/state/docs/guide/nextjs">
          <span>02 / CONNECT</span>
          <strong>Next.js & server data</strong>
          <ArrowUpRightIcon size={22} aria-hidden="true" />
        </Link>
      </div>
    </article>
  )
}
