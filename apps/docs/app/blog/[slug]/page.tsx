import { notFound } from 'next/navigation'
import Link from 'next/link'
import { MDXRemote } from 'next-mdx-remote/rsc'
import { getAllBlogPosts, getBlogPostBySlug } from '@/lib/blog'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'

export function generateStaticParams() {
  const posts = getAllBlogPosts()
  return posts.map((post) => ({ slug: post.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = getBlogPostBySlug(slug)
  if (!post) return {}
  return { title: `${post.title} — comwit blog` }
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = getBlogPostBySlug(slug)
  if (!post) notFound()

  return (
    <div>
      <Link href="/blog" className="blog-back-link">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M19 12H5" />
          <path d="m12 19-7-7 7-7" />
        </svg>
        Back to blog
      </Link>

      <header className="blog-post-header">
        <h1 className="blog-title">{post.title}</h1>
        <div className="blog-post-meta">
          <time dateTime={post.date}>{post.date}</time>
          {post.author && <span>by {post.author}</span>}
        </div>
      </header>

      <article className="blog-prose prose prose-neutral max-w-none">
        <MDXRemote
          source={post.content}
          options={{
            mdxOptions: {
              remarkPlugins: [remarkGfm],
              rehypePlugins: [rehypeHighlight],
            },
          }}
        />
      </article>
    </div>
  )
}
