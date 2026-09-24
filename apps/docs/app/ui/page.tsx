import Link from 'next/link'
import { UiShowcase } from './_components/showcase'
import { CliCommand } from './_components/cli-command'

export default function UiHome() {
  return (
    <article className="ui-overview">
      <p className="product-eyebrow">COMWIT UI</p>
      <h1 className="product-headline">
        Make it
        <br />
        your own.
      </h1>
      <p className="product-description">Headless behavior. Components you can shape.</p>
      <div className="product-actions">
        <Link href="/ui/docs/installation" className="primary-link">
          Get started
        </Link>
        <Link href="/ui/components">Browse components ↗</Link>
      </div>
      <div className="showcase-frame">
        <UiShowcase />
      </div>
      <div className="ui-quick-install">
        <CliCommand command="npx comwit-ui@latest init" />
        <a href="/ui/llms.txt">Give your agent llms.txt ↗</a>
      </div>
    </article>
  )
}
