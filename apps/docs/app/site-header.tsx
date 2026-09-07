import Link from 'next/link'
import packageInfo from '../../../packages/comwit/package.json'

export function SiteHeader({ home = false }: { home?: boolean }) {
  return (
    <header className={`site-header ${home ? 'site-header-home' : ''}`}>
      <Link href="/" className="wordmark" aria-label="comwit home">
        comwit<span>.</span>
      </Link>
      <nav aria-label="Main navigation">
        <Link href="/docs">Docs</Link>
        <Link href="/blog">Blog</Link>
        <a href="https://github.com/meursyphus/comwit" target="_blank" rel="noreferrer">
          GitHub
        </a>
        <a className="version-link" href="/blog/v2.3.0-release">
          v{packageInfo.version}
        </a>
      </nav>
    </header>
  )
}
