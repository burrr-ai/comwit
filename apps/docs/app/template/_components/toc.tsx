'use client'

import { Copy } from '@/i18n/copy'
import { useLocale, useTranslations } from 'next-intl'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

type TocItem = { id: string; text: string }

function PageContents() {
  const copy = useTranslations('Copy')

  const [headings, setHeadings] = useState<TocItem[]>([])
  const [activeId, setActiveId] = useState('')

  useEffect(() => {
    let elements: HTMLElement[] = []
    let frame = 0
    // The active h2 is the last heading above the header's bottom edge, including anchor jumps and short final sections.
    const update = () => {
      frame = 0
      const line =
        parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop || '0') + 96
      let current = elements[0]?.id ?? ''
      for (const element of elements) {
        if (element.getBoundingClientRect().top <= line) current = element.id
      }
      const atEnd = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2
      if (atEnd && elements.length) current = elements[elements.length - 1].id
      setActiveId(current)
    }
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    const collect = () => {
      const article = document.querySelector('.template-guide')
      if (!article) return
      const found = Array.from(article.querySelectorAll<HTMLElement>('h2')).filter((el) => el.id)
      // The TOC is inside main; avoid rerendering when the heading is unchanged.
      if (found.map((el) => el.id).join() !== elements.map((el) => el.id).join()) {
        elements = found
        setHeadings(found.map((element) => ({ id: element.id, text: element.textContent || '' })))
      }
      schedule()
    }
    // The route's MDX can stream in after the persistent layout mounts.
    const mutations = new MutationObserver(collect)
    const main = document.getElementById('template-content')
    if (main) mutations.observe(main, { childList: true, subtree: true })
    collect()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    return () => {
      mutations.disconnect()
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [])

  if (!headings.length) return null
  return (
    <nav aria-label={copy('text052')} className="tp-toc">
      <h2 className="tp-toc-title">
        <Copy id="text052" />
      </h2>
      <ol>
        {headings.map((heading) => (
          <li key={heading.id}>
            <a
              href={`#${heading.id}`}
              aria-current={activeId === heading.id ? 'location' : undefined}
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  )
}

export function TableOfContents() {
  const pathname = usePathname()
  const locale = useLocale()
  return <PageContents key={`${locale}:${pathname}`} />
}
