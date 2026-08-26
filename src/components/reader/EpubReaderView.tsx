import type { ParsedEpubContent } from "@/lib/importer";

function highlightEpubHtml(
  rawHtml: string,
  sectionIdx: number,
  highlights: Array<{ id?: number; text: string; color: string; pageOrLocation: number | string }>
): string {
  if (!rawHtml || highlights.length === 0) return rawHtml;
  let html = rawHtml;
  const sectionHighlights = highlights.filter(
    (h) => Number(h.pageOrLocation) === sectionIdx + 1 || !h.pageOrLocation
  );

  for (const h of sectionHighlights) {
    if (!h.text || h.text.trim().length < 2) continue;
    try {
      const trimmed = h.text.trim();
      const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(`(?![^<]*>)(${escaped})`, "gi");
      html = html.replace(
        regex,
        `<mark class="lumina-highlight lumina-highlight-${h.color}" data-highlight-id="${h.id || ""}" title="Highlight (${h.color}): ${trimmed}">$1</mark>`
      );
    } catch {
      // ignore
    }
  }
  return html;
}

export function EpubReaderView({
  epubDoc,
  epubFontSize,
  highlights = [],
}: {
  epubDoc: ParsedEpubContent;
  epubFontSize: number;
  highlights?: Array<{ id?: number; text: string; color: string; pageOrLocation: number | string }>;
}) {
  return (
    <div
      className="flex flex-col items-center w-full max-w-3xl pb-16 gap-8 select-text"
      style={{ fontSize: `${epubFontSize}%` }}
    >
      {epubDoc.sections.map((sec, idx) => (
        <div
          key={sec.id || idx}
          id={`epub-sec-${idx}`}
          className="w-full rounded-xl bg-card p-6 md:p-10 text-foreground shadow-2xl border border-border leading-relaxed font-serif text-base"
        >
          <h2 className="text-xl font-bold font-sans mb-6 pb-2 border-b border-border text-primary">
            {epubDoc.toc[idx]?.label || `Section ${idx + 1}`}
          </h2>
          <div
            className="prose prose-invert max-w-none space-y-4 text-neutral-200 [&_p]:mb-4 [&_h1]:text-2xl [&_h2]:text-xl [&_img]:max-w-full [&_img]:rounded-md"
            dangerouslySetInnerHTML={{
              __html: highlightEpubHtml(sec.html, idx, highlights) || "<p>Empty section</p>",
            }}
          />
        </div>
      ))}
    </div>
  );
}
