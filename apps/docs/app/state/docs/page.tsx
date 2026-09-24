import { MDXRemote } from 'next-mdx-remote/rsc'
import { getDocBySlug } from '@/lib/mdx'
import { notFound } from 'next/navigation'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import rehypeSlug from 'rehype-slug'

export const metadata = {
  title: 'Introduction — comwit docs',
}

export default function DocsIndexPage() {
  const doc = getDocBySlug('')
  if (!doc) notFound()

  return (
    <article className="prose max-w-none">
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
  )
}
