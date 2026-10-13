// Typecheck only (excluded from the registry): verify every locale has the same keys as the English version.
import type { uiText as en } from '../lib/ui-text'
import { uiText as ko } from './ui-text.ko'

export const locales: Record<string, typeof en> = { ko }
