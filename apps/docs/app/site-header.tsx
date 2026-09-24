'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { SquaresFourIcon } from '@phosphor-icons/react/dist/csr/SquaresFour'
import { ArrowUpRightIcon } from '@phosphor-icons/react/dist/csr/ArrowUpRight'
import { Brand } from './brand'

export function SiteHeader({ home = false }: { home?: boolean }) {
  const pathname = usePathname()
  return (
    <header className={`site-header ${home ? 'site-header-home' : ''}`}>
      <Brand />
      <nav aria-label="Libraries">
        <Link
          href="/state/docs"
          className="product-nav"
          aria-current={pathname.startsWith('/state') ? 'page' : undefined}
        >
          <Image src="/panda-mark.webp" alt="" width={28} height={28} />
          <span>State</span>
        </Link>
        <Link
          href="/ui"
          className="product-nav"
          aria-current={pathname.startsWith('/ui') ? 'page' : undefined}
        >
          <SquaresFourIcon size={23} weight="fill" aria-hidden="true" />
          <span>UI</span>
        </Link>
        <a
          className="github-nav"
          href="https://github.com/burrr-ai/comwit"
          target="_blank"
          rel="noreferrer"
        >
          GitHub
          <ArrowUpRightIcon size={14} aria-hidden="true" />
        </a>
      </nav>
    </header>
  )
}
