import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Check, Pencil, Trash2, X } from "lucide-react";
import { LibrarySections } from "@/components/library/LibrarySections";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useCollectionBooks,
  useCollections,
  useDeleteCollection,
  useSaveCollections,
} from "@/db/hooks";
import { useUIStore } from "@/stores/uiStore";

export function CollectionPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const collectionId = Number(id);
  const { data: collections = [] } = useCollections();
  const collection = collections.find((c) => c.id === collectionId);
  const { data: books = [] } = useCollectionBooks(collectionId);
  const saveCollections = useSaveCollections();
  const deleteCollection = useDeleteCollection();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const searchQuery = useUIStore((s) => s.searchQuery).trim().toLowerCase();

  const viewBooks = searchQuery
    ? books.filter((b) => {
        const titleMatch = b.title.toLowerCase().includes(searchQuery);
        const subtitleMatch = b.subtitle?.toLowerCase().includes(searchQuery) ?? false;
        const authorMatch = b.author.toLowerCase().includes(searchQuery);
        const publisherMatch = b.publisher?.toLowerCase().includes(searchQuery) ?? false;
        const tagMatch = b.tags.some((t) => t.toLowerCase().includes(searchQuery));
        const descMatch = b.description?.toLowerCase().includes(searchQuery) ?? false;
        return titleMatch || subtitleMatch || authorMatch || publisherMatch || tagMatch || descMatch;
      })
    : books;

  if (!collection) {
    return <h1 className="text-2xl font-bold">Collection not found</h1>;
  }

  const rename = async () => {
    if (name.trim()) {
      await saveCollections.mutateAsync([{ ...collection, name: name.trim() }]);
    }
    setEditing(false);
  };

  const remove = async () => {
    if (confirm(`Delete collection "${collection.name}"?`)) {
      await deleteCollection.mutateAsync(collection.id!);
      navigate("/");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        {editing ? (
          <div className="flex items-center gap-2">
            <Input
              value={name}
              autoFocus
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") rename();
                if (e.key === "Escape") setEditing(false);
              }}
              className="w-64"
            />
            <Button variant="ghost" size="icon-sm" onClick={rename}>
              <Check />
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={() => setEditing(false)}>
              <X />
            </Button>
          </div>
        ) : (
          <h1 className="text-2xl font-bold">{collection.name}</h1>
        )}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => {
              setName(collection.name);
              setEditing(true);
            }}
          >
            <Pencil />
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={remove}>
            <Trash2 />
          </Button>
        </div>
      </div>

      <LibrarySections
        baseBooks={viewBooks}
        scopeType="collection"
        scopeId={String(collectionId)}
        emptyText={
          searchQuery
            ? `No books match "${searchQuery}" in this collection.`
            : 'No books here yet — right-click any book and choose "Move to Collection".'
        }
      />
    </div>
  );
}
