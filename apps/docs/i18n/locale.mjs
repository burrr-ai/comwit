export const localeCookie = 'COMWIT_LOCALE'
export const locales = ['en', 'ko']

/** Explicit preference wins; unsupported browser languages fall back to deployment geolocation. */
export function detectLocale({ cookie = '', acceptLanguage = '', country = '' } = {}) {
  if (cookie === 'en' || cookie === 'ko') return cookie
  const preferred = acceptLanguage
    .split(',')
    .map((entry, index) => {
      const [tag, ...parameters] = entry.trim().split(';')
      const quality = parameters.find((value) => value.trim().startsWith('q='))
      const q = quality ? Number(quality.trim().slice(2)) : 1
      return { language: tag.toLowerCase().split('-')[0], q, index }
    })
    .filter(({ language, q }) => locales.includes(language) && q > 0 && q <= 1)
    .sort((a, b) => b.q - a.q || a.index - b.index)[0]
  if (preferred) return preferred.language === 'ko' ? 'ko' : 'en'
  return country.toUpperCase() === 'KR' ? 'ko' : 'en'
}
