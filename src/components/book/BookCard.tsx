import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Heart, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCover } from "@/lib/useCover";
import { useSettings } from "@/db/hooks";
import { useUIStore } from "@/stores/uiStore";
import type { Book } from "@/db/schema";
import { BookContextMenu } from "./BookContextMenu";
import { EditMetadataModal } from "./EditMetadataModal";

export function BookCard({
  book,
  scopeType,
  scopeId,
}: {
  book: Book;
  scopeType?: string;
  scopeId?: string;
}) {
  const { data: settings } = useSettings();
  const coverUrl = useCover(book.coverKey);
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const hasSelection = useUIStore((s) => s.selectedIds.length > 0);
  const selected = useUIStore((s) => s.selectedIds.includes(book.id!));
  const toggleSelected = useUIStore((s) => s.toggleSelected);

  const handleClick = () => {
    if (hasSelection) {
      toggleSelected(book.id!);
    } else {
      navigate(`/reader/${book.id}`);
    }
  };

  return (
    <>
      <BookContextMenu
        book={book}
        onEdit={() => setEditing(true)}
        scopeType={scopeType}
        scopeId={scopeId}
      >
        <div
          className={cn(
            "group relative cursor-pointer rounded-lg border border-border bg-card p-3 transition-all hover:border-primary/50",
            selected && "border-primary bg-primary/10 ring-2 ring-primary shadow-md",
            hasSelection && !selected && "opacity-40 hover:opacity-75",
          )}
          onClick={handleClick}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleSelected(book.id!);
            }}
            className={cn(
              "absolute right-2 top-2 z-20 flex h-6 w-6 items-center justify-center rounded-full border bg-card shadow transition-all",
              selected
                ? "border-primary bg-primary text-primary-foreground scale-110"
                : hasSelection
                  ? "border-muted-foreground/50 opacity-90 hover:scale-105"
                  : "border-border opacity-0 group-hover:opacity-100 hover:opacity-100",
            )}
          >
            {selected && <Check className="h-3.5 w-3.5 stroke-[3]" />}
          </button>
          <div className="flex flex-col gap-2.5">
            <div className="relative aspect-[2/3] w-full overflow-hidden rounded-md bg-neutral-900 shadow-sm">
              {coverUrl ? (
                <img
                  src={coverUrl}
                  alt={book.title}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center p-3 text-center">
                  <span className="text-xs font-semibold line-clamp-3 text-white">
                    {book.title}
                  </span>
                  <span className="mt-1 text-[10px] text-neutral-400">
                    {book.fileType.toUpperCase()}
                  </span>
                </div>
              )}

              {/* Status and Favorite Badges */}
              <div className="absolute left-2 top-2 z-10 flex flex-wrap items-center gap-1">
                {book.isFavorite && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-950/80 text-rose-400 backdrop-blur border border-rose-500/30 shadow-xs">
                    <Heart className="h-3 w-3 fill-rose-500 text-rose-500" />
                  </span>
                )}
                {book.readingStatus === "finished" && (
                  <span className="rounded-full bg-green-950/80 px-2 py-0.5 text-[9px] font-semibold text-green-400 backdrop-blur border border-green-500/30 shadow-xs">
                    Finished
                  </span>
                )}
                {book.readingStatus === "currently-reading" && (
                  <span className="rounded-full bg-blue-950/80 px-2 py-0.5 text-[9px] font-semibold text-blue-400 backdrop-blur border border-blue-500/30 shadow-xs">
                    Reading
                  </span>
                )}
                {book.readingStatus === "wanna-read" && (
                  <span className="rounded-full bg-yellow-950/80 px-2 py-0.5 text-[9px] font-semibold text-yellow-400 backdrop-blur border border-yellow-500/30 shadow-xs">
                    Wanna Read
                  </span>
                )}
              </div>
            </div>
            <div className="flex min-w-0 flex-col gap-1">
              <h3 className="truncate text-sm font-semibold leading-snug">
                {book.title}
              </h3>
              {(settings?.showSubtitle ?? true) && book.subtitle && (
                <p className="truncate text-xs text-muted-foreground">
                  {book.subtitle}
                </p>
              )}
              {(settings?.showAuthor ?? true) && (
                <p className="truncate text-xs text-muted-foreground">
                  {book.author} · {book.fileType.toUpperCase()}
                </p>
              )}
              {(settings?.showRating ?? true) && (
                <div className="flex items-center gap-0.5 pt-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        "h-3 w-3",
                        i < book.rating
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-muted-foreground/40",
                      )}
                    />
                  ))}
                </div>
              )}
              {(settings?.showTags ?? true) && book.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {book.tags.slice(0, 3).map((t) => (
                    <span
                      key={t}
                      className="rounded-full bg-accent px-1.5 py-0.2 text-[9px] text-muted-foreground"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}
              {(settings?.showDescription ?? true) && book.description && (
                <p className="line-clamp-2 text-[11px] text-muted-foreground pt-0.5">
                  {book.description}
                </p>
              )}
            </div>
          </div>
        </div>
      </BookContextMenu>
      {editing && (
        <EditMetadataModal book={book} onClose={() => setEditing(false)} />
      )}
    </>
  );
}
