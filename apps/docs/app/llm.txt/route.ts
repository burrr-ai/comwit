import { readFileSync } from 'fs'
import { resolve } from 'path'

export function GET() {
  const readmePath = resolve(process.cwd(), '../../README.md')
  const content = readFileSync(readmePath, 'utf-8')

  return new Response(content, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
