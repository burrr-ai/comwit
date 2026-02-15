import { getAllDocs, type DocMeta } from "@/lib/mdx";
import { DocsSidebar } from "./sidebar";
import { TableOfContents } from "./toc";

function groupDocs(docs: DocMeta[]) {
  const ungrouped: DocMeta[] = [];
  const groups: Record<string, DocMeta[]> = {};

  for (const doc of docs) {
    if (doc.group) {
      if (!groups[doc.group]) groups[doc.group] = [];
      groups[doc.group].push(doc);
    } else {
      ungrouped.push(doc);
    }
  }

  return { ungrouped, groups };
}

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const docs = getAllDocs();
  const { ungrouped, groups } = groupDocs(docs);

  return (
    <div className="min-h-screen max-w-7xl mx-auto flex">
      <DocsSidebar ungrouped={ungrouped} groups={groups} />

      {/* Content area */}
      <main className="flex-1 min-w-0 px-6 py-8 md:px-16 md:py-12">
        <div className="w-full max-w-3xl">
          {children}
        </div>
      </main>

      {/* Table of Contents — right side, desktop only */}
      <aside className="hidden lg:block w-48 shrink-0 py-12 pr-4">
        <div className="sticky top-12">
          <TableOfContents />
        </div>
      </aside>
    </div>
  );
}
