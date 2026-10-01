export type InstallMethod = 'native' | 'ios' | 'android' | null
export const DISMISS_KEY = 'comwit:pwa-install-dismissed-until'
export const COOLDOWN_MS = 14 * 24 * 60 * 60 * 1000

export function installMethod(input: {
  secure: boolean; framed: boolean; standalone: boolean; installed: boolean
  dismissedUntil: number; now: number; hasPrompt: boolean
  userAgent: string; platform: string; maxTouchPoints: number
}): InstallMethod {
  if (!input.secure || input.framed || input.standalone || input.installed || input.now < input.dismissedUntil) return null
  const ua = input.userAgent.toLowerCase()
  const inApp = /kakaotalk|naver|instagram|fbav|fban|fb_iab|line\/|; wv\)/.test(ua)
  if (inApp) return null
  if (input.hasPrompt) return 'native'
  const ios = /iphone|ipad|ipod/.test(ua) || (input.platform === 'MacIntel' && input.maxTouchPoints > 1)
  // Supporting iOS browsers also expose Home Screen addition through Share.
  if (ios && /safari|crios|fxios|edgios/.test(ua)) return 'ios'
  if (/android/.test(ua) && /chrome|firefox|samsungbrowser|edg|opr/.test(ua)) return 'android'
  return null
}

export function dismissedUntil(raw: string | null): number {
  const value = Number(raw)
  return Number.isFinite(value) && value > 0 ? value : 0
}
