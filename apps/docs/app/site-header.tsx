'use client'

import { useTranslations } from 'next-intl'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { SquaresFourIcon } from '@phosphor-icons/react/dist/csr/SquaresFour'
import { TreeStructureIcon } from '@phosphor-icons/react/dist/csr/TreeStructure'
import { ArrowUpRightIcon } from '@phosphor-icons/react/dist/csr/ArrowUpRight'
import { Brand } from './brand'
import { LocaleSwitch } from './locale-switch'

const PRODUCTS = {
  state: {
    href: '/state/docs',
    label: 'State',
    mark: <Image src="/panda-mark.webp" alt="" width={28} height={28} />,
  },
  ui: {
    href: '/ui',
    label: 'UI',
    mark: <SquaresFourIcon size={23} weight="fill" aria-hidden="true" />,
  },
  template: {
    href: '/template',
    label: 'Template',
    mark: <TreeStructureIcon size={23} weight="fill" aria-hidden="true" />,
  },
}

function GitHubLink() {
  return (
    <a
      className="github-nav"
      href="https://github.com/burrr-ai/comwit"
      target="_blank"
      rel="noreferrer"
    >
      GitHub
      <ArrowUpRightIcon size={14} aria-hidden="true" />
    </a>
  )
}

/**
 * Landing and blog headers link to all libraries. Inside a product, show its identity as `comwit. / UI`; the wordmark returns home and `menu` opens navigation on narrow screens.
 */
export function SiteHeader({
  home = false,
  product,
  menu,
}: {
  home?: boolean
  product?: keyof typeof PRODUCTS
  menu?: React.ReactNode
}) {
  const copy = useTranslations('Copy')

  const pathname = usePathname()

  if (product) {
    const { href, label, mark } = PRODUCTS[product]
    return (
      <header className="site-header app-header product-header">
        <div className="product-brand">
          <Brand />
          <span className="product-slash" aria-hidden="true">
            /
          </span>
          <Link href={href} className="product-home">
            {mark}
            <span>{label}</span>
          </Link>
        </div>
        <nav aria-label={copy('text105')}>
          <LocaleSwitch />
          <GitHubLink />
          {menu}
        </nav>
      </header>
    )
  }

  return (
    <header className={`site-header app-header ${home ? 'site-header-home' : ''}`}>
      <Brand />
      <nav aria-label={copy('text106')}>
        {(Object.keys(PRODUCTS) as (keyof typeof PRODUCTS)[]).map((key) => (
          <Link
            key={key}
            href={PRODUCTS[key].href}
            aria-label={PRODUCTS[key].label}
            className="product-nav"
            aria-current={pathname.startsWith(`/${key}`) ? 'page' : undefined}
          >
            {PRODUCTS[key].mark}
            <span>{PRODUCTS[key].label}</span>
          </Link>
        ))}
        <LocaleSwitch />
        <GitHubLink />
      </nav>
    </header>
  )
}
