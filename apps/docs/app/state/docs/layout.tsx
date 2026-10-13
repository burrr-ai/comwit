import { getLocale } from 'next-intl/server'
import { getAllDocs, type DocMeta } from '@/lib/mdx'
import { DocsSidebar } from './sidebar'
import { StateDocsFrame } from './reading'

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

export default async function DocsLayout({ children }: { children: React.ReactNode }) {
  const { ungrouped, groups } = groupDocs(getAllDocs(await getLocale()))
  return (
    <StateDocsFrame navigation={<DocsSidebar ungrouped={ungrouped} groups={groups} />}>
      {children}
    </StateDocsFrame>
  )
}
