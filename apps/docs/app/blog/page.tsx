import { localizeMetadata } from '@/i18n/metadata'
import { getLocale } from 'next-intl/server'

import { Copy } from '@/i18n/copy'
import Link from 'next/link'
import { getAllBlogPosts } from '@/lib/blog'
import { RelativeTime } from './relative-time'

const metadata = {
  title: 'Blog — comwit',
}

export default async function BlogListPage() {
  const posts = getAllBlogPosts(await getLocale())

  return (
    <div>
      <h1 className="blog-title">
        <Copy id="text014" />
      </h1>
      <p className="blog-description">
        <Copy id="text015" />
      </p>

      <div className="blog-list">
        {posts.map((post) => (
          <Link key={post.slug} href={`/blog/${post.slug}`} className="blog-list-item">
            <RelativeTime date={post.date} />
            <h2>{post.title}</h2>
            {post.description && <p>{post.description}</p>}
          </Link>
        ))}

        {posts.length === 0 && (
          <p className="blog-description">
            <Copy id="text016" />
          </p>
        )}
      </div>
    </div>
  )
}

export async function generateMetadata() {
  return localizeMetadata(metadata)
}
