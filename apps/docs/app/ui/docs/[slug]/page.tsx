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
function read(slug: string) {
  if (!slugs.includes(slug)) notFound()
  return matter(fs.readFileSync(path.join(process.cwd(), 'content/ui', `${slug}.mdx`), 'utf8'))
}
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return { title: read(slug).data.title }
}
export default async function Guide({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return (
    <article className="ui-guide prose max-w-none">
      <MDXRemote
        source={read(slug).content}
        options={{ mdxOptions: { remarkPlugins: [remarkGfm], rehypePlugins: [rehypeHighlight] } }}
      />
    </article>
  )
}
