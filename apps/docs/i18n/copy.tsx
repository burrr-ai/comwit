import { useTranslations } from 'next-intl'
import { messageKey } from './message-key'

/** Shared between server-rendered prose and interactive client components. */
export function Copy({ id, text }: { id: string; text?: never } | { text: string; id?: never }) {
  const t = useTranslations()
  const key = id !== undefined ? `Copy.${id}` : messageKey(text)
  return key ? (t.raw(key) as string) : text
}

export function useCopy() {
  const t = useTranslations()
  return (text: string) => {
    const key = messageKey(text)
    return key ? (t.raw(key) as string) : text
  }
}
