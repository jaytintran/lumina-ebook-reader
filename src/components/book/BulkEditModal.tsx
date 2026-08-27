import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { db } from "@/db/db";
import { useUpdateBook } from "@/db/hooks";
import type { Book, ReadingStatus } from "@/db/schema";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const STATUSES: { value: ReadingStatus; label: string }[] = [
  { value: "currently-reading", label: "Currently Reading" },
  { value: "wanna-read", label: "Wanna Read" },
  { value: "finished", label: "Finished" },
];

export function BulkEditModal({
  ids,
  onClose,
}: {
  ids: number[];
  onClose: () => void;
}) {
  const updateBook = useUpdateBook();
  const [author, setAuthor] = useState("");
  const [publisher, setPublisher] = useState("");
  const [rating, setRating] = useState<number | null>(null);
  const [status, setStatus] = useState("");
  const [favorite, setFavorite] = useState<boolean | null>(null);
  const [tags, setTags] = useState("");

  const apply = async () => {
    const newTags = tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    const authorTrimmed = author.trim();
    const publisherTrimmed = publisher.trim();

    for (const id of ids) {
      const patch: Partial<Book> = {};
      if (authorTrimmed) patch.author = authorTrimmed;
      if (publisherTrimmed) patch.publisher = publisherTrimmed;
      if (rating !== null) patch.rating = rating;
      if (status) patch.readingStatus = status as ReadingStatus;
      if (favorite !== null) patch.isFavorite = favorite;
      if (newTags.length) {
        const book = await db.books.get(id);
        patch.tags = [...new Set([...(book?.tags ?? []), ...newTags])];
      }
      if (Object.keys(patch).length > 0) {
        await updateBook.mutateAsync({ id, patch });
      }
    }
    onClose();
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[88vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Edit ({ids.length} books)</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-1">
          {/* Author */}
          <label className="flex flex-col gap-1.5 text-xs font-medium text-muted-foreground">
            Author
            <Input
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="— Leave unchanged —"
              className="text-sm text-foreground"
            />
          </label>

          {/* Publisher */}
          <label className="flex flex-col gap-1.5 text-xs font-medium text-muted-foreground">
            Publisher
            <Input
              value={publisher}
              onChange={(e) => setPublisher(e.target.value)}
              placeholder="— Leave unchanged —"
              className="text-sm text-foreground"
            />
          </label>

          {/* Rating */}
          <div className="flex flex-col gap-1.5 text-xs font-medium text-muted-foreground">
            Rating
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setRating(i + 1)}
                    className="p-0.5 cursor-pointer hover:scale-110 transition-transform"
                    title={`Rate ${i + 1} stars`}
                  >
                    <Star
                      className={cn(
                        "h-5 w-5",
                        rating !== null && i < rating
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-muted-foreground/30 hover:text-yellow-400/60",
                      )}
                    />
                  </button>
                ))}
              </div>
              {rating !== null ? (
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-foreground">
                    {rating} / 5
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setRating(null)}
                    className="h-6 px-1.5 text-[11px] text-muted-foreground hover:text-foreground"
                  >
                    Reset (Don't change)
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setRating(0)}
                    className="h-6 px-1.5 text-[11px] text-muted-foreground hover:text-foreground"
                  >
                    Clear rating (0)
                  </Button>
                </div>
              ) : (
                <span className="text-xs text-muted-foreground italic">
                  — Leave unchanged —
                </span>
              )}
            </div>
          </div>

          {/* Reading status */}
          <label className="flex flex-col gap-1.5 text-xs font-medium text-muted-foreground">
            Reading status
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="h-9 w-full rounded-md border border-input bg-card px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">— Leave unchanged —</option>
              {STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>

          {/* Favorite */}
          <div className="flex flex-col gap-1.5 text-xs font-medium text-muted-foreground">
            Favorite
            <div className="flex gap-2">
              <Button
                type="button"
                variant={favorite === true ? "default" : "outline"}
                size="sm"
                onClick={() => setFavorite(true)}
              >
                Mark favorite
              </Button>
              <Button
                type="button"
                variant={favorite === false ? "default" : "outline"}
                size="sm"
                onClick={() => setFavorite(false)}
              >
                Unfavorite
              </Button>
              <Button
                type="button"
                variant={favorite === null ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setFavorite(null)}
              >
                Leave unchanged
              </Button>
            </div>
          </div>

          {/* Tags */}
          <label className="flex flex-col gap-1.5 text-xs font-medium text-muted-foreground">
            Add tags (comma separated)
            <Input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g. Sci-Fi, Favorites, 2026"
              className="text-sm text-foreground"
            />
          </label>
        </div>

        <DialogFooter className="gap-2 pt-2 border-t border-border">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={apply}>Apply to {ids.length} books</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
