import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

const contentDir = (locale: string) =>
  path.join(process.cwd(), 'content', locale === 'ko' ? 'ko' : '', 'blog')

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

function getBlogMdxFiles(locale: string): string[] {
  if (!fs.existsSync(contentDir(locale))) return []
  const entries = fs.readdirSync(contentDir(locale), { withFileTypes: true })
  return entries
    .filter((entry) => !entry.isDirectory() && entry.name.endsWith('.mdx'))
    .map((entry) => entry.name)
}

export function getAllBlogPosts(locale = 'en'): BlogPostMeta[] {
  const files = getBlogMdxFiles(locale)
  return files
    .map((file) => {
      const raw = fs.readFileSync(path.join(contentDir(locale), file), 'utf-8')
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

export function getBlogPostBySlug(slug: string, locale = 'en'): BlogPost | null {
  if (!/^[a-z0-9.-]+$/.test(slug) || slug.includes('..')) return null
  const filePath = path.join(contentDir(locale), `${slug}.mdx`)
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
