import Link from 'next/link'
import { getAllBlogPosts } from '@/lib/blog'
import { RelativeTime } from './relative-time'

export const metadata = {
  title: 'Blog — comwit',
}

export default function BlogListPage() {
  const posts = getAllBlogPosts()

  return (
    <div>
      <h1 className="blog-title">Blog</h1>
      <p className="blog-description">Updates, guides, and announcements from comwit.</p>

      <div className="blog-list">
        {posts.map((post) => (
          <Link key={post.slug} href={`/blog/${post.slug}`} className="blog-list-item">
            <RelativeTime date={post.date} />
            <h2>{post.title}</h2>
            {post.description && <p>{post.description}</p>}
          </Link>
        ))}

        {posts.length === 0 && <p className="blog-description">No posts yet.</p>}
      </div>
    </div>
  )
}
