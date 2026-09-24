import { ThemeEditor } from '../../../ui/_components/theme-editor'
import { Providers } from '../../../ui/providers'
import '../../../ui/ui.css'

export const metadata = { robots: { index: false, follow: false } }

/** /ui/theming 의 iframe 안 — 토큰을 바꿔도 바깥 docs 셸에는 번지지 않는다. */
export default function ThemePreview() {
  return (
    <Providers>
      <main className="ui-scope min-h-svh bg-background font-sans text-foreground antialiased">
        <ThemeEditor />
      </main>
    </Providers>
  )
}
