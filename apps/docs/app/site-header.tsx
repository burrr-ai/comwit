'use client'

import { useTranslations } from 'next-intl'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ArrowUpRightIcon } from '@phosphor-icons/react/dist/csr/ArrowUpRight'
import { Brand } from './brand'
import { LocaleSwitch } from './locale-switch'
import { ProductMark, products, type Product } from './product-mark'

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
  product?: Product
  menu?: React.ReactNode
}) {
  const copy = useTranslations('Copy')

  const pathname = usePathname()

  if (product) {
    const { href, label } = products[product]
    return (
      <header className="site-header app-header product-header">
        <div className="product-brand">
          <Brand />
          <span className="product-slash" aria-hidden="true">
            /
          </span>
          <Link
            href={href}
            className="product-home"
            aria-current={pathname === href ? 'page' : undefined}
          >
            <ProductMark product={product} />
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
      <nav className="product-navigation" aria-label={copy('text106')}>
        {(Object.keys(products) as Product[]).map((key) => (
          <Link
            key={key}
            href={products[key].href}
            className="product-nav"
            data-product={key}
            aria-current={
              pathname === `/${key}` || pathname.startsWith(`/${key}/`) ? 'page' : undefined
            }
          >
            <ProductMark product={key} />
            <span>{products[key].label}</span>
          </Link>
        ))}
      </nav>
      <div className="header-actions">
        <LocaleSwitch />
        <GitHubLink />
      </div>
    </header>
  )
}
