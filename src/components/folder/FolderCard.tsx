import { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import { useCover } from "@/lib/useCover";
import type { Book, Folder as FolderT } from "@/db/schema";
import { FolderIcon, FolderSettingsDialog } from "./FolderPillStrip";

function MiniCoverSlot({ book }: { book?: Book }) {
  const coverUrl = useCover(book?.coverKey);

  if (!book) {
    return (
      <div className="flex h-full w-full items-center justify-center rounded border border-dashed border-border/30 bg-background/20" />
    );
  }

  return (
    <div className="relative h-full w-full overflow-hidden rounded bg-neutral-900 border border-border/50 shadow-xs flex items-center justify-center">
      {coverUrl ? (
        <img
          src={coverUrl}
          alt={book.title}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center p-1 text-center bg-card">
          <span className="text-[8px] font-semibold line-clamp-2 text-foreground/80 leading-tight">
            {book.title}
          </span>
        </div>
      )}
    </div>
  );
}

export function FolderCard({
  folder,
  books,
  onOpen,
}: {
  folder: FolderT;
  books: Book[];
  onOpen: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `folder-${folder.id}` });
  const [editingSettings, setEditingSettings] = useState(false);

  const previewBooks = [books[0], books[1], books[2], books[3]];

  return (
    <>
      <div
        ref={setNodeRef}
        onClick={onOpen}
        onContextMenu={(e) => {
          e.preventDefault();
          setEditingSettings(true);
        }}
        title="Click to open folder, right-click to edit"
        className={cn(
          "group relative flex flex-col justify-between cursor-pointer rounded-lg border border-border bg-card p-3 transition-all hover:border-primary/50 hover:bg-accent/20 shadow-xs select-none",
          isOver && "border-primary bg-primary/10 ring-2 ring-primary shadow-md scale-[1.02]",
        )}
      >
        <div className="flex flex-col gap-2.5">
          {/* 2x2 Grid of Covers */}
          <div
            className={cn(
              "relative aspect-[2/3] w-full overflow-hidden rounded-md bg-neutral-950/80 p-2 border border-border/60 shadow-sm transition-colors",
              isOver ? "border-primary bg-primary/20" : "group-hover:border-primary/40",
            )}
          >
            <div className="grid grid-cols-2 grid-rows-2 gap-1.5 h-full w-full">
              {previewBooks.map((b, idx) => (
                <MiniCoverSlot key={b?.id ?? `empty-${idx}`} book={b} />
              ))}
            </div>

            {/* Folder indicator badge */}
            <div className="absolute top-2 left-2 z-10 flex items-center gap-1 rounded-full bg-background/85 px-2 py-0.5 text-[10px] font-medium text-foreground backdrop-blur border border-border/60 shadow-xs">
              <FolderIcon name={folder.icon} className="h-3 w-3 text-primary" />
              <span>{books.length}</span>
            </div>
          </div>

          {/* Folder details */}
          <div className="flex min-w-0 flex-col gap-0.5">
            <div className="flex items-center gap-1.5">
              <FolderIcon name={folder.icon} className="h-3.5 w-3.5 text-primary shrink-0" />
              <h3 className="truncate text-sm font-semibold leading-snug text-foreground group-hover:text-primary transition-colors">
                {folder.name}
              </h3>
            </div>
            <p className="text-xs text-muted-foreground">
              {books.length} {books.length === 1 ? "book" : "books"}
            </p>
          </div>
        </div>
      </div>

      {editingSettings && (
        <FolderSettingsDialog
          folder={folder}
          onClose={() => setEditingSettings(false)}
        />
      )}
    </>
  );
}
