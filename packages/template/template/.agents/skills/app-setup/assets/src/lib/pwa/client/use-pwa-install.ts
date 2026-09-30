'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { COOLDOWN_MS, DISMISS_KEY, dismissedUntil, installMethod, type InstallMethod } from './install-policy'

interface InstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

declare global {
  interface Window {
    __comwitPwa?: { prompt: InstallPromptEvent | null; installed: boolean }
  }
}

function readMethod(): InstallMethod {
  let until = 0
  try { until = dismissedUntil(localStorage.getItem(DISMISS_KEY)) } catch { /* Private browsing. */ }
  return installMethod({
    secure: window.isSecureContext, framed: window.parent !== window,
    standalone: window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true,
    installed: window.__comwitPwa?.installed ?? false,
    dismissedUntil: until, now: Date.now(), hasPrompt: Boolean(window.__comwitPwa?.prompt),
    userAgent: navigator.userAgent, platform: navigator.platform, maxTouchPoints: navigator.maxTouchPoints,
  })
}

/** Shared install state: native prompt only on a click; manual guidance otherwise. */
export function usePwaInstall() {
  const [method, setMethod] = useState<InstallMethod>(null)
  const [pending, setPending] = useState(false)
  const hidden = useRef(false)
  const busy = useRef(false)

  useEffect(() => {
    const refresh = () => setMethod(hidden.current ? null : readMethod())
    const onPrompt = (event: Event) => {
      if (window.parent !== window || !window.isSecureContext) return
      event.preventDefault()
      window.__comwitPwa ??= { prompt: null, installed: false }
      window.__comwitPwa.prompt = event as InstallPromptEvent
      refresh()
    }
    const onInstalled = () => {
      window.__comwitPwa ??= { prompt: null, installed: false }
      window.__comwitPwa.prompt = null
      window.__comwitPwa.installed = true
      hidden.current = true
      setMethod(null)
      try { localStorage.setItem(DISMISS_KEY, String(Date.now() + COOLDOWN_MS)) } catch { /* Best effort. */ }
    }
    const display = window.matchMedia('(display-mode: standalone)')
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    window.addEventListener('storage', refresh)
    window.addEventListener('pageshow', refresh)
    display.addEventListener('change', refresh)
    refresh() // Adopt the event captured by the server-rendered script before hydration.
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
      window.removeEventListener('storage', refresh)
      window.removeEventListener('pageshow', refresh)
      display.removeEventListener('change', refresh)
    }
  }, [])

  const dismiss = useCallback(() => {
    hidden.current = true
    setMethod(null)
    try { localStorage.setItem(DISMISS_KEY, String(Date.now() + COOLDOWN_MS)) } catch { /* Best effort. */ }
  }, [])

  const promptInstall = useCallback(async (): Promise<'accepted' | 'dismissed' | 'unavailable'> => {
    const state = window.__comwitPwa
    const event = state?.prompt
    if (!event || !state || busy.current) return 'unavailable'
    // Consume globally before awaiting: an event is single-use, even across hooks.
    state.prompt = null
    busy.current = true
    setPending(true)
    try {
      await event.prompt()
      const { outcome } = await event.userChoice
      dismiss()
      return outcome
    } catch {
      setMethod(readMethod())
      return 'unavailable'
    } finally {
      busy.current = false
      setPending(false)
    }
  }, [dismiss])

  return { shouldShow: method !== null, method, pending, promptInstall, dismiss }
}
