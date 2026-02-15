"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";

const artworks = [
  { src: "/mucha/zodiac.jpg", alt: "Alphonse Mucha — Zodiac (1896)" },
  { src: "/mucha/reverie.jpg", alt: "Alphonse Mucha — Reverie (1897)" },
  { src: "/mucha/job.jpg", alt: "Alphonse Mucha — Job (1896)" },
  { src: "/mucha/dance.jpg", alt: "Alphonse Mucha — Dance (1898)" },
  { src: "/mucha/gismonda.jpg", alt: "Alphonse Mucha — Gismonda (1894)" },
];

const SWITCH_INTERVAL_MS = 10000;
const FADE_DURATION = 1.5;

export default function Home() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [copied, setCopied] = useState(false);

  const copyUrl = useCallback(() => {
    navigator.clipboard.writeText("https://muchajs.dev/llm.txt");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % artworks.length);
    }, SWITCH_INTERVAL_MS);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-background font-sans">
      {/* Left Panel — Artwork carousel */}
      <div className="relative hidden w-[42%] overflow-hidden lg:block">
        <AnimatePresence initial={false} mode="sync">
          <motion.div
            key={activeIndex}
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: FADE_DURATION, ease: "easeInOut" }}
          >
            <Image
              src={artworks[activeIndex].src}
              alt={artworks[activeIndex].alt}
              fill
              className="object-cover"
              priority={activeIndex === 0}
            />
          </motion.div>
        </AnimatePresence>
        {/* Soft edge blending into right panel */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-background" />
      </div>

      {/* Right Panel — Content */}
      <div className="relative flex flex-1 flex-col justify-between px-8 py-8 lg:px-16 lg:py-12">
        {/* Mobile background */}
        <div className="pointer-events-none absolute inset-0 lg:hidden">
          <Image
            src="/mucha/zodiac.jpg"
            alt=""
            fill
            className="object-cover opacity-[0.06]"
          />
        </div>

        {/* Nav */}
        <nav className="relative z-10 flex w-full max-w-xl items-center justify-between text-sm tracking-wide">
          <span className="font-serif text-lg font-semibold text-foreground">
            muchajs
          </span>
          <div className="flex items-center gap-6">
            <a
              href="/docs"
              className="text-foreground/50 transition-colors hover:text-foreground"
            >
              Docs
            </a>
            <a
              href="https://github.com/piscesyuma/yoshi"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground/50 transition-colors hover:text-foreground"
            >
              GitHub
            </a>
            <a
              href="https://www.npmjs.com/package/muchajs"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground/50 transition-colors hover:text-foreground"
            >
              npm
            </a>
          </div>
        </nav>

        {/* Main content — vertically centered */}
        <main className="relative z-10 flex w-full max-w-xl flex-col gap-7">
          <div>
            <h1 className="mb-3 font-serif text-5xl font-bold tracking-[0.3em] text-foreground sm:text-6xl">
              mucha
            </h1>
            <p className="font-serif text-lg italic tracking-wide text-foreground/60">
              Built for Claude Code.
              <br />
              State management for Next.js.
            </p>
          </div>

          <div className="ornament w-40">
            <span />
          </div>

          {/* LLM URL */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 self-start rounded-full border-2 border-gold/50 bg-cream-light/80 px-6 py-3 font-mono text-sm tracking-wide text-foreground/80 backdrop-blur-sm transition-colors hover:border-gold">
              <span className="select-all">https://muchajs.dev/llm.txt</span>
              <button
                onClick={copyUrl}
                className="ml-2 text-foreground/40 transition-colors hover:text-foreground/80"
                aria-label="Copy URL"
              >
                {copied ? (
                  <span className="text-xs font-sans text-gold-dark">Copied!</span>
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
                  >
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                )}
              </button>
            </div>
            <p className="text-sm tracking-wide text-foreground/40">
              Give this to Claude Code. It handles the rest.
            </p>
          </div>
        </main>

        {/* Footer */}
        <footer className="relative z-10 flex w-full max-w-xl items-center gap-6 text-xs tracking-wide text-foreground/30">
          <span className="font-serif">muchajs</span>
          <span className="text-gold/20">&#x2756;</span>
          <a
            href="https://github.com/piscesyuma/yoshi"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-foreground/60"
          >
            Source
          </a>
        </footer>
      </div>
    </div>
  );
}
