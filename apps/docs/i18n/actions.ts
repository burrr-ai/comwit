'use server'

import { cookies } from 'next/headers'
import { localeCookie } from './locale.mjs'

export async function setLocale(locale: string) {
  if (locale !== 'en' && locale !== 'ko') throw new Error('Unsupported locale')
  const store = await cookies()
  store.set(localeCookie, locale, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  })
}
