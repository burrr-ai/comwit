import assert from 'node:assert/strict'
import { test } from 'node:test'
import { detectLocale } from './locale.mjs'

test('explicit supported cookies override browser language and country', () => {
  assert.equal(detectLocale({ cookie: 'en', acceptLanguage: 'ko', country: 'KR' }), 'en')
  assert.equal(detectLocale({ cookie: 'ko', acceptLanguage: 'en-US', country: 'US' }), 'ko')
})

test('browser preference uses language subtags, quality and stable tie ordering', () => {
  assert.equal(detectLocale({ acceptLanguage: 'ko-KR,ko;q=0.9,en;q=0.8' }), 'ko')
  assert.equal(detectLocale({ acceptLanguage: 'en-GB;q=0.7, ko;q=0.9' }), 'ko')
  assert.equal(detectLocale({ acceptLanguage: 'en-US,ko;q=1', country: 'KR' }), 'en')
  assert.equal(detectLocale({ acceptLanguage: 'KO-kr' }), 'ko')
})

test('unsupported or malformed preferences fall back to country and then English', () => {
  assert.equal(
    detectLocale({ cookie: '../../other', acceptLanguage: 'fr-FR', country: 'KR' }),
    'ko'
  )
  assert.equal(detectLocale({ acceptLanguage: 'ko;q=0,en;q=invalid', country: 'US' }), 'en')
  assert.equal(detectLocale({ acceptLanguage: 'ko;q=2,ja;q=1', country: 'kr' }), 'ko')
  assert.equal(detectLocale({ acceptLanguage: '*', country: 'ZZ' }), 'en')
  assert.equal(detectLocale(), 'en')
})
