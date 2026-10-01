import Link from 'next/link'
import { notFound } from 'next/navigation'
import { MDXRemote } from 'next-mdx-remote/rsc'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import rehypeSlug from 'rehype-slug'
import { getTemplateDoc, getTemplateDocs } from '@/lib/template-docs'
import { TableOfContents } from '../../_components/toc'

export function generateStaticParams() {
  return getTemplateDocs().map((doc) => ({ slug: doc.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const doc = getTemplateDoc(slug)
  if (!doc) return {}
  return { title: doc.title, description: doc.description }
}

export default async function TemplateDocPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const doc = getTemplateDoc(slug)
  if (!doc) notFound()
  const docs = getTemplateDocs()
  const index = docs.findIndex((d) => d.slug === slug)
  const previous = index > 0 ? docs[index - 1] : null
  const next = index < docs.length - 1 ? docs[index + 1] : null

  return (
    <div className="tp-doc">
      <div className="tp-doc-body">
        <article className="template-guide prose max-w-none">
          <MDXRemote
            source={doc.content}
            options={{
              mdxOptions: {
                remarkPlugins: [remarkGfm],
                rehypePlugins: [rehypeSlug, rehypeHighlight],
              },
            }}
          />
        </article>
        <nav className="tp-pager" aria-label="Guides">
          {previous ? (
            <Link href={`/template/docs/${previous.slug}`} rel="prev">
              <span>Previous</span>
              {previous.title}
            </Link>
          ) : (
            <Link href="/template" rel="prev">
              <span>Previous</span>
              Overview
            </Link>
          )}
          {next && (
            <Link href={`/template/docs/${next.slug}`} rel="next" data-next>
              <span>Next</span>
              {next.title}
            </Link>
          )}
        </nav>
      </div>
      <aside className="tp-doc-aside">
        <TableOfContents />
      </aside>
    </div>
  )
}
