import Link from 'next/link'
import { Brand } from './brand'

export function SiteHeader({ home = false }: { home?: boolean }) {
  return (
    <header className={`site-header ${home ? 'site-header-home' : ''}`}>
      <Brand />
      <nav aria-label="Main navigation">
        <Link href="/docs">Docs</Link>
        <Link href="/blog">Blog</Link>
        <a href="https://github.com/meursyphus/comwit" target="_blank" rel="noreferrer">
          GitHub
        </a>
      </nav>
    </header>
  )
}
