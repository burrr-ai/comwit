import { MDXRemote } from 'next-mdx-remote/rsc'
import { getDocBySlug } from '@/lib/mdx'
import { notFound } from 'next/navigation'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'

export const metadata = {
  title: 'Why comwit — comwit docs',
}

export default function DocsIndexPage() {
  const doc = getDocBySlug('')
  if (!doc) notFound()

  return (
    <article className="prose prose-neutral max-w-none text-foreground/80 prose-headings:text-foreground prose-headings:font-semibold prose-h1:text-2xl prose-h2:text-lg prose-p:text-sm prose-p:leading-relaxed prose-hr:border-border prose-strong:text-foreground">
      <MDXRemote
        source={doc.content}
        options={{
          mdxOptions: {
            remarkPlugins: [remarkGfm],
            rehypePlugins: [rehypeHighlight],
          },
        }}
      />
    </article>
  )
}
