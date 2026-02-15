import { MDXRemote } from "next-mdx-remote/rsc";
import { getDocBySlug } from "@/lib/mdx";
import { notFound } from "next/navigation";

export const metadata = {
  title: "Why mucha — mucha docs",
};

export default function DocsIndexPage() {
  const doc = getDocBySlug("");
  if (!doc) notFound();

  return (
    <article className="prose prose-sm max-w-none font-serif text-foreground/70 leading-snug prose-headings:font-serif prose-headings:tracking-wide prose-headings:text-foreground prose-headings:font-normal prose-h1:text-2xl prose-h2:text-base prose-h2:italic prose-h2:text-foreground/80 prose-p:text-[13px] prose-p:leading-relaxed prose-hr:border-gold/30 prose-strong:text-foreground/90 prose-strong:font-semibold">
      <MDXRemote source={doc.content} />
    </article>
  );
}
