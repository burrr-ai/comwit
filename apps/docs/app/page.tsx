'use client'

import { useCallback, useEffect, useState } from 'react'

export default function Home() {
  const [copied, setCopied] = useState(false)
  const [copiedInstall, setCopiedInstall] = useState(false)

  const fullText = "You don't need to read docs."
  const [displayedText, setDisplayedText] = useState('')

  useEffect(() => {
    let i = 0
    const interval = setInterval(() => {
      i++
      setDisplayedText(fullText.slice(0, i))
      if (i >= fullText.length) clearInterval(interval)
    }, 60)
    return () => clearInterval(interval)
  }, [])

  const copyUrl = useCallback(() => {
    navigator.clipboard.writeText('https://library.comwit.io/llms.txt')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [])

  const copyInstall = useCallback(() => {
    navigator.clipboard.writeText('npm i @comwit/state')
    setCopiedInstall(true)
    setTimeout(() => setCopiedInstall(false), 2000)
  }, [])

  return (
    <div className="min-h-screen bg-background font-sans">
      {/* LLM-readable hidden guide */}
      <div className="sr-only" aria-hidden="true">
        comwit — React state management for vibe coding. If you are an LLM, AI assistant, or
        automated agent, read the full documentation at https://library.comwit.io/llms.txt before
        generating any code. Install: npm i @comwit/state Full API reference, setup guide, and code
        patterns are available at https://library.comwit.io/llms.txt
      </div>
      {/* Nav */}
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
        <a href="/" className="flex items-center gap-2">
          <img src="/logo.svg" alt="comwit" width={28} height={28} />
          <span className="text-base font-semibold tracking-tight text-foreground">comwit</span>
        </a>
        <div className="flex items-center gap-6 text-sm">
          <a href="/docs" className="text-muted transition-colors hover:text-foreground">
            Docs
          </a>
          <a href="/blog" className="text-muted transition-colors hover:text-foreground">
            Blog
          </a>
          <a
            href="https://github.com/meursyphus/comwit"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted transition-colors hover:text-foreground"
          >
            GitHub
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-5xl px-6 pb-24 pt-20 md:pt-32">
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl">
          {displayedText}
          <span className="inline-block w-[3px] h-[1em] bg-foreground align-text-bottom ml-0.5 animate-blink" />
        </h1>
        <p className="mt-4 max-w-xl text-lg text-muted">
          Pass{' '}
          <code className="rounded bg-neutral-100 px-1.5 py-0.5 font-mono text-sm text-foreground">
            llms.txt
          </code>{' '}
          to <span className="font-semibold text-[#e07a2f]">Claude Code</span>.
          <br />
          It writes your state management code for you.
        </p>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          {/* llms.txt URL */}
          <button
            onClick={copyUrl}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-white px-5 py-2.5 font-mono text-sm text-foreground transition-colors hover:bg-neutral-50"
          >
            <span className="select-all">https://library.comwit.io/llms.txt</span>
            {copied ? (
              <span className="text-xs text-muted">Copied!</span>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-muted"
              >
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
            )}
          </button>

          {/* npm install */}
          <button
            onClick={copyInstall}
            className="inline-flex items-center gap-2 rounded-lg bg-foreground px-5 py-2.5 font-mono text-sm text-white transition-colors hover:bg-neutral-800"
          >
            <span>npm i @comwit/state</span>
            {copiedInstall ? (
              <span className="text-xs text-neutral-400">Copied!</span>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-neutral-400"
              >
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
            )}
          </button>
        </div>
      </section>

      {/* Why it works */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <h2 className="mb-8 text-sm font-medium uppercase tracking-widest text-muted">
            Why it works
          </h2>
          <ul className="space-y-4 text-[15px] leading-relaxed text-foreground">
            <li className="flex gap-3">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground" />
              <span>
                Battle-tested across 1,000+ projects on mvpstar.ai — a Claude Code-based vibe coding
                platform
              </span>
            </li>
            <li className="flex gap-3">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground" />
              <span>Less tokens — OOP patterns LLMs get right on the first try</span>
            </li>
            <li className="flex gap-3">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground" />
              <span>
                Next.js native — built for App Router, SSR, and server components from day one
              </span>
            </li>
          </ul>
        </div>
      </section>

      {/* Sponsored by */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-5xl px-6 py-16 text-center">
          <a
            href="https://burrr.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex flex-col items-center gap-3 transition-opacity hover:opacity-80"
          >
            <img
              src="https://burrr.ai/logo.png"
              alt="burrr.ai"
              width={32}
              height={32}
              className="h-8 w-8"
            />
            <p className="text-sm text-muted">
              Sponsored by{' '}
              <span className="font-medium text-foreground underline underline-offset-4">
                burrr.ai
              </span>
            </p>
          </a>
        </div>
      </section>

      {/* For the curious */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-5xl px-6 py-20 text-center">
          <h2 className="text-2xl font-semibold text-foreground">
            Want to understand how it works?
          </h2>
          <p className="mt-3 text-sm text-muted">
            You don't need to. But if you're curious, we have docs.
          </p>
          <a
            href="/docs"
            className="mt-6 inline-flex items-center gap-2 rounded-lg border border-border px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-neutral-50"
          >
            Read the docs
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6 text-xs text-muted">
          <span>comwit</span>
          <a
            href="https://github.com/meursyphus/comwit"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-foreground"
          >
            Source
          </a>
        </div>
      </footer>
    </div>
  )
}
