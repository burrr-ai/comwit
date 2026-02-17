import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

const BLOG_DIR = path.join(process.cwd(), 'content/blog')

export interface BlogPostMeta {
  title: string
  slug: string
  date: string
  description: string
  author: string
}

export interface BlogPost extends BlogPostMeta {
  content: string
}

function getBlogMdxFiles(): string[] {
  if (!fs.existsSync(BLOG_DIR)) return []
  const entries = fs.readdirSync(BLOG_DIR, { withFileTypes: true })
  return entries
    .filter((entry) => !entry.isDirectory() && entry.name.endsWith('.mdx'))
    .map((entry) => entry.name)
}

export function getAllBlogPosts(): BlogPostMeta[] {
  const files = getBlogMdxFiles()
  return files
    .map((file) => {
      const raw = fs.readFileSync(path.join(BLOG_DIR, file), 'utf-8')
      const { data } = matter(raw)
      const slug = file.replace(/\.mdx$/, '')
      return {
        title: data.title as string,
        slug,
        date: data.date as string,
        description: (data.description as string) || '',
        author: (data.author as string) || '',
      }
    })
    .sort((a, b) => (a.date > b.date ? -1 : 1))
}

export function getBlogPostBySlug(slug: string): BlogPost | null {
  const filePath = path.join(BLOG_DIR, `${slug}.mdx`)
  if (!fs.existsSync(filePath)) return null
  const raw = fs.readFileSync(filePath, 'utf-8')
  const { data, content } = matter(raw)
  return {
    title: data.title as string,
    slug,
    date: data.date as string,
    description: (data.description as string) || '',
    author: (data.author as string) || '',
    content,
  }
}
