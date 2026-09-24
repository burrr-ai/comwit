import Image from 'next/image'
import Link from 'next/link'
import { ArrowUpRightIcon } from '@phosphor-icons/react/dist/ssr/ArrowUpRight'
import { SquaresFourIcon } from '@phosphor-icons/react/dist/ssr/SquaresFour'
import { SiteHeader } from './site-header'

export default function Home() {
  return (
    <div className="libraries-home">
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <SiteHeader />
      <main id="main" className="libraries-main">
        <p className="libraries-eyebrow">OPEN SOURCE / REACT</p>
        <h1 className="libraries-wordmark">
          comwit<span>.</span>
        </h1>
        <p className="libraries-intro">
          The building blocks behind <a href="https://comwit.io">comwit.io</a>.
        </p>
        <div className="library-links">
          <Link href="/state" className="library-link state-library">
            <span className="library-symbol">
              <Image src="/panda-mark.webp" alt="" width={48} height={48} />
            </span>
            <span className="library-label">
              <strong>State</strong>
              <span>One domain. One hook.</span>
            </span>
            <ArrowUpRightIcon size={24} aria-hidden="true" />
          </Link>
          <Link href="/ui" className="library-link ui-library">
            <span className="library-symbol">
              <SquaresFourIcon size={37} weight="fill" aria-hidden="true" />
            </span>
            <span className="library-label">
              <strong>UI</strong>
              <span>Make it your own.</span>
            </span>
            <ArrowUpRightIcon size={24} aria-hidden="true" />
          </Link>
        </div>
      </main>
      <footer className="libraries-footer">
        <span>Small pieces. Yours to build with.</span>
        <div>
          <Link href="/blog">Releases</Link>
          <a href="https://github.com/burrr-ai/comwit/blob/latest/LICENSE">MIT licensed</a>
        </div>
      </footer>
    </div>
  )
}
