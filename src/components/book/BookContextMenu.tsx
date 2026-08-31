import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, CheckSquare, Heart, Pencil, Pin, PinOff, Trash2 } from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  useAddBooksToCollection,
  useAddBooksToFolder,
  useCollections,
  useDeleteBooks,
  useFolders,
  usePinnedBooks,
  useTogglePinBook,
  useUpdateBook,
} from "@/db/hooks";
import { useUIStore } from "@/stores/uiStore";
import type { Book } from "@/db/schema";
import { FolderIcon } from "@/components/folder/FolderPillStrip";

const STATUSES = ["currently-reading", "wanna-read", "finished"] as const;
const STATUS_LABELS: Record<string, string> = {
  "currently-reading": "Currently Reading",
  "wanna-read": "Wanna Read",
  finished: "Finished",
};

export function BookContextMenu({
  book,
  children,
  onEdit,
  scopeType = "view",
  scopeId = "home",
}: {
  book: Book;
  children: ReactNode;
  onEdit: () => void;
  scopeType?: string;
  scopeId?: string;
}) {
  const navigate = useNavigate();
  const updateBook = useUpdateBook();
  const deleteBooks = useDeleteBooks();
  const addToCollection = useAddBooksToCollection();
  const addToFolder = useAddBooksToFolder();
  const togglePin = useTogglePinBook();
  const { data: pinnedRows = [] } = usePinnedBooks(scopeType, scopeId);
  const isPinned = pinnedRows.some((p) => p.bookId === book.id);
  const { data: collections = [] } = useCollections();
  const { data: folders = [] } = useFolders(scopeType, scopeId);
  const selected = useUIStore((s) => s.selectedIds.includes(book.id!));
  const toggleSelected = useUIStore((s) => s.toggleSelected);

  return (
    <ContextMenu>
      <ContextMenuTrigger render={<div className="contents" />}>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onClick={() => navigate(`/reader/${book.id}`)}>
          <BookOpen /> Open
        </ContextMenuItem>
        <ContextMenuItem onClick={() => toggleSelected(book.id!)}>
          <CheckSquare className={selected ? "text-primary" : ""} />
          {selected ? "Deselect" : "Select"}
        </ContextMenuItem>
        <ContextMenuItem
          onClick={() =>
            togglePin.mutate({
              bookId: book.id!,
              scopeType: scopeType as "view" | "folder" | "collection",
              scopeId,
            })
          }
        >
          {isPinned ? (
            <>
              <PinOff className="h-4 w-4 text-amber-400" />
              <span>Unpin from Top</span>
            </>
          ) : (
            <>
              <Pin className="h-4 w-4 text-amber-400" />
              <span>Pin to Top</span>
            </>
          )}
        </ContextMenuItem>
        <ContextMenuItem onClick={onEdit}>
          <Pencil /> Edit Metadata
        </ContextMenuItem>
        <ContextMenuItem
          onClick={() =>
            updateBook.mutate({ id: book.id!, patch: { isFavorite: !book.isFavorite } })
          }
        >
          <Heart
            className={book.isFavorite ? "fill-rose-500 text-rose-500" : ""}
          />
          {book.isFavorite ? "Remove from Favorites" : "Add to Favorites"}
        </ContextMenuItem>
        <ContextMenuSub>
          <ContextMenuSubTrigger>Reading Status</ContextMenuSubTrigger>
          <ContextMenuSubContent>
            {STATUSES.map((s) => (
              <ContextMenuItem
                key={s}
                onClick={() =>
                  updateBook.mutate({ id: book.id!, patch: { readingStatus: s } })
                }
              >
                {STATUS_LABELS[s]}
              </ContextMenuItem>
            ))}
            {book.readingStatus && (
              <ContextMenuItem
                onClick={() =>
                  updateBook.mutate({ id: book.id!, patch: { readingStatus: null } })
                }
              >
                Clear
              </ContextMenuItem>
            )}
          </ContextMenuSubContent>
        </ContextMenuSub>
        {scopeType && scopeId && folders.length > 0 && (
          <ContextMenuSub>
            <ContextMenuSubTrigger>Move to Folder</ContextMenuSubTrigger>
            <ContextMenuSubContent>
              {folders.map((f) => (
                <ContextMenuItem
                  key={f.id}
                  onClick={() =>
                    addToFolder.mutate({ bookIds: [book.id!], folderId: f.id! })
                  }
                >
                  <FolderIcon name={f.icon} className="h-4 w-4" /> {f.name}
                </ContextMenuItem>
              ))}
            </ContextMenuSubContent>
          </ContextMenuSub>
        )}
        {collections.length > 0 && (
          <ContextMenuSub>
            <ContextMenuSubTrigger>Move to Collection</ContextMenuSubTrigger>
            <ContextMenuSubContent>
              {collections.map((c) => (
                <ContextMenuItem
                  key={c.id}
                  onClick={() =>
                    addToCollection.mutate({
                      bookIds: [book.id!],
                      collectionId: c.id!,
                    })
                  }
                >
                  {c.name}
                </ContextMenuItem>
              ))}
            </ContextMenuSubContent>
          </ContextMenuSub>
        )}
        <ContextMenuSeparator />
        <ContextMenuItem
          variant="destructive"
          onClick={() => deleteBooks.mutate([book.id!])}
        >
          <Trash2 /> Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
