import { getTranslations } from 'next-intl/server'
import { messageKey } from './message-key'

export async function getCopy() {
  const t = await getTranslations()
  return (text: string) => {
    const key = messageKey(text)
    return key ? (t.raw(key) as string) : text
  }
}
