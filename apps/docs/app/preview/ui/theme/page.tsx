import { ThemeEditor } from '../../../ui/_components/theme-editor'
import { Providers } from '../../../ui/providers'

export const metadata = { robots: { index: false, follow: false } }
export default function ThemePreview() {
  return (
    <Providers>
      <main className="theme-preview">
        <ThemeEditor />
      </main>
    </Providers>
  )
}
