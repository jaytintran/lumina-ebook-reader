import { useEffect, useRef } from "react";
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
  onVisibleSection,
  activeSpokenSentence,
  syncHighlight = true,
}: {
  epubDoc: ParsedEpubContent;
  epubFontSize: number;
  highlights?: Array<{ id?: number; text: string; color: string; pageOrLocation: number | string }>;
  onVisibleSection?: (sectionIdx: number) => void;
  activeSpokenSentence?: { text: string; sectionOrPage: number; index: number } | null;
  syncHighlight?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Live highlight active spoken sentence inside EPUB DOM
  useEffect(() => {
    if (!containerRef.current) return;

    // Clear previous live audio highlight marks
    const prevMarks = containerRef.current.querySelectorAll("mark.lumina-audio-active");
    prevMarks.forEach((m) => {
      const parent = m.parentNode;
      if (parent) {
        while (m.firstChild) parent.insertBefore(m.firstChild, m);
        parent.removeChild(m);
      }
    });

    if (!syncHighlight || !activeSpokenSentence || !activeSpokenSentence.text) return;

    const secEl = containerRef.current.querySelector(
      `#epub-sec-${activeSpokenSentence.sectionOrPage}`
    );
    if (!secEl) return;

    const queryText = activeSpokenSentence.text.trim();
    if (queryText.length < 3) return;

    // Search text nodes inside section
    const treeWalker = document.createTreeWalker(secEl, NodeFilter.SHOW_TEXT);
    let currentNode: Node | null = treeWalker.nextNode();

    while (currentNode) {
      const content = currentNode.nodeValue || "";
      const idx = content.toLowerCase().indexOf(queryText.toLowerCase().slice(0, Math.min(queryText.length, 30)));
      if (idx !== -1 && currentNode.parentNode) {
        const range = document.createRange();
        range.setStart(currentNode, idx);
        range.setEnd(currentNode, Math.min(content.length, idx + queryText.length));

        const mark = document.createElement("mark");
        mark.className = "lumina-audio-active bg-amber-400/30 text-inherit rounded px-1 py-0.5 border-b-2 border-amber-400 transition-colors duration-150";

        try {
          range.surroundContents(mark);
          // Scroll into view smoothly
          mark.scrollIntoView({ behavior: "smooth", block: "center" });
        } catch {
          // ignore potential DOM boundary split collisions
        }
        break;
      }
      currentNode = treeWalker.nextNode();
    }
  }, [activeSpokenSentence, syncHighlight]);

  // Track currently visible section on scroll
  useEffect(() => {
    if (!onVisibleSection || !containerRef.current) return;
    const sectionEls = containerRef.current.querySelectorAll<HTMLElement>("[data-section-index]");
    if (!sectionEls.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((e) => e.isIntersecting);
        if (visible) {
          const idx = Number(visible.target.getAttribute("data-section-index"));
          if (!Number.isNaN(idx)) {
            onVisibleSection(idx);
          }
        }
      },
      { threshold: 0.15, rootMargin: "-10% 0px -70% 0px" }
    );

    sectionEls.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [epubDoc, onVisibleSection]);

  return (
    <div
      ref={containerRef}
      className="flex flex-col items-center w-full max-w-3xl pb-24 gap-4 md:gap-6 select-text text-left px-0 sm:px-2"
      style={{ fontSize: `${epubFontSize}%` }}
    >
      {epubDoc.sections.map((sec, idx) => {
        const chapterLabel = epubDoc.toc[idx]?.label || `Section ${idx + 1}`;
        const processedHtml = highlightEpubHtml(sec.html, idx, highlights);

        return (
          <article
            key={sec.id || idx}
            id={`epub-sec-${idx}`}
            data-section-index={idx}
            className="w-full rounded-xl md:rounded-2xl bg-card/95 text-foreground shadow-lg md:shadow-xl border border-border/80 p-4 sm:p-6 md:p-12 transition-all leading-relaxed font-serif text-[1rem] md:text-[1.05rem] overflow-hidden"
          >
            {/* Chapter Header Banner */}
            <div className="mb-6 md:mb-8 pb-3 border-b border-border/60 flex items-center justify-between not-prose">
              <span className="text-xs font-sans font-bold tracking-wider text-primary uppercase line-clamp-1 mr-2">
                {chapterLabel}
              </span>
              <span className="text-[11px] font-sans text-muted-foreground tabular-nums shrink-0">
                {idx + 1} / {epubDoc.sections.length}
              </span>
            </div>

            {/* Clean Section Content */}
            <div
              className="epub-section-content text-left text-neutral-200 space-y-4 md:space-y-5 leading-[1.75] md:leading-[1.85] font-serif break-words max-w-full overflow-hidden select-text [&_*]:select-text
                [&_*]:[text-decoration:none]
                [&_u]:[text-decoration:underline]
                [&_p]:text-left [&_p]:mb-4 md:[&_p]:mb-5 [&_p]:leading-[1.75] md:[&_p]:leading-[1.85] [&_p]:text-neutral-200
                [&_h1]:text-left [&_h1]:font-sans [&_h1]:font-bold [&_h1]:text-xl md:[&_h1]:text-2xl [&_h1]:text-foreground [&_h1]:mt-6 md:[&_h1]:mt-8 [&_h1]:mb-3 md:[&_h1]:mb-4
                [&_h2]:text-left [&_h2]:font-sans [&_h2]:font-bold [&_h2]:text-lg md:[&_h2]:text-xl [&_h2]:text-foreground [&_h2]:mt-5 md:[&_h2]:mt-6 [&_h2]:mb-2 md:[&_h2]:mb-3
                [&_h3]:text-left [&_h3]:font-sans [&_h3]:font-semibold [&_h3]:text-base md:[&_h3]:text-lg [&_h3]:text-foreground
                [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-lg [&_img]:my-4 [&_img]:mx-auto [&_img]:block
                [&_svg]:max-w-full [&_svg]:h-auto
                [&_table]:w-full [&_table]:max-w-full [&_table]:overflow-x-auto [&_table]:block [&_table]:my-4
                [&_pre]:max-w-full [&_pre]:overflow-x-auto [&_pre]:p-3 [&_pre]:rounded-lg [&_pre]:bg-neutral-900/80
                [&_code]:break-all
                [&_a[href]]:text-primary [&_a[href]]:underline [&_a:not([href])]:[text-decoration:none] [&_a:not([href])]:text-inherit
                [&_blockquote]:border-l-2 [&_blockquote]:border-primary/50 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:my-4
                [&_hr]:my-8 [&_hr]:border-border/60"
              dangerouslySetInnerHTML={{
                __html: processedHtml || "<p>Empty section</p>",
              }}
            />
          </article>
        );
      })}
    </div>
  );
}
