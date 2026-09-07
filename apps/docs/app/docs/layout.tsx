import { getAllDocs, type DocMeta } from '@/lib/mdx'
import { SiteHeader } from '../site-header'
import { DocsSidebar } from './sidebar'
import { TableOfContents } from './toc'

function groupDocs(docs: DocMeta[]) {
  const ungrouped: DocMeta[] = []
  const groups: Record<string, DocMeta[]> = {}
  for (const doc of docs) {
    if (doc.group) {
      if (!groups[doc.group]) groups[doc.group] = []
      groups[doc.group].push(doc)
    } else ungrouped.push(doc)
  }
  return { ungrouped, groups }
}

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  const { ungrouped, groups } = groupDocs(getAllDocs())
  return (
    <>
      <a href="#docs-content" className="skip-link">
        Skip to content
      </a>
      <div className="docs-header">
        <SiteHeader />
      </div>
      <div className="docs-shell">
        <DocsSidebar ungrouped={ungrouped} groups={groups} />
        <div className="docs-reading">
          <main id="docs-content" className="docs-main">
            <div>{children}</div>
          </main>
          <aside className="docs-toc">
            <div>
              <TableOfContents />
            </div>
          </aside>
        </div>
      </div>
    </>
  )
}
