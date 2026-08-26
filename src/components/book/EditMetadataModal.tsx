import { useRef, useState } from "react";
import { Check, ChevronDown, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCover } from "@/lib/useCover";
import { saveFile } from "@/db/opfs";
import { useUpdateBook } from "@/db/hooks";
import type { Book, ReadingStatus } from "@/db/schema";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const STATUSES: { value: ReadingStatus; label: string }[] = [
  { value: "currently-reading", label: "Currently Reading" },
  { value: "wanna-read", label: "Wanna Read" },
  { value: "finished", label: "Finished" },
];

function RatingInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChange(i + 1)}
          className="p-0.5"
        >
          <Star
            className={cn(
              "h-5 w-5",
              i < value
                ? "fill-yellow-400 text-yellow-400"
                : "text-muted-foreground",
            )}
          />
        </button>
      ))}
      <span className="ml-2 text-sm text-muted-foreground">
        {value ? `${value} / 5` : "No rating"}
      </span>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1 text-xs text-muted-foreground">
      {label}
      {children}
    </label>
  );
}

export function EditMetadataModal({
  book,
  onClose,
}: {
  book: Book;
  onClose: () => void;
}) {
  const updateBook = useUpdateBook();
  const coverInputRef = useRef<HTMLInputElement>(null);

  const [coverKey, setCoverKey] = useState(book.coverKey);
  const [title, setTitle] = useState(book.title);
  const [subtitle, setSubtitle] = useState(book.subtitle ?? "");
  const [author, setAuthor] = useState(book.author);
  const [publisher, setPublisher] = useState(book.publisher ?? "");
  const [rating, setRating] = useState(book.rating);
  const [progress, setProgress] = useState(book.progress ?? 0);
  const [tags, setTags] = useState(book.tags.join(", "));
  const [description, setDescription] = useState(book.description ?? "");
  const [status, setStatus] = useState<ReadingStatus | "">(
    book.readingStatus ?? "",
  );
  const [favorite, setFavorite] = useState(book.isFavorite);
  const coverUrl = useCover(coverKey);

  const uploadCover = async (file: File | undefined) => {
    if (!file) return;
    const newKey = `${book.fileKey}.cover-${crypto.randomUUID()}`;
    await saveFile(newKey, file);
    await updateBook.mutateAsync({ id: book.id!, patch: { coverKey: newKey } });
    setCoverKey(newKey);
  };

  const save = async () => {
    await updateBook.mutateAsync({
      id: book.id!,
      patch: {
        title: title.trim() || book.title,
        subtitle: subtitle.trim() || undefined,
        author: author.trim() || "Unknown",
        publisher: publisher.trim() || undefined,
        rating,
        progress,
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        description: description.trim() || undefined,
        readingStatus: status || null,
        isFavorite: favorite,
      },
    });
    onClose();
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Edit Metadata</DialogTitle>
        </DialogHeader>

        <div className="flex max-h-[70vh] gap-5 overflow-y-auto pr-1">
          <div className="flex shrink-0 flex-col items-center gap-2">
            {coverUrl ? (
              <img
                src={coverUrl}
                alt={book.title}
                className="h-44 w-32 rounded-sm object-cover"
              />
            ) : (
              <div className="flex h-44 w-32 items-center justify-center rounded-sm bg-neutral-800 p-2 text-center text-xs font-bold text-white">
                {book.title.slice(0, 30)}
              </div>
            )}
            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => uploadCover(e.target.files?.[0])}
            />
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => coverInputRef.current?.click()}
            >
              Upload cover
            </Button>
          </div>

          <div className="flex flex-1 flex-col gap-3">
            <Field label="Title">
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </Field>
            <Field label="Subtitle">
              <Input
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Author">
                <Input
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                />
              </Field>
              <Field label="Publisher">
                <Input
                  value={publisher}
                  onChange={(e) => setPublisher(e.target.value)}
                />
              </Field>
            </div>
            <div className="flex flex-col gap-1 text-xs text-muted-foreground">
              Rating
              <RatingInput value={rating} onChange={setRating} />
            </div>
            <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
              <div className="flex items-center justify-between">
                <span>Reading Progress</span>
                <span className="font-semibold text-primary">{progress}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={progress}
                onChange={(e) => setProgress(Number(e.target.value))}
                className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-secondary accent-primary"
              />
            </div>
            <Field label="Tags (comma separated)">
              <Input value={tags} onChange={(e) => setTags(e.target.value)} />
            </Field>
            <Field label="Description">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </Field>
            <div className="grid grid-cols-2 items-end gap-3">
              <Field label="Reading status">
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button
                        variant="outline"
                        type="button"
                        className="h-9 w-full justify-between rounded-md border-input bg-background px-3 text-sm font-normal text-foreground shadow-2xs hover:bg-accent"
                      />
                    }
                  >
                    <span
                      className={
                        status ? "text-foreground" : "text-muted-foreground"
                      }
                    >
                      {STATUSES.find((s) => s.value === status)?.label ??
                        "— None —"}
                    </span>
                    <ChevronDown className="h-4 w-4 text-muted-foreground opacity-60" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="start"
                    className="w-(--anchor-width) min-w-44 p-1"
                  >
                    <DropdownMenuGroup>
                      <DropdownMenuLabel className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Reading Status
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => setStatus("")}
                        className="cursor-pointer gap-2 rounded-md px-2.5 py-1.5 text-xs text-muted-foreground"
                      >
                        <span className="flex-1">— None —</span>
                        {!status && <Check className="h-3.5 w-3.5 text-primary" />}
                      </DropdownMenuItem>
                      {STATUSES.map((s) => (
                        <DropdownMenuItem
                          key={s.value}
                          onClick={() => setStatus(s.value)}
                          className="cursor-pointer gap-2 rounded-md px-2.5 py-1.5 text-xs"
                        >
                          <span className="flex-1">{s.label}</span>
                          {status === s.value && (
                            <Check className="h-3.5 w-3.5 text-primary" />
                          )}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </Field>
              <label className="flex items-center gap-2 pb-2.5 text-sm">
                <input
                  type="checkbox"
                  checked={favorite}
                  onChange={(e) => setFavorite(e.target.checked)}
                  className="h-4 w-4 accent-primary"
                />
                Favorite
              </label>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
