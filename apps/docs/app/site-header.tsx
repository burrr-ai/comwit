'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { SquaresFourIcon } from '@phosphor-icons/react/dist/csr/SquaresFour'
import { ArrowUpRightIcon } from '@phosphor-icons/react/dist/csr/ArrowUpRight'
import { Brand } from './brand'

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
 * 첫 진입(랜딩·블로그)에선 두 라이브러리로 가는 길을 보여주고, 라이브러리 안에선 그 라이브러리만의 헤더가 된다 —
 * `comwit. / UI`. 워드마크가 밖으로 나가는 길이고, `menu` 는 좁은 화면에서 내비를 여는 버튼 자리다.
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
        <nav aria-label="Site">
          <GitHubLink />
          {menu}
        </nav>
      </header>
    )
  }

  return (
    <header className={`site-header app-header ${home ? 'site-header-home' : ''}`}>
      <Brand />
      <nav aria-label="Libraries">
        {(Object.keys(PRODUCTS) as (keyof typeof PRODUCTS)[]).map((key) => (
          <Link
            key={key}
            href={PRODUCTS[key].href}
            className="product-nav"
            aria-current={pathname.startsWith(`/${key}`) ? 'page' : undefined}
          >
            {PRODUCTS[key].mark}
            <span>{PRODUCTS[key].label}</span>
          </Link>
        ))}
        <GitHubLink />
      </nav>
    </header>
  )
}
