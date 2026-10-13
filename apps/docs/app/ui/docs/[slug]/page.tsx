import rehypeSlug from 'rehype-slug'
import remarkStableAnchors from '@/lib/remark-stable-anchors.mjs'
import { getLocale } from 'next-intl/server'
import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'
import { notFound } from 'next/navigation'
import { MDXRemote } from 'next-mdx-remote/rsc'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'

const slugs = ['installation', 'primitives']
export function generateStaticParams() {
  return slugs.map((slug) => ({ slug }))
}
function read(slug: string, locale: string) {
  if (!slugs.includes(slug)) notFound()
  return matter(
    fs.readFileSync(
      path.join(process.cwd(), 'content', locale === 'ko' ? 'ko' : '', 'ui', `${slug}.mdx`),
      'utf8'
    )
  )
}
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return { title: read(slug, await getLocale()).data.title }
}
export default async function Guide({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return (
    <article className="ui-guide prose max-w-none">
      <MDXRemote
        source={read(slug, await getLocale()).content}
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
