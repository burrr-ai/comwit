import { readFileSync } from 'fs'
import { join } from 'path'

const CONTENT = readFileSync(join(process.cwd(), 'public/llm/decorator.txt'), 'utf-8')

export function GET() {
  return new Response(CONTENT, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
