'use client'

import { useTransition } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { Button } from '@comwit/ui-templates/button'
import { setLocale } from '@/i18n/actions'

export function LocaleSwitch() {
  const locale = useLocale()
  const t = useTranslations('Locale')
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const nextLocale = locale === 'en' ? 'ko' : 'en'
  return (
    <Button
      variant="plain"
      size="none"
      className="site-locale-switch"
      aria-label={t('switch')}
      aria-busy={pending}
      disabled={pending}
      lang={nextLocale}
      onClick={() =>
        startTransition(async () => {
          await setLocale(nextLocale)
          router.refresh()
        })
      }
    >
      {nextLocale === 'ko' ? '한국어' : 'English'}
    </Button>
  )
}
