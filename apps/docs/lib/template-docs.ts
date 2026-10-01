import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

const CONTENT_DIR = path.join(process.cwd(), 'content/template')

export interface TemplateDocMeta {
  title: string
  slug: string
  description?: string
  /** Sidebar group; docs keep their frontmatter order inside it. */
  group: string
  order: number
}

export interface TemplateDoc extends TemplateDocMeta {
  content: string
}

function read(file: string) {
  const raw = fs.readFileSync(path.join(CONTENT_DIR, file), 'utf-8')
  const { data, content } = matter(raw)
  return {
    title: data.title as string,
    slug: file.replace(/\.mdx$/, ''),
    description: data.description as string | undefined,
    group: (data.group as string) ?? 'How it works',
    order: (data.order as number) ?? 999,
    content,
  }
}

export function getTemplateDocs(): TemplateDocMeta[] {
  return fs
    .readdirSync(CONTENT_DIR)
    .filter((file) => file.endsWith('.mdx'))
    .map((file) => {
      const { title, slug, description, group, order } = read(file)
      return { title, slug, description, group, order }
    })
    .sort((a, b) => a.order - b.order)
}

export function getTemplateDoc(slug: string): TemplateDoc | null {
  const file = `${slug}.mdx`
  if (!/^[a-z0-9-]+$/.test(slug) || !fs.existsSync(path.join(CONTENT_DIR, file))) return null
  return read(file)
}
