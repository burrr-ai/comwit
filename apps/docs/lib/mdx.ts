import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

const CONTENT_DIR = path.join(process.cwd(), 'content/docs')

export interface DocMeta {
  title: string
  slug: string
  group?: string
  order: number
}

export interface Doc extends DocMeta {
  content: string
}

function getMdxFiles(dir: string, base = ''): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  const files: string[] = []
  for (const entry of entries) {
    const rel = path.join(base, entry.name)
    if (entry.isDirectory()) {
      files.push(...getMdxFiles(path.join(dir, entry.name), rel))
    } else if (entry.name.endsWith('.mdx')) {
      files.push(rel)
    }
  }
  return files
}

function filePathToSlug(filePath: string): string {
  return filePath.replace(/\.mdx$/, '').replace(/(^|\/)index$/, '')
}

export function getAllDocs(): DocMeta[] {
  const files = getMdxFiles(CONTENT_DIR)
  return files
    .map((file) => {
      const raw = fs.readFileSync(path.join(CONTENT_DIR, file), 'utf-8')
      const { data } = matter(raw)
      const slug = (data.slug as string) || filePathToSlug(file)
      return {
        title: data.title as string,
        slug,
        group: data.group as string | undefined,
        order: (data.order as number) ?? 999,
      }
    })
    .sort((a, b) => a.order - b.order)
}

export function getDocBySlug(slug: string): Doc | null {
  const files = getMdxFiles(CONTENT_DIR)
  for (const file of files) {
    const raw = fs.readFileSync(path.join(CONTENT_DIR, file), 'utf-8')
    const { data, content } = matter(raw)
    const fileSlug = (data.slug as string) || filePathToSlug(file)
    if (fileSlug === slug || (slug === '' && filePathToSlug(file) === 'index')) {
      return {
        title: data.title as string,
        slug: fileSlug,
        group: data.group as string | undefined,
        order: (data.order as number) ?? 999,
        content,
      }
    }
  }
  return null
}
