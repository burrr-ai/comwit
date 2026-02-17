import Link from 'next/link'

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background font-sans">
      <nav className="mx-auto flex max-w-3xl items-center justify-between px-6 py-6">
        <Link href="/" className="flex items-center gap-2">
          <img src="/logo.svg" alt="comwit" width={24} height={24} />
          <span className="text-base font-semibold tracking-tight text-foreground">comwit</span>
        </Link>
        <div className="flex items-center gap-6 text-sm">
          <Link href="/docs" className="text-muted transition-colors hover:text-foreground">
            Docs
          </Link>
          <Link href="/blog" className="text-muted transition-colors hover:text-foreground">
            Blog
          </Link>
        </div>
      </nav>
      <main className="mx-auto max-w-3xl px-6 pb-24 pt-8">{children}</main>
    </div>
  )
}
