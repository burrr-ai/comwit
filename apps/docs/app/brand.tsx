import { useTranslations } from 'next-intl'
import Link from 'next/link'

export function Brand() {
  const copy = useTranslations('Copy')

  return (
    <Link href="/" className="wordmark brand" aria-label={copy('text005')}>
      comwit<span className="brand-dot">.</span>
    </Link>
  )
}
