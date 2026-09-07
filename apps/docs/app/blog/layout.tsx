import { SiteHeader } from '../site-header'

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main className="blog-main">{children}</main>
    </>
  )
}
