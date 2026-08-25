import { useState } from "react";
import { CheckSquare, Edit3, FolderInput, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUIStore } from "@/stores/uiStore";
import {
  useAddBooksToCollection,
  useCollections,
  useDeleteBooks,
} from "@/db/hooks";
import { BulkEditModal } from "./BulkEditModal";

export function BulkActionBar() {
  const ids = useUIStore((s) => s.selectedIds);
  const clearSelection = useUIStore((s) => s.clearSelection);
  const deleteBooks = useDeleteBooks();
  const addToCollection = useAddBooksToCollection();
  const { data: collections = [] } = useCollections();
  const [editOpen, setEditOpen] = useState(false);

  if (!ids.length) return null;

  const moveTo = (value: string) => {
    if (!value) return;
    addToCollection.mutate({ bookIds: ids, collectionId: Number(value) });
    clearSelection();
  };

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-primary/30 bg-card/95 px-4 py-2.5 shadow-lg backdrop-blur ring-1 ring-primary/20 animate-in fade-in slide-in-from-top-2 duration-200">
      <div className="flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/20 text-primary">
          <CheckSquare className="h-4 w-4" />
        </span>
        <span className="text-sm font-semibold text-foreground">
          {ids.length} {ids.length === 1 ? "book" : "books"} selected
        </span>
      </div>

      <div className="flex-1" />

      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          className="h-8 gap-1.5 border-border bg-card font-medium text-foreground hover:bg-accent"
          onClick={() => setEditOpen(true)}
        >
          <Edit3 className="h-3.5 w-3.5" />
          Edit metadata
        </Button>

        {collections.length > 0 && (
          <div className="relative flex items-center">
            <FolderInput className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <select
              value=""
              onChange={(e) => moveTo(e.target.value)}
              className="h-8 appearance-none rounded-md border border-border bg-card pl-8 pr-7 text-xs font-medium text-foreground outline-none transition-colors hover:border-primary/50 focus:border-primary focus:ring-1 focus:ring-primary cursor-pointer"
            >
              <option value="" disabled className="bg-neutral-900 text-neutral-400">
                Move to collection…
              </option>
              {collections.map((c) => (
                <option key={c.id} value={c.id} className="bg-neutral-900 text-white">
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <Button
          size="sm"
          variant="destructive"
          className="h-8 gap-1.5 font-medium shadow-xs"
          onClick={() => {
            deleteBooks.mutate(ids);
            clearSelection();
          }}
        >
          <Trash2 className="h-3.5 w-3.5" />
          Delete
        </Button>

        <Button
          size="sm"
          variant="ghost"
          className="h-8 gap-1 text-muted-foreground hover:text-foreground"
          onClick={clearSelection}
        >
          <X className="h-3.5 w-3.5" />
          Clear
        </Button>
      </div>

      {editOpen && <BulkEditModal ids={ids} onClose={() => setEditOpen(false)} />}
    </div>
  );
}
