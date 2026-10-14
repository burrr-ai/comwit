import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { test } from 'node:test'
import matter from 'gray-matter'
import { serialize } from 'next-mdx-remote/serialize'
import remarkGfm from 'remark-gfm'
import rehypeSlug from 'rehype-slug'
import remarkStableAnchors from '../lib/remark-stable-anchors.mjs'
import { createTranslator } from 'next-intl'
import { groups } from '../content/ui/gallery.mjs'

const root = new URL('../', import.meta.url)
const read = (path) => readFileSync(new URL(path, root), 'utf8')

function mdxFiles(directory) {
  return readdirSync(new URL(directory, root), { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name)
    return entry.isDirectory() ? mdxFiles(path) : entry.name.endsWith('.mdx') ? [path] : []
  })
}

test('every human document has a Korean translation with the same contract and executable examples', async () => {
  const originals = ['state', 'ui', 'template', 'blog'].flatMap((section) =>
    mdxFiles(`content/${section}`)
  )
  assert.deepEqual(
    mdxFiles('content/ko')
      .map((path) => path.replace('content/ko/', 'content/'))
      .sort(),
    [...originals].sort()
  )
  for (const path of originals) {
    const original = matter(read(path))
    const localized = matter(read(path.replace('content/', 'content/ko/')))
    for (const key of ['slug', 'group', 'order', 'date', 'author']) {
      assert.deepEqual(localized.data[key], original.data[key], `${path}: stable ${key}`)
    }
    assert.ok(localized.data.title, `${path}: translated title`)
    assert.match(localized.content, /[가-힣]/, `${path}: Korean prose`)
    const fences = (content) => [...content.matchAll(/^```[^\n]*\n[\s\S]*?^```/gm)].map((m) => m[0])
    assert.deepEqual(fences(localized.content), fences(original.content), `${path}: code examples`)
    const anchors = {}
    for (const [locale, document] of [
      ['en', original],
      ['ko', localized],
    ]) {
      anchors[locale] = []
      const collectAnchors = () => (tree) => {
        function visit(node) {
          if (node.type === 'element' && /^h[1-6]$/.test(node.tagName))
            anchors[locale].push(node.properties.id)
          node.children?.forEach(visit)
        }
        visit(tree)
      }
      await assert.doesNotReject(
        serialize(document.content, {
          mdxOptions: {
            remarkPlugins: [remarkGfm, remarkStableAnchors],
            rehypePlugins: [rehypeSlug, collectAnchors],
          },
        }),
        `${locale}/${path}: valid MDX`
      )
    }
    assert.deepEqual(anchors.ko, anchors.en, `${path}: stable heading links in both languages`)
  }
})

test('message catalogs match, ICU compiles, and literal example prose stays text', () => {
  const catalogs = Object.fromEntries(
    ['en', 'ko'].map((locale) => [locale, JSON.parse(read(`messages/${locale}.json`))])
  )
  assert.deepEqual(Object.keys(catalogs.en).sort(), Object.keys(catalogs.ko).sort())
  for (const namespace of Object.keys(catalogs.en)) {
    assert.deepEqual(
      Object.keys(catalogs.en[namespace]).sort(),
      Object.keys(catalogs.ko[namespace]).sort()
    )
    for (const locale of ['en', 'ko']) {
      const translate = createTranslator({
        locale,
        messages: catalogs[locale],
        namespace,
        onError(error) {
          throw error
        },
      })
      for (const [key, message] of Object.entries(catalogs[locale][namespace])) {
        if (namespace === 'Examples') {
          assert.equal(translate.raw(key), message, `${locale}/${namespace}.${key}: literal prose`)
          continue
        }
        const arguments_ = [
          ...message.matchAll(/\{(\w+)(?:,\s*(plural|selectordinal|number|date|time))?[,}]/g),
        ]
        const tags = [...message.matchAll(/<([A-Za-z]\w*)>/g)]
        // Exercise singular/other branches and exact-number selectors, including zero.
        const counts = new Set([
          0,
          1,
          2,
          5,
          ...[...message.matchAll(/=(-?\d+(?:\.\d+)?)\s*\{/g)].map((match) => Number(match[1])),
        ])
        for (const count of counts) {
          const values = Object.fromEntries(
            arguments_.map(([, name, format]) => [
              name,
              name === 'count' || ['plural', 'selectordinal', 'number'].includes(format)
                ? count
                : ['date', 'time'].includes(format)
                  ? new Date('2026-01-01T00:00:00Z')
                  : 'Example',
            ])
          )
          for (const [, tag] of tags) values[tag] = (chunks) => chunks
          assert.equal(
            typeof translate.rich(key, values),
            'string',
            `${locale}/${namespace}.${key}: count=${count}`
          )
        }
      }
    }
  }
})

test('every gallery summary, example title and description has translated copy', async () => {
  const english = JSON.parse(read('messages/en.json'))
  const messages = new Set([...Object.values(english.Copy), ...Object.values(english.Examples)])
  for (const group of groups) {
    for (const text of [
      group.title,
      group.blurb,
      ...group.items.flatMap((item) => [item.title, item.summary]),
    ]) {
      assert.ok(messages.has(text), `Missing catalog translation: ${text}`)
    }
  }
  const directory = new URL('../storybook/specs/', root)
  for (const file of readdirSync(directory).filter((file) => file.endsWith('.mjs'))) {
    const { specs } = await import(new URL(file, directory).href)
    for (const spec of specs) {
      for (const story of spec.stories) {
        const words = story.name.replace(/([a-z0-9])([A-Z])/g, '$1 $2').split(' ')
        const title = words
          .map((word, index) => (index === 0 ? word : word.toLowerCase()))
          .join(' ')
        assert.ok(messages.has(title), `${file}/${story.name}: translated example title`)
        if (story.description)
          assert.ok(
            messages.has(story.description),
            `${file}/${story.name}: translated description`
          )
      }
    }
  }
})
