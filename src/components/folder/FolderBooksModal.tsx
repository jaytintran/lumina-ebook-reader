import { useState } from "react";
import { FolderPlus, Settings2, X } from "lucide-react";
import type { Book, Folder as FolderT } from "@/db/schema";
import { BookGrid } from "@/components/book/BookGrid";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FolderIcon, FolderSettingsDialog } from "./FolderPillStrip";

export function FolderBooksModal({
  folder,
  books,
  scopeType,
  scopeId,
  onClose,
}: {
  folder: FolderT;
  books: Book[];
  scopeType?: string;
  scopeId?: string;
  onClose: () => void;
}) {
  const [editingSettings, setEditingSettings] = useState(false);

  return (
    <>
      <Dialog open onOpenChange={(o) => !o && onClose()}>
        <DialogContent
          showCloseButton={false}
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          className="fixed bottom-0 left-0 right-0 top-auto z-50 flex h-[85vh] max-h-[85vh] w-full max-w-full translate-x-0 translate-y-0 flex-col overflow-hidden rounded-t-3xl rounded-b-none border-t border-border bg-card p-4 sm:p-6 shadow-2xl transition-all duration-300 data-open:slide-in-from-bottom data-open:zoom-in-100 data-closed:slide-out-to-bottom sm:top-1/2 sm:left-1/2 sm:bottom-auto sm:right-auto sm:h-auto sm:max-h-[85vh] sm:w-full sm:max-w-3xl lg:sm:max-w-4xl sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl sm:border sm:data-open:zoom-in-95 sm:data-open:slide-in-from-bottom-0"
        >
          {/* Mobile Grab / Drag Handle Pill */}
          <div className="sm:hidden flex justify-center pb-2 -mt-1 shrink-0">
            <div className="h-1.5 w-12 rounded-full bg-muted-foreground/30" />
          </div>

          {/* Modal Header with Aligned Actions & X Button */}
          <DialogHeader className="flex flex-row items-center justify-between pb-3 border-b border-border/50 shrink-0">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary border border-primary/20">
                <FolderIcon name={folder.icon} className="h-5 w-5" />
              </span>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <DialogTitle className="text-lg font-bold text-foreground">
                    {folder.name}
                  </DialogTitle>
                  <span className="rounded-full bg-secondary px-2.5 py-0.5 text-[10px] font-semibold text-secondary-foreground uppercase tracking-wider tabular-nums">
                    {books.length} {books.length === 1 ? "book" : "books"}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  Folder contents
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditingSettings(true)}
                className="h-8 gap-1.5 text-xs font-medium cursor-pointer shadow-2xs hover:bg-accent"
                title="Folder Settings"
              >
                <Settings2 className="h-3.5 w-3.5" />
                <span>Edit Folder</span>
              </Button>

              <Button
                variant="ghost"
                size="icon-sm"
                onClick={onClose}
                className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent cursor-pointer"
                title="Close"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto pt-4 pr-1">
            {books.length > 0 ? (
              <BookGrid
                books={books}
                scopeType={scopeType}
                scopeId={scopeId}
                sortable={folder.id ? { folderId: folder.id } : undefined}
              />
            ) : (
              <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border/80 bg-background/30 py-16 px-4 text-center text-muted-foreground">
                <FolderPlus className="h-10 w-10 mb-2.5 opacity-50 text-primary" />
                <p className="text-sm font-semibold text-foreground">
                  Folder is empty
                </p>
                <p className="text-xs opacity-75 mt-1 max-w-xs">
                  Drag and drop books onto this folder card in your library to add them.
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {editingSettings && (
        <FolderSettingsDialog
          folder={folder}
          onClose={() => setEditingSettings(false)}
        />
      )}
    </>
  );
}
