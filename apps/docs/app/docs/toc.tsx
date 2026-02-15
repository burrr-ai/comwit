"use client";

import { useEffect, useState } from "react";

interface TocItem {
  id: string;
  text: string;
  level: number;
}

export function TableOfContents() {
  const [headings, setHeadings] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState("");

  useEffect(() => {
    const article = document.querySelector("article");
    if (!article) return;

    const elements = article.querySelectorAll("h2, h3");
    const items: TocItem[] = Array.from(elements).map((el) => {
      if (!el.id) {
        el.id = el.textContent
          ?.toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "") ?? "";
      }
      return {
        id: el.id,
        text: el.textContent ?? "",
        level: parseInt(el.tagName[1]),
      };
    });
    setHeadings(items);
  }, []);

  useEffect(() => {
    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: "-80px 0px -60% 0px", threshold: 0.1 }
    );

    for (const { id } of headings) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [headings]);

  if (headings.length === 0) return null;

  return (
    <nav className="space-y-2">
      <h4 className="font-serif text-[10px] uppercase tracking-[0.25em] text-gold-dark/70 mb-3">
        On this page
      </h4>
      {headings.map((h) => (
        <a
          key={h.id}
          href={`#${h.id}`}
          className={`
            block font-serif text-[12px] leading-tight tracking-wide transition-colors
            ${h.level === 3 ? "pl-3" : ""}
            ${activeId === h.id ? "text-gold-dark" : "text-foreground/40 hover:text-foreground/60"}
          `}
        >
          {h.text}
        </a>
      ))}
    </nav>
  );
}
