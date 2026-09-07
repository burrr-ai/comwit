'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

type TocItem = { id: string; text: string; level: number }

function PageContents() {
  const [headings, setHeadings] = useState<TocItem[]>([])
  const [activeId, setActiveId] = useState('')

  useEffect(() => {
    let observer: IntersectionObserver | undefined
    const collect = () => {
      const article = document.querySelector('article')
      if (!article) return
      const elements = Array.from(article.querySelectorAll('h2, h3'))
      const items = elements
        .filter((element) => element.id)
        .map((element) => ({
          id: element.id,
          text: element.textContent || '',
          level: Number(element.tagName[1]),
        }))
      setHeadings(items)
      observer?.disconnect()
      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) if (entry.isIntersecting) setActiveId(entry.target.id)
        },
        { rootMargin: '-110px 0px -60% 0px', threshold: 0.1 }
      )
      elements.forEach((element) => observer?.observe(element))
    }
    // The route's MDX can stream in after the persistent layout mounts.
    const mutations = new MutationObserver(collect)
    const main = document.getElementById('docs-content')
    if (main) mutations.observe(main, { childList: true, subtree: true })
    collect()
    return () => {
      mutations.disconnect()
      observer?.disconnect()
    }
  }, [])

  if (!headings.length) return null
  return (
    <nav aria-label="On this page">
      <h2 className="toc-title">On this page</h2>
      {headings.map((heading) => (
        <a
          key={heading.id}
          href={`#${heading.id}`}
          className="toc-link"
          style={heading.level === 3 ? { paddingLeft: 12 } : undefined}
          aria-current={activeId === heading.id ? 'location' : undefined}
        >
          {heading.text}
        </a>
      ))}
    </nav>
  )
}

export function TableOfContents() {
  const pathname = usePathname()
  return <PageContents key={pathname} />
}
