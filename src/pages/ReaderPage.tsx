import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import * as pdfjs from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import {
  ArrowLeft,
  Bookmark as BookmarkIcon,
  ChevronLeft,
  ChevronRight,
  Highlighter,
  Info,
  List,
  Pin,
  PinOff,
  Plus,
  Save,
  Star,
  StickyNote,
  Trash2,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { readFile } from "@/db/opfs";
import {
  useAddBookmark,
  useAddHighlight,
  useAddNote,
  useBook,
  useBookmarks,
  useDeleteBookmark,
  useDeleteHighlight,
  useDeleteNote,
  useHighlights,
  useNotes,
  useReadingProgress,
  useSaveReadingProgress,
  useUpdateBook,
} from "@/db/hooks";
import { parseFullEpub, type ParsedEpubContent } from "@/lib/importer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker;

type LeftTab = "toc" | "bookmarks";
type RightTab = "notes" | "highlights" | "metadata";

function PdfPageItem({
  pdfDoc,
  pageNumber,
  scale,
  onVisible,
}: {
  pdfDoc: pdfjs.PDFDocumentProxy;
  pageNumber: number;
  scale: number;
  onVisible: (pageNumber: number) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [rendered, setRendered] = useState(false);
  const isIntersectingRef = useRef(false);
  const renderTaskRef = useRef<pdfjs.RenderTask | null>(null);

  const renderPage = async () => {
    if (renderTaskRef.current) {
      try {
        renderTaskRef.current.cancel();
      } catch {
        // ignore
      }
      renderTaskRef.current = null;
    }
    try {
      const page = await pdfDoc.getPage(pageNumber);
      const viewport = page.getViewport({ scale });
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      canvas.height = viewport.height;
      canvas.width = viewport.width;

      const task = page.render({ canvasContext: ctx, viewport } as never);
      renderTaskRef.current = task;
      await task.promise;
      setRendered(true);
    } catch (err: unknown) {
      if (err && typeof err === "object" && "name" in err && err.name === "RenderingCancelledException") {
        return;
      }
    }
  };

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        isIntersectingRef.current = entry.isIntersecting;
        if (entry.isIntersecting) {
          onVisible(pageNumber);
          if (!rendered) {
            renderPage();
          }
        }
      },
      { rootMargin: "600px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [pageNumber, rendered, scale, pdfDoc]);

  useEffect(() => {
    setRendered(false);
    if (isIntersectingRef.current) {
      renderPage();
    }
  }, [scale]);

  return (
    <div
      ref={containerRef}
      id={`pdf-page-${pageNumber}`}
      className="relative mb-6 shadow-2xl rounded-sm border border-neutral-800 bg-white"
    >
      <canvas ref={canvasRef} className="block" />
      <div className="absolute bottom-2 right-2 rounded bg-black/60 px-2 py-0.5 text-[10px] text-white pointer-events-none">
        Page {pageNumber}
      </div>
    </div>
  );
}

export function ReaderPage() {
  const params = useParams();
  const navigate = useNavigate();
  const rawId = params.bookId ?? params.id;
  const bookId = Number(rawId);

  const { data: book, isLoading: bookLoading } = useBook(Number.isNaN(bookId) ? undefined : bookId);
  const updateBook = useUpdateBook();

  // Left & Right pinnable panels
  const [leftPinned, setLeftPinned] = useState(true);
  const [rightPinned, setRightPinned] = useState(true);
  const [leftTab, setLeftTab] = useState<LeftTab>("toc");
  const [rightTab, setRightTab] = useState<RightTab>("notes");

  // Reader data
  const { data: bookmarks = [] } = useBookmarks(bookId);
  const { data: highlights = [] } = useHighlights(bookId);
  const { data: notes = [] } = useNotes(bookId);
  const { data: progress } = useReadingProgress(bookId);

  const addBookmark = useAddBookmark();
  const deleteBookmark = useDeleteBookmark();
  const addHighlight = useAddHighlight();
  const deleteHighlight = useDeleteHighlight();
  const addNote = useAddNote();
  const deleteNote = useDeleteNote();
  const saveProgress = useSaveReadingProgress();

  // Document state
  const [loadingDoc, setLoadingDoc] = useState(true);
  const [pdfDoc, setPdfDoc] = useState<pdfjs.PDFDocumentProxy | null>(null);
  const [pdfNumPages, setPdfNumPages] = useState(0);
  const [pdfCurrentPage, setPdfCurrentPage] = useState(1);
  const [pdfScale, setPdfScale] = useState(1.2);
  const [pdfOutline, setPdfOutline] = useState<{ title: string; pageNumber: number }[]>([]);

  const [epubDoc, setEpubDoc] = useState<ParsedEpubContent | null>(null);
  const [epubSectionIdx, setEpubSectionIdx] = useState(0);
  const [epubFontSize, setEpubFontSize] = useState(100);

  const handlePdfZoomOut = () => {
    setPdfScale((s) => Math.max(0.5, Math.round((s - 0.2) * 10) / 10));
  };
  const handlePdfZoomIn = () => {
    setPdfScale((s) => Math.min(3.0, Math.round((s + 0.2) * 10) / 10));
  };
  const handlePdfZoomReset = () => {
    setPdfScale(1.0);
  };

  const handleEpubZoomOut = () => {
    setEpubFontSize((s) => Math.max(70, s - 10));
  };
  const handleEpubZoomIn = () => {
    setEpubFontSize((s) => Math.min(200, s + 10));
  };

  const centerScrollRef = useRef<HTMLDivElement>(null);

  // Metadata edit on the fly
  const [metaTitle, setMetaTitle] = useState("");
  const [metaSubtitle, setMetaSubtitle] = useState("");
  const [metaAuthor, setMetaAuthor] = useState("");
  const [metaPublisher, setMetaPublisher] = useState("");
  const [metaRating, setMetaRating] = useState(0);
  const [metaTags, setMetaTags] = useState("");
  const [metaDesc, setMetaDesc] = useState("");
  const [metaSaved, setMetaSaved] = useState(false);

  // Note form
  const [newNote, setNewNote] = useState("");

  // Highlight selection
  const [selectedText, setSelectedText] = useState("");
  const [selectedColor, setSelectedColor] = useState("yellow");

  // Sync metadata form when book loaded
  useEffect(() => {
    if (book) {
      setMetaTitle(book.title);
      setMetaSubtitle(book.subtitle ?? "");
      setMetaAuthor(book.author);
      setMetaPublisher(book.publisher ?? "");
      setMetaRating(book.rating);
      setMetaTags(book.tags.join(", "));
      setMetaDesc(book.description ?? "");
    }
  }, [book]);

  // Load book file from OPFS
  useEffect(() => {
    let alive = true;
    async function loadBook() {
      if (!book) return;
      setLoadingDoc(true);
      try {
        const file = await readFile(book.fileKey);
        if (!file) throw new Error("Book file not found in storage");
        const buffer = await file.arrayBuffer();

        if (book.fileType === "pdf") {
          const loadedPdf = await pdfjs.getDocument({ data: buffer }).promise;
          if (!alive) return;
          setPdfDoc(loadedPdf);
          setPdfNumPages(loadedPdf.numPages);

          try {
            const outline = await loadedPdf.getOutline();
            if (outline?.length) {
              const parsedOutline: { title: string; pageNumber: number }[] = [];
              for (const item of outline) {
                let pageNumber = 1;
                if (item.dest) {
                  const destRef =
                    typeof item.dest === "string"
                      ? await loadedPdf.getDestination(item.dest)
                      : item.dest;
                  if (Array.isArray(destRef) && destRef[0]) {
                    pageNumber = (await loadedPdf.getPageIndex(destRef[0])) + 1;
                  }
                }
                parsedOutline.push({ title: item.title, pageNumber });
              }
              setPdfOutline(parsedOutline);
            }
          } catch {
            // fallback
          }

          if (progress?.pageOrLocation) {
            setPdfCurrentPage(Number(progress.pageOrLocation) || 1);
          }
        } else if (book.fileType === "epub") {
          const parsed = parseFullEpub(buffer);
          if (!alive) return;
          setEpubDoc(parsed);

          if (progress?.pageOrLocation) {
            setEpubSectionIdx(Number(progress.pageOrLocation) || 0);
          }
        }
      } catch (err) {
        console.error("Error loading document:", err);
      } finally {
        if (alive) setLoadingDoc(false);
      }
    }
    loadBook();
    return () => {
      alive = false;
    };
  }, [book, book?.fileKey]);

  // Listen for text selection
  const handleMouseUp = () => {
    const text = window.getSelection()?.toString().trim();
    if (text && text.length > 1) {
      setSelectedText(text);
      setRightTab("highlights");
    }
  };

  const handleSaveMetadata = async () => {
    await updateBook.mutateAsync({
      id: bookId,
      patch: {
        title: metaTitle.trim() || book?.title,
        subtitle: metaSubtitle.trim() || undefined,
        author: metaAuthor.trim() || "Unknown",
        publisher: metaPublisher.trim() || undefined,
        rating: metaRating,
        tags: metaTags.split(",").map((t) => t.trim()).filter(Boolean),
        description: metaDesc.trim() || undefined,
      },
    });
    setMetaSaved(true);
    setTimeout(() => setMetaSaved(false), 2000);
  };

  const handleAddBookmark = () => {
    const loc = book?.fileType === "pdf" ? pdfCurrentPage : epubSectionIdx + 1;
    const title = book?.fileType === "pdf" ? `Page ${pdfCurrentPage}` : `Section ${epubSectionIdx + 1}`;
    addBookmark.mutate({
      bookId,
      title,
      pageOrLocation: loc,
    });
  };

  const handleSaveHighlight = () => {
    if (!selectedText) return;
    const loc = book?.fileType === "pdf" ? pdfCurrentPage : epubSectionIdx + 1;
    addHighlight.mutate({
      bookId,
      text: selectedText,
      color: selectedColor,
      pageOrLocation: loc,
    });
    setSelectedText("");
  };

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    const loc = book?.fileType === "pdf" ? pdfCurrentPage : epubSectionIdx + 1;
    addNote.mutate({
      bookId,
      content: newNote.trim(),
      pageOrLocation: loc,
    });
    setNewNote("");
  };

  if (bookLoading || !book) {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-foreground">
        <div className="text-sm font-medium text-muted-foreground animate-pulse">Loading book...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background text-foreground select-text">
      {/* Top Reader Header */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-card/80 px-4 backdrop-blur z-20">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon-sm" onClick={() => navigate("/")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex flex-col">
            <h1 className="text-sm font-bold truncate max-w-xs md:max-w-md">{book.title}</h1>
            <p className="text-[11px] text-muted-foreground truncate">{book.author} · {book.fileType.toUpperCase()}</p>
          </div>
        </div>

        {/* Center Controls (Zoom & Page Nav) */}
        <div className="flex items-center gap-2">
          {book.fileType === "pdf" ? (
            <>
              <Button
                variant="ghost"
                size="icon-sm"
                disabled={pdfCurrentPage <= 1}
                onClick={() => setPdfCurrentPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs font-medium tabular-nums px-1">
                {pdfCurrentPage} / {pdfNumPages || 1}
              </span>
              <Button
                variant="ghost"
                size="icon-sm"
                disabled={pdfCurrentPage >= pdfNumPages}
                onClick={() => setPdfCurrentPage((p) => Math.min(pdfNumPages, p + 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <div className="h-4 w-px bg-border mx-1" />
              <Button
                variant="ghost"
                size="icon-sm"
                disabled={pdfScale <= 0.5}
                onClick={handlePdfZoomOut}
                title="Zoom Out"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <button
                onClick={handlePdfZoomReset}
                title="Reset Zoom to 100%"
                className="text-[11px] text-muted-foreground hover:text-foreground w-11 text-center font-medium transition-colors cursor-pointer"
              >
                {Math.round(pdfScale * 100)}%
              </button>
              <Button
                variant="ghost"
                size="icon-sm"
                disabled={pdfScale >= 3.0}
                onClick={handlePdfZoomIn}
                title="Zoom In"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </>
          ) : (
            epubDoc && (
              <>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  disabled={epubSectionIdx <= 0}
                  onClick={() => setEpubSectionIdx((i) => Math.max(0, i - 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-xs font-medium tabular-nums px-1">
                  Section {epubSectionIdx + 1} of {epubDoc.sections.length}
                </span>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  disabled={epubSectionIdx >= epubDoc.sections.length - 1}
                  onClick={() => setEpubSectionIdx((i) => Math.min(epubDoc.sections.length - 1, i + 1))}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <div className="h-4 w-px bg-border mx-1" />
                <Button
                  variant="ghost"
                  size="icon-sm"
                  disabled={epubFontSize <= 70}
                  onClick={handleEpubZoomOut}
                  title="Decrease Font Size"
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <button
                  onClick={() => setEpubFontSize(100)}
                  title="Reset Font Size"
                  className="text-[11px] text-muted-foreground hover:text-foreground w-11 text-center font-medium transition-colors cursor-pointer"
                >
                  {epubFontSize}%
                </button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  disabled={epubFontSize >= 200}
                  onClick={handleEpubZoomIn}
                  title="Increase Font Size"
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </>
            )
          )}
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant={leftPinned ? "secondary" : "ghost"}
            size="sm"
            className="text-xs h-8 gap-1.5"
            onClick={() => setLeftPinned((p) => !p)}
          >
            {leftPinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
            <span className="hidden md:inline">TOC / Bookmarks</span>
          </Button>

          <Button
            variant={rightPinned ? "secondary" : "ghost"}
            size="sm"
            className="text-xs h-8 gap-1.5"
            onClick={() => setRightPinned((p) => !p)}
          >
            {rightPinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
            <span className="hidden md:inline">Notes & Info</span>
          </Button>
        </div>
      </header>

      {/* 3-Column Main Body */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Column (Pinnable / Collapsible) */}
        {leftPinned && (
          <aside className="w-72 shrink-0 border-r border-border bg-card flex flex-col z-10 animate-in slide-in-from-left duration-200">
            {/* Left Tabs */}
            <div className="flex border-b border-border p-1 bg-background/50">
              <button
                onClick={() => setLeftTab("toc")}
                className={cn(
                  "flex-1 py-1.5 text-xs font-semibold rounded flex items-center justify-center gap-1.5 transition-colors",
                  leftTab === "toc" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <List className="h-3.5 w-3.5" /> Table of Contents
              </button>
              <button
                onClick={() => setLeftTab("bookmarks")}
                className={cn(
                  "flex-1 py-1.5 text-xs font-semibold rounded flex items-center justify-center gap-1.5 transition-colors",
                  leftTab === "bookmarks" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <BookmarkIcon className="h-3.5 w-3.5" /> Bookmarks ({bookmarks.length})
              </button>
            </div>

            {/* Left Tab Content */}
            <div className="flex-1 overflow-y-auto p-3">
              {leftTab === "toc" && (
                <div className="flex flex-col gap-1">
                  {book.fileType === "pdf" ? (
                    pdfOutline.length > 0 ? (
                      pdfOutline.map((item, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setPdfCurrentPage(item.pageNumber);
                            const el = document.getElementById(`pdf-page-${item.pageNumber}`);
                            if (el) {
                              el.scrollIntoView({ behavior: "smooth", block: "start" });
                            }
                          }}
                          className={cn(
                            "text-left text-xs py-2 px-2.5 rounded-md transition-colors flex items-center justify-between",
                            pdfCurrentPage === item.pageNumber
                              ? "bg-primary/20 text-primary font-bold"
                              : "text-muted-foreground hover:bg-accent hover:text-foreground"
                          )}
                        >
                          <span className="truncate pr-2">{item.title}</span>
                          <span className="text-[10px] opacity-70">p.{item.pageNumber}</span>
                        </button>
                      ))
                    ) : (
                      <p className="text-xs text-muted-foreground p-3 text-center">No table of contents in this PDF.</p>
                    )
                  ) : (
                    epubDoc?.toc.map((t, idx) => (
                      <button
                        key={t.id || idx}
                        onClick={() => {
                          let targetIdx = epubDoc.sections.findIndex((s) => s.href.includes(t.href.split("#")[0]));
                          if (targetIdx === -1) targetIdx = idx;
                          setEpubSectionIdx(targetIdx);
                          const el = document.getElementById(`epub-sec-${targetIdx}`);
                          if (el) {
                            el.scrollIntoView({ behavior: "smooth", block: "start" });
                          }
                        }}
                        className={cn(
                          "text-left text-xs py-2 px-2.5 rounded-md transition-colors truncate",
                          epubSectionIdx === idx
                            ? "bg-primary/20 text-primary font-bold"
                            : "text-muted-foreground hover:bg-accent hover:text-foreground"
                        )}
                      >
                        {t.label}
                      </button>
                    ))
                  )}
                </div>
              )}

              {leftTab === "bookmarks" && (
                <div className="flex flex-col gap-3">
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full text-xs gap-1.5 border-dashed"
                    onClick={handleAddBookmark}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Bookmark current {book.fileType === "pdf" ? `Page ${pdfCurrentPage}` : `Section ${epubSectionIdx + 1}`}
                  </Button>

                  <div className="flex flex-col gap-1.5">
                    {bookmarks.map((bm) => (
                      <div
                        key={bm.id}
                        className="group flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2 text-xs transition-colors hover:border-primary/50"
                      >
                        <button
                          onClick={() => {
                            if (book.fileType === "pdf") {
                              const p = Number(bm.pageOrLocation);
                              setPdfCurrentPage(p);
                              const el = document.getElementById(`pdf-page-${p}`);
                              if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                            } else {
                              const s = Number(bm.pageOrLocation) - 1;
                              setEpubSectionIdx(s);
                              const el = document.getElementById(`epub-sec-${s}`);
                              if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                            }
                          }}
                          className="flex-1 text-left truncate font-medium text-foreground hover:text-primary"
                        >
                          {bm.title}
                        </button>
                        <button
                          onClick={() => deleteBookmark.mutate({ id: bm.id!, bookId })}
                          className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                    {bookmarks.length === 0 && (
                      <p className="text-xs text-muted-foreground p-3 text-center">No bookmarks saved yet.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </aside>
        )}

        {/* Center Column: Reader Viewport */}
        <main
          ref={centerScrollRef}
          onMouseUp={handleMouseUp}
          className="flex-1 overflow-auto bg-neutral-950 flex flex-col items-center justify-start p-4 md:p-8"
        >
          {loadingDoc ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground animate-pulse">
              Rendering document...
            </div>
          ) : book.fileType === "pdf" && pdfDoc ? (
            <div className="flex flex-col items-center pb-16 min-w-min">
              {Array.from({ length: pdfNumPages }).map((_, idx) => (
                <PdfPageItem
                  key={idx + 1}
                  pdfDoc={pdfDoc}
                  pageNumber={idx + 1}
                  scale={pdfScale}
                  onVisible={(page) => {
                    setPdfCurrentPage(page);
                    saveProgress.mutate({
                      bookId,
                      pageOrLocation: page,
                      percentage: Math.round((page / pdfNumPages) * 100),
                    });
                  }}
                />
              ))}
            </div>
          ) : (
            epubDoc && (
              <div
                className="flex flex-col items-center w-full max-w-3xl pb-16 gap-8"
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
                        __html: sec.html || "<p>Empty section</p>",
                      }}
                    />
                  </div>
                ))}
              </div>
            )
          )}
        </main>

        {/* Right Column (Pinnable / Collapsible) */}
        {rightPinned && (
          <aside className="w-80 shrink-0 border-l border-border bg-card flex flex-col z-10 animate-in slide-in-from-right duration-200">
            {/* Right Tabs */}
            <div className="flex border-b border-border p-1 bg-background/50">
              <button
                onClick={() => setRightTab("notes")}
                className={cn(
                  "flex-1 py-1.5 text-xs font-semibold rounded flex items-center justify-center gap-1 transition-colors",
                  rightTab === "notes" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <StickyNote className="h-3.5 w-3.5" /> Notes ({notes.length})
              </button>
              <button
                onClick={() => setRightTab("highlights")}
                className={cn(
                  "flex-1 py-1.5 text-xs font-semibold rounded flex items-center justify-center gap-1 transition-colors",
                  rightTab === "highlights" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Highlighter className="h-3.5 w-3.5" /> Highlights
              </button>
              <button
                onClick={() => setRightTab("metadata")}
                className={cn(
                  "flex-1 py-1.5 text-xs font-semibold rounded flex items-center justify-center gap-1 transition-colors",
                  rightTab === "metadata" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Info className="h-3.5 w-3.5" /> Metadata
              </button>
            </div>

            {/* Right Tab Content */}
            <div className="flex-1 overflow-y-auto p-3">
              {rightTab === "notes" && (
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-2 rounded-lg border border-border bg-background p-2.5">
                    <textarea
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder={`Add note for ${book.fileType === "pdf" ? `page ${pdfCurrentPage}` : `section ${epubSectionIdx + 1}`}...`}
                      rows={3}
                      className="w-full bg-transparent text-xs text-foreground outline-none resize-none placeholder:text-muted-foreground"
                    />
                    <div className="flex justify-end">
                      <Button size="sm" className="h-7 text-xs" onClick={handleAddNote}>
                        Save Note
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    {notes.map((n) => (
                      <div
                        key={n.id}
                        className="group flex flex-col gap-1.5 rounded-lg border border-border bg-background p-3 text-xs"
                      >
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                          <span className="font-semibold text-primary">
                            {n.pageOrLocation ? `Page / Loc: ${n.pageOrLocation}` : "General Note"}
                          </span>
                          <button
                            onClick={() => deleteNote.mutate({ id: n.id!, bookId })}
                            className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <p className="text-neutral-300 whitespace-pre-wrap">{n.content}</p>
                      </div>
                    ))}
                    {notes.length === 0 && (
                      <p className="text-xs text-muted-foreground p-3 text-center">No notes written for this book yet.</p>
                    )}
                  </div>
                </div>
              )}

              {rightTab === "highlights" && (
                <div className="flex flex-col gap-3">
                  {selectedText ? (
                    <div className="flex flex-col gap-2.5 rounded-lg border border-primary/40 bg-primary/10 p-3 animate-in fade-in">
                      <span className="text-[11px] font-bold text-primary">Create Highlight</span>
                      <blockquote className="text-xs italic text-foreground/90 border-l-2 border-primary pl-2 line-clamp-3">
                        "{selectedText}"
                      </blockquote>
                      <div className="flex items-center justify-between pt-1">
                        <div className="flex gap-1.5">
                          {["yellow", "green", "blue", "purple"].map((col) => (
                            <button
                              key={col}
                              onClick={() => setSelectedColor(col)}
                              className={cn(
                                "h-4 w-4 rounded-full border",
                                col === "yellow" && "bg-yellow-400 border-yellow-500",
                                col === "green" && "bg-green-400 border-green-500",
                                col === "blue" && "bg-blue-400 border-blue-500",
                                col === "purple" && "bg-purple-400 border-purple-500",
                                selectedColor === col && "ring-2 ring-white scale-110"
                              )}
                            />
                          ))}
                        </div>
                        <Button size="sm" className="h-7 text-xs" onClick={handleSaveHighlight}>
                          Highlight
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-[11px] text-muted-foreground text-center bg-background/50 p-2.5 rounded-md border border-border">
                      Tip: Select text in the document to create highlights.
                    </p>
                  )}

                  <div className="flex flex-col gap-2">
                    {highlights.map((h) => (
                      <div
                        key={h.id}
                        className="group flex flex-col gap-1 rounded-lg border border-border bg-background p-3 text-xs"
                      >
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                          <span className="flex items-center gap-1 font-medium">
                            <span
                              className={cn(
                                "h-2 w-2 rounded-full",
                                h.color === "yellow" && "bg-yellow-400",
                                h.color === "green" && "bg-green-400",
                                h.color === "blue" && "bg-blue-400",
                                h.color === "purple" && "bg-purple-400"
                              )}
                            />
                            Loc: {h.pageOrLocation}
                          </span>
                          <button
                            onClick={() => deleteHighlight.mutate({ id: h.id!, bookId })}
                            className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <blockquote className="text-neutral-300 italic">"{h.text}"</blockquote>
                      </div>
                    ))}
                    {highlights.length === 0 && (
                      <p className="text-xs text-muted-foreground p-3 text-center">No highlights saved yet.</p>
                    )}
                  </div>
                </div>
              )}

              {rightTab === "metadata" && (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground">Edit Metadata on the fly</span>
                    {metaSaved && <span className="text-xs font-bold text-green-400">Saved!</span>}
                  </div>

                  <label className="flex flex-col gap-1 text-[11px] text-muted-foreground">
                    Title
                    <Input value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} className="h-8 text-xs" />
                  </label>

                  <label className="flex flex-col gap-1 text-[11px] text-muted-foreground">
                    Subtitle
                    <Input value={metaSubtitle} onChange={(e) => setMetaSubtitle(e.target.value)} className="h-8 text-xs" />
                  </label>

                  <label className="flex flex-col gap-1 text-[11px] text-muted-foreground">
                    Author
                    <Input value={metaAuthor} onChange={(e) => setMetaAuthor(e.target.value)} className="h-8 text-xs" />
                  </label>

                  <label className="flex flex-col gap-1 text-[11px] text-muted-foreground">
                    Publisher
                    <Input value={metaPublisher} onChange={(e) => setMetaPublisher(e.target.value)} className="h-8 text-xs" />
                  </label>

                  <div className="flex flex-col gap-1 text-[11px] text-muted-foreground">
                    Rating
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setMetaRating(i + 1)}
                          className="p-0.5"
                        >
                          <Star
                            className={cn(
                              "h-4 w-4",
                              i < metaRating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/50"
                            )}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <label className="flex flex-col gap-1 text-[11px] text-muted-foreground">
                    Tags (comma separated)
                    <Input value={metaTags} onChange={(e) => setMetaTags(e.target.value)} className="h-8 text-xs" />
                  </label>

                  <label className="flex flex-col gap-1 text-[11px] text-muted-foreground">
                    Description
                    <textarea
                      value={metaDesc}
                      onChange={(e) => setMetaDesc(e.target.value)}
                      rows={3}
                      className="w-full rounded-md border border-input bg-transparent px-2.5 py-1.5 text-xs text-foreground outline-none resize-none"
                    />
                  </label>

                  <Button size="sm" className="mt-1 gap-1.5" onClick={handleSaveMetadata}>
                    <Save className="h-3.5 w-3.5" /> Save Metadata
                  </Button>
                </div>
              )}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
