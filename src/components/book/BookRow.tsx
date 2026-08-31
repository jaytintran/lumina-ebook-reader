import { memo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, FileText, Heart, Pin, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCover } from "@/lib/useCover";
import { usePinnedBooks, useSettings, useUpdateBook } from "@/db/hooks";
import { useUIStore } from "@/stores/uiStore";
import type { Book } from "@/db/schema";
import { BookContextMenu } from "./BookContextMenu";
import { EditMetadataModal } from "./EditMetadataModal";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export const BookRow = memo(function BookRow({
  book,
  scopeType = "view",
  scopeId = "home",
}: {
  book: Book;
  scopeType?: string;
  scopeId?: string;
}) {
  const { data: settings } = useSettings();
  const updateBook = useUpdateBook();
  const { data: pinnedRows = [] } = usePinnedBooks(scopeType, scopeId);
  const isPinned = pinnedRows.some((p) => p.bookId === book.id);
  const coverUrl = useCover(book.coverKey);
  const navigate = useNavigate();
  const [modalMode, setModalMode] = useState<"view" | "edit" | null>(null);
  const hasSelection = useUIStore((s) => s.selectedIds.length > 0);
  const selected = useUIStore((s) => s.selectedIds.includes(book.id!));
  const toggleSelected = useUIStore((s) => s.toggleSelected);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startPosRef = useRef<{ x: number; y: number } | null>(null);
  const isLongPressRef = useRef(false);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    startPosRef.current = { x: e.clientX, y: e.clientY };
    isLongPressRef.current = false;
    timerRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      toggleSelected(book.id!);
      try {
        navigator.vibrate?.(40);
      } catch {
        // ignore
      }
    }, 500);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!startPosRef.current || !timerRef.current) return;
    const dist = Math.hypot(
      e.clientX - startPosRef.current.x,
      e.clientY - startPosRef.current.y,
    );
    if (dist > 8) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const handlePointerUpOrCancel = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleClick = () => {
    if (isLongPressRef.current) {
      isLongPressRef.current = false;
      return;
    }
    if (hasSelection) {
      toggleSelected(book.id!);
    } else {
      setModalMode("view");
    }
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/reader/${book.id}`);
  };

  return (
    <>
      <BookContextMenu
        book={book}
        onEdit={() => setModalMode("edit")}
        scopeType={scopeType}
        scopeId={scopeId}
      >
        <div
          className={cn(
            "group relative cursor-pointer rounded-lg border border-border bg-card p-4 transition-all hover:border-primary/50",
            selected && "border-primary bg-primary/10 ring-2 ring-primary shadow-md",
            hasSelection && !selected && "opacity-40 hover:opacity-75",
          )}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUpOrCancel}
          onPointerCancel={handlePointerUpOrCancel}
          onClick={handleClick}
          onDoubleClick={handleDoubleClick}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleSelected(book.id!);
            }}
            className={cn(
              "absolute right-3 top-3 z-20 flex h-6 w-6 items-center justify-center rounded-full border bg-card shadow transition-all",
              selected
                ? "border-primary bg-primary text-primary-foreground scale-110"
                : hasSelection
                  ? "border-muted-foreground/50 opacity-90 hover:scale-105"
                  : "border-border opacity-0 group-hover:opacity-100 hover:opacity-100",
            )}
          >
            {selected && <Check className="h-3.5 w-3.5 stroke-[3]" />}
          </button>
          <div className="flex gap-4">
            <div className="relative shrink-0">
              {coverUrl ? (
                <img
                  src={coverUrl}
                  alt={book.title}
                  loading="lazy"
                  decoding="async"
                  className="h-32 w-22 shrink-0 rounded-sm object-cover shadow-sm"
                />
              ) : (
                <div className="flex h-32 w-22 shrink-0 items-center justify-center rounded-sm bg-neutral-800 p-1 text-center text-[9px] font-bold text-white shadow-sm">
                  {book.title.slice(0, 24)}
                </div>
              )}

              {/* Status, Pinned, Favorite, and Description/Note Badges */}
              <div className="absolute left-1.5 top-1.5 z-10 flex flex-col items-start gap-1">
                {isPinned && (
                  <span className="flex h-4.5 w-4.5 items-center justify-center rounded-full bg-amber-950/85 text-amber-400 backdrop-blur border border-amber-500/40 shadow-xs" title="Pinned in this view">
                    <Pin className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
                  </span>
                )}
                {book.description && (
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setModalMode("view");
                          }}
                          className="flex h-4.5 w-4.5 items-center justify-center rounded-full bg-primary/80 text-primary-foreground backdrop-blur border border-primary/40 shadow-xs hover:scale-110 transition-transform cursor-pointer"
                          title="View description & notes"
                        >
                          <FileText className="h-2.5 w-2.5" />
                        </button>
                      }
                    />
                    <TooltipContent className="max-w-xs text-xs line-clamp-4 leading-relaxed">
                      {book.description.slice(0, 250)}
                    </TooltipContent>
                  </Tooltip>
                )}
                {book.isFavorite && (
                  <span className="flex h-4.5 w-4.5 items-center justify-center rounded-full bg-rose-950/80 text-rose-400 backdrop-blur border border-rose-500/30 shadow-xs">
                    <Heart className="h-2.5 w-2.5 fill-rose-500 text-rose-500" />
                  </span>
                )}
                {book.readingStatus === "finished" && (
                  <span className="rounded-full bg-green-950/80 px-1.5 py-0.2 text-[8px] font-semibold text-green-400 backdrop-blur border border-green-500/30 shadow-xs">
                    Finished
                  </span>
                )}
                {book.readingStatus === "currently-reading" && (
                  <span className="rounded-full bg-blue-950/80 px-1.5 py-0.2 text-[8px] font-semibold text-blue-400 backdrop-blur border border-blue-500/30 shadow-xs">
                    Reading
                  </span>
                )}
                {book.readingStatus === "wanna-read" && (
                  <span className="rounded-full bg-yellow-950/80 px-1.5 py-0.2 text-[8px] font-semibold text-yellow-400 backdrop-blur border border-yellow-500/30 shadow-xs">
                    Wanna Read
                  </span>
                )}
              </div>
            </div>
            <div className="flex min-w-0 flex-1 flex-col justify-between">
              <div className="flex flex-col gap-1">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-base font-semibold leading-snug">
                      {book.title}
                    </h3>
                    {(settings?.showSubtitle ?? true) && book.subtitle && (
                      <p className="text-xs text-muted-foreground">
                        {book.subtitle}
                      </p>
                    )}
                  </div>
                  {(settings?.showRating ?? true) && (
                    <div className="flex items-center gap-0.5 shrink-0">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={cn(
                            "h-3.5 w-3.5",
                            i < book.rating
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-muted-foreground/40",
                          )}
                        />
                      ))}
                    </div>
                  )}
                </div>
                {(settings?.showAuthor ?? true) && (
                  <p className="text-xs font-medium text-foreground/80">
                    {book.author} <span className="text-[10px] font-normal text-muted-foreground/70">· {book.fileType.toUpperCase()}</span>
                  </p>
                )}
              </div>

              {(settings?.showProgress ?? true) && (
                <div
                  className="flex items-center gap-3 py-1"
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium shrink-0">
                    <span>Progress:</span>
                    <span className="font-semibold text-primary">{book.progress ?? 0}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={book.progress ?? 0}
                    onChange={(e) => {
                      e.stopPropagation();
                      updateBook.mutate({
                        id: book.id!,
                        patch: { progress: Number(e.target.value) },
                      });
                    }}
                    className="h-1.5 flex-1 max-w-xs cursor-pointer appearance-none rounded-lg bg-secondary accent-primary hover:h-2 transition-all"
                  />
                </div>
              )}

              {(settings?.showTags ?? true) && book.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {book.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-full bg-accent px-2 py-0.5 text-[10px] text-muted-foreground"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </BookContextMenu>
      {modalMode && (
        <EditMetadataModal
          book={book}
          initialMode={modalMode}
          onClose={() => setModalMode(null)}
        />
      )}
    </>
  );
});
