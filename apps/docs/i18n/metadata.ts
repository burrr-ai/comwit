import type { Metadata } from 'next'
import { getLocale } from 'next-intl/server'
import { getCopy } from './server'

export async function localizeMetadata(metadata: Metadata): Promise<Metadata> {
  const [copy, locale] = await Promise.all([getCopy(), getLocale()])
  const title = metadata.title
  return {
    ...metadata,
    title:
      typeof title === 'string'
        ? copy(title)
        : title && 'default' in title
          ? { ...title, default: copy(title.default) }
          : title,
    description: metadata.description ? copy(metadata.description) : metadata.description,
    openGraph: metadata.openGraph
      ? {
          ...metadata.openGraph,
          ...(typeof metadata.openGraph.title === 'string'
            ? { title: copy(metadata.openGraph.title) }
            : {}),
          ...(metadata.openGraph.description
            ? { description: copy(metadata.openGraph.description) }
            : {}),
          locale: locale === 'ko' ? 'ko_KR' : 'en_US',
        }
      : undefined,
  }
}
