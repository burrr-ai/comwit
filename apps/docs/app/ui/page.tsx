import Link from 'next/link'
import { UiShowcase } from './_components/showcase'
import { CliCommand } from './_components/cli-command'
import { SquaresFourIcon } from '@phosphor-icons/react/dist/ssr/SquaresFour'
import { ArrowUpRightIcon } from '@phosphor-icons/react/dist/ssr/ArrowUpRight'
import { uiVersion } from '@/lib/products'
import { components } from './_generated/catalog'

export default function UiIntroduction() {
  return (
    <article className="ui-overview ui-doc-introduction">
      <p className="product-eyebrow">INTRODUCTION / {uiVersion}</p>
      <h1 className="ui-intro-title">
        <SquaresFourIcon size={42} weight="fill" aria-hidden="true" />
        Comwit UI
      </h1>
      <p className="product-description">Headless behavior. Components you can make your own.</p>
      <div className="ui-intro-install">
        <CliCommand command="npx comwit-ui@latest init" />
        <CliCommand command="npx comwit-ui@latest add button dialog input" />
      </div>
      <div className="ui-doc-shortcuts">
        <Link href="/ui/docs/installation">
          Installation <ArrowUpRightIcon size={14} aria-hidden="true" />
        </Link>
        <Link href="/ui/components">
          {components.length} components <ArrowUpRightIcon size={14} aria-hidden="true" />
        </Link>
        <a href="/ui/llms.txt">
          llms.txt <ArrowUpRightIcon size={14} aria-hidden="true" />
        </a>
      </div>
      <div className="state-example-heading">
        <h2>A few pieces, together.</h2>
        <span>TRY IT ↓</span>
      </div>
      <div className="showcase-frame">
        <UiShowcase />
      </div>
    </article>
  )
}
