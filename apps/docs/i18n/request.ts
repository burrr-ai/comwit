import { cookies, headers } from 'next/headers'
import { getRequestConfig } from 'next-intl/server'
import { detectLocale, localeCookie } from './locale.mjs'

export default getRequestConfig(async () => {
  const [store, requestHeaders] = await Promise.all([cookies(), headers()])
  const locale = detectLocale({
    cookie: store.get(localeCookie)?.value,
    acceptLanguage: requestHeaders.get('accept-language') ?? '',
    country: requestHeaders.get('x-vercel-ip-country') ?? requestHeaders.get('cf-ipcountry') ?? '',
  })
  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
    timeZone: 'UTC',
  }
})
