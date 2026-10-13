import remarkStableAnchors from '@/lib/remark-stable-anchors.mjs'
import { getLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { MDXRemote } from 'next-mdx-remote/rsc'
import { getAllDocs, getDocBySlug } from '@/lib/mdx'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import rehypeSlug from 'rehype-slug'

export function generateStaticParams() {
  const docs = getAllDocs()
  return docs
    .filter((doc) => doc.slug !== '')
    .map((doc) => ({
      slug: doc.slug.split('/'),
    }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params
  const doc = getDocBySlug(slug.join('/'), await getLocale())
  if (!doc) return {}
  return { title: `${doc.title} · Comwit State` }
}

export default async function DocPage({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params
  const doc = getDocBySlug(slug.join('/'), await getLocale())
  if (!doc) notFound()

  return (
    <article className="prose max-w-none">
      <MDXRemote
        source={doc.content}
        options={{
          mdxOptions: {
            remarkPlugins: [remarkGfm, remarkStableAnchors],
            rehypePlugins: [rehypeSlug, rehypeHighlight],
          },
        }}
      />
    </article>
  )
}
