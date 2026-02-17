import Link from 'next/link'
import { getAllBlogPosts } from '@/lib/blog'

export const metadata = {
  title: 'Blog — comwit',
}

export default function BlogListPage() {
  const posts = getAllBlogPosts()

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-foreground">Blog</h1>
      <p className="mt-2 text-sm text-muted">Updates, guides, and announcements from comwit.</p>

      <div className="mt-10 space-y-8">
        {posts.map((post) => (
          <Link key={post.slug} href={`/blog/${post.slug}`} className="block group">
            <time className="text-xs text-muted">{post.date}</time>
            <h2 className="mt-1 text-base font-semibold text-foreground group-hover:underline">
              {post.title}
            </h2>
            {post.description && <p className="mt-1 text-sm text-muted">{post.description}</p>}
          </Link>
        ))}

        {posts.length === 0 && <p className="text-sm text-muted">No posts yet.</p>}
      </div>
    </div>
  )
}
