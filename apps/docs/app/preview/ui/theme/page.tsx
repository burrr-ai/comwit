import { ThemeEditor } from '../../../ui/_components/theme-editor'
import { Providers } from '../../../ui/providers'
import '../../../ui/ui.css'

export const metadata = { robots: { index: false, follow: false } }

/** The /ui/theming iframe isolates token edits from the surrounding docs shell. */
export default function ThemePreview() {
  return (
    <Providers>
      <main className="ui-scope min-h-svh bg-background font-sans text-foreground antialiased">
        <ThemeEditor />
      </main>
    </Providers>
  )
}
