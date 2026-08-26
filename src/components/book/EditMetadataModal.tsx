import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  Check,
  ChevronDown,
  Heart,
  Pencil,
  Star,
  Upload,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCover } from "@/lib/useCover";
import { saveFile } from "@/db/opfs";
import { useUpdateBook } from "@/db/hooks";
import { useUIStore } from "@/stores/uiStore";
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
  readonly = false,
}: {
  value: number;
  onChange?: (v: number) => void;
  readonly?: boolean;
}) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <button
          key={i}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(i + 1)}
          className={cn("p-0.5", readonly ? "cursor-default" : "cursor-pointer")}
        >
          <Star
            className={cn(
              "h-4.5 w-4.5",
              i < value
                ? "fill-yellow-400 text-yellow-400"
                : "text-muted-foreground/30",
            )}
          />
        </button>
      ))}
      <span className="ml-2 text-xs font-medium text-muted-foreground">
        {value ? `${value} / 5` : "Unrated"}
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

function FormattedInline({ text }: { text: string }) {
  const parts = [];
  let remaining = text;
  let key = 0;
  const regex = /(\*\*.*?\*\*|\*.*?\*|`.*?`)/;

  while (remaining) {
    const match = remaining.match(regex);
    if (!match || match.index === undefined) {
      parts.push(<span key={key++}>{remaining}</span>);
      break;
    }

    if (match.index > 0) {
      parts.push(<span key={key++}>{remaining.slice(0, match.index)}</span>);
    }

    const matchedStr = match[0];
    if (matchedStr.startsWith("**") && matchedStr.endsWith("**")) {
      parts.push(
        <strong key={key++} className="font-semibold text-foreground">
          {matchedStr.slice(2, -2)}
        </strong>,
      );
    } else if (matchedStr.startsWith("*") && matchedStr.endsWith("*")) {
      parts.push(
        <em key={key++} className="italic text-foreground/90">
          {matchedStr.slice(1, -1)}
        </em>,
      );
    } else if (matchedStr.startsWith("`") && matchedStr.endsWith("`")) {
      parts.push(
        <code
          key={key++}
          className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono text-primary"
        >
          {matchedStr.slice(1, -1)}
        </code>,
      );
    }

    remaining = remaining.slice(match.index + matchedStr.length);
  }

  return <>{parts}</>;
}

function MarkdownText({ content }: { content: string }) {
  if (!content) return null;
  const paragraphs = content.split(/\n\s*\n/);

  return (
    <div className="flex flex-col gap-3 text-sm leading-relaxed text-foreground/90 select-text">
      {paragraphs.map((para, pIdx) => {
        const lines = para.trim().split("\n");

        if (lines.every((l) => /^[-*•]\s+/.test(l.trim()))) {
          return (
            <ul key={pIdx} className="list-disc list-inside space-y-1.5 pl-1">
              {lines.map((line, lIdx) => (
                <li key={lIdx} className="text-foreground/90">
                  <FormattedInline text={line.replace(/^[-*•]\s+/, "")} />
                </li>
              ))}
            </ul>
          );
        }

        if (lines.every((l) => /^\d+\.\s+/.test(l.trim()))) {
          return (
            <ol key={pIdx} className="list-decimal list-inside space-y-1.5 pl-1">
              {lines.map((line, lIdx) => (
                <li key={lIdx} className="text-foreground/90">
                  <FormattedInline text={line.replace(/^\d+\.\s+/, "")} />
                </li>
              ))}
            </ol>
          );
        }

        if (lines.every((l) => /^>\s*/.test(l.trim()))) {
          return (
            <blockquote
              key={pIdx}
              className="border-l-2 border-primary/60 pl-3.5 italic text-muted-foreground bg-primary/5 py-1.5 rounded-r"
            >
              {lines.map((line, lIdx) => (
                <p key={lIdx}>
                  <FormattedInline text={line.replace(/^>\s*/, "")} />
                </p>
              ))}
            </blockquote>
          );
        }

        if (para.startsWith("### ")) {
          return (
            <h4 key={pIdx} className="text-base font-bold text-foreground mt-1">
              <FormattedInline text={para.slice(4)} />
            </h4>
          );
        }
        if (para.startsWith("## ")) {
          return (
            <h3 key={pIdx} className="text-lg font-bold text-foreground mt-1">
              <FormattedInline text={para.slice(3)} />
            </h3>
          );
        }
        if (para.startsWith("# ")) {
          return (
            <h2 key={pIdx} className="text-xl font-bold text-foreground mt-1">
              <FormattedInline text={para.slice(2)} />
            </h2>
          );
        }

        return (
          <p key={pIdx} className="leading-relaxed">
            {lines.map((line, lIdx) => (
              <span key={lIdx}>
                <FormattedInline text={line} />
                {lIdx < lines.length - 1 && <br />}
              </span>
            ))}
          </p>
        );
      })}
    </div>
  );
}

export function BookDetailsModal({
  book,
  initialMode = "view",
  onClose,
}: {
  book: Book;
  initialMode?: "view" | "edit";
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const updateBook = useUpdateBook();
  const setIsEditingMetadata = useUIStore((s) => s.setIsEditingMetadata);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const [mode, setMode] = useState<"view" | "edit">(initialMode);
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

  useEffect(() => {
    setIsEditingMetadata(true);
    return () => setIsEditingMetadata(false);
  }, [setIsEditingMetadata]);

  // Sync state when book prop changes
  useEffect(() => {
    setCoverKey(book.coverKey);
    setTitle(book.title);
    setSubtitle(book.subtitle ?? "");
    setAuthor(book.author);
    setPublisher(book.publisher ?? "");
    setRating(book.rating);
    setProgress(book.progress ?? 0);
    setTags(book.tags.join(", "));
    setDescription(book.description ?? "");
    setStatus(book.readingStatus ?? "");
    setFavorite(book.isFavorite);
  }, [book]);

  const uploadCover = async (file: File | undefined) => {
    if (!file) return;
    const newKey = `${book.fileKey}.cover-${crypto.randomUUID()}`;
    await saveFile(newKey, file);
    await updateBook.mutateAsync({ id: book.id!, patch: { coverKey: newKey } });
    setCoverKey(newKey);
  };

  const handleToggleFavorite = async () => {
    const next = !favorite;
    setFavorite(next);
    await updateBook.mutateAsync({ id: book.id!, patch: { isFavorite: next } });
  };

  const handleUpdateStatus = async (newStatus: ReadingStatus | null) => {
    setStatus(newStatus ?? "");
    await updateBook.mutateAsync({
      id: book.id!,
      patch: { readingStatus: newStatus },
    });
  };

  const handleUpdateProgress = async (newProgress: number) => {
    setProgress(newProgress);
    await updateBook.mutateAsync({
      id: book.id!,
      patch: { progress: newProgress },
    });
  };

  const handleOpenReader = () => {
    onClose();
    navigate(`/reader/${book.id}`);
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
    setMode("view");
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        onPointerDown={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        className="fixed bottom-0 left-0 right-0 top-auto z-50 flex h-[85vh] max-h-[85vh] w-full max-w-full translate-x-0 translate-y-0 flex-col overflow-hidden rounded-t-3xl rounded-b-none border-t border-border bg-card p-4 sm:p-6 shadow-2xl transition-all duration-300 data-open:slide-in-from-bottom data-open:zoom-in-100 data-closed:slide-out-to-bottom sm:top-1/2 sm:left-1/2 sm:bottom-auto sm:right-auto sm:h-auto sm:max-h-[85vh] sm:w-full sm:max-w-3xl lg:sm:max-w-4xl sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl sm:border sm:data-open:zoom-in-95 sm:data-open:slide-in-from-bottom-0"
      >
        {/* Mobile Grab / Drag Handle Pill */}
        <div className="sm:hidden flex justify-center pb-2 -mt-1 shrink-0">
          <div className="h-1.5 w-12 rounded-full bg-muted-foreground/30" />
        </div>

        <DialogHeader className="flex flex-row items-center justify-between pb-3 border-b border-border/50 shrink-0">
          <div className="flex items-center gap-2">
            <DialogTitle className="text-lg font-bold">
              {mode === "view" ? "Book Overview" : "Edit Metadata"}
            </DialogTitle>
            {mode === "view" && (
              <span className="rounded-full bg-secondary px-2.5 py-0.5 text-[10px] font-semibold text-secondary-foreground uppercase tracking-wider">
                {book.fileType.toUpperCase()}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 pr-6">
            {mode === "view" ? (
              <>
                <button
                  type="button"
                  onClick={handleToggleFavorite}
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-lg border transition-colors cursor-pointer",
                    favorite
                      ? "border-rose-500/40 bg-rose-500/10 text-rose-500"
                      : "border-border text-muted-foreground hover:text-foreground hover:bg-accent",
                  )}
                  title={favorite ? "In Favorites" : "Add to Favorites"}
                >
                  <Heart
                    className={cn("h-4 w-4", favorite && "fill-rose-500")}
                  />
                </button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setMode("edit")}
                  className="h-8 gap-1.5 text-xs font-medium cursor-pointer shadow-2xs hover:bg-accent"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Edit Metadata</span>
                  <span className="sm:hidden">Edit</span>
                </Button>
              </>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMode("view")}
                className="h-8 text-xs font-medium cursor-pointer"
              >
                Back
              </Button>
            )}
          </div>
        </DialogHeader>

        {mode === "view" ? (
          /* ========================================================= */
          /*                     MODE A: VIEW OVERVIEW                 */
          /* ========================================================= */
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 flex-1 overflow-y-auto pr-1 py-1">
            {/* Left Column: Cover, Read Button & Quick Progress */}
            <div className="md:col-span-4 lg:col-span-4 flex flex-col gap-4">
              <div className="relative aspect-[2/3] w-36 max-h-52 md:w-full md:max-h-none mx-auto md:mx-0 overflow-hidden rounded-xl bg-neutral-900 border border-border/70 shadow-md shrink-0">
                {coverUrl ? (
                  <img
                    src={coverUrl}
                    alt={book.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center p-4 text-center">
                    <span className="text-sm font-semibold text-white">
                      {book.title}
                    </span>
                    <span className="mt-1 text-xs text-neutral-400">
                      {book.fileType.toUpperCase()}
                    </span>
                  </div>
                )}

                {/* Status Badge */}
                <div className="absolute left-2.5 top-2.5 z-10 flex flex-wrap gap-1">
                  {status === "currently-reading" && (
                    <span className="rounded-full bg-blue-950/85 px-2.5 py-0.5 text-[10px] font-semibold text-blue-400 backdrop-blur border border-blue-500/30 shadow-xs">
                      Reading
                    </span>
                  )}
                  {status === "wanna-read" && (
                    <span className="rounded-full bg-yellow-950/85 px-2.5 py-0.5 text-[10px] font-semibold text-yellow-400 backdrop-blur border border-yellow-500/30 shadow-xs">
                      Wanna Read
                    </span>
                  )}
                  {status === "finished" && (
                    <span className="rounded-full bg-green-950/85 px-2.5 py-0.5 text-[10px] font-semibold text-green-400 backdrop-blur border border-green-500/30 shadow-xs">
                      Finished
                    </span>
                  )}
                </div>
              </div>

              {/* Primary Read Button */}
              <Button
                size="lg"
                onClick={handleOpenReader}
                className="w-full gap-2 rounded-xl font-semibold shadow-md cursor-pointer hover:scale-[1.01] transition-all"
              >
                <BookOpen className="h-4.5 w-4.5" />
                <span>Read Book</span>
              </Button>

              {/* Progress Slider */}
              <div className="flex flex-col gap-1.5 rounded-xl border border-border/60 bg-muted/20 p-3 shadow-2xs">
                <div className="flex items-center justify-between text-xs font-medium">
                  <span className="text-muted-foreground">Reading Progress</span>
                  <span className="font-bold text-primary">{progress}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={progress}
                  onChange={(e) => handleUpdateProgress(Number(e.target.value))}
                  className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-secondary accent-primary"
                />
              </div>

              {/* Quick Status Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      variant="outline"
                      className="w-full justify-between rounded-xl border-border/80 text-xs font-medium cursor-pointer"
                    />
                  }
                >
                  <span>
                    Status:{" "}
                    <strong className="text-foreground">
                      {STATUSES.find((s) => s.value === status)?.label ?? "None"}
                    </strong>
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 opacity-60" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" className="min-w-44 p-1">
                  <DropdownMenuGroup>
                    <DropdownMenuLabel className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Reading Status
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => handleUpdateStatus(null)}
                      className="cursor-pointer text-xs"
                    >
                      <span>— None —</span>
                    </DropdownMenuItem>
                    {STATUSES.map((s) => (
                      <DropdownMenuItem
                        key={s.value}
                        onClick={() => handleUpdateStatus(s.value)}
                        className="cursor-pointer text-xs justify-between"
                      >
                        <span>{s.label}</span>
                        {status === s.value && (
                          <Check className="h-3.5 w-3.5 text-primary" />
                        )}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Right Column: Title, Subtitle, Author, Tags, & Rich Markdown Description */}
            <div className="md:col-span-8 lg:col-span-8 flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-bold tracking-tight text-foreground leading-snug">
                  {book.title}
                </h1>
                {book.subtitle && (
                  <p className="text-sm italic font-normal text-muted-foreground/90 leading-relaxed">
                    {book.subtitle}
                  </p>
                )}
                <p className="text-sm font-medium text-foreground/80 pt-1">
                  By <span className="font-semibold">{book.author}</span>
                  {book.publisher && (
                    <span className="text-muted-foreground font-normal">
                      {" "}
                      · Published by {book.publisher}
                    </span>
                  )}
                </p>
              </div>

              {/* Rating & Metadata Strip */}
              <div className="flex flex-wrap items-center gap-4 py-2 border-y border-border/40">
                <RatingInput value={book.rating} readonly />
                {book.tags.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5">
                    {book.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-secondary/80 px-2.5 py-0.5 text-xs font-medium text-secondary-foreground"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Description (Spacious Markdown View) */}
              <div className="flex flex-col gap-2 pt-1">
                <span className="text-xs font-bold uppercase tracking-wider text-primary">
                  Synopsis & Description
                </span>
                {book.description ? (
                  <div className="rounded-xl border border-border/50 bg-muted/15 p-4">
                    <MarkdownText content={book.description} />
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-border/70 p-6 text-center text-xs text-muted-foreground">
                    No description available for this book. Click{" "}
                    <strong className="text-foreground">Edit Metadata</strong>{" "}
                    to write synopsis, notes, or chapter lists in Markdown.
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* ========================================================= */
          /*                     MODE B: EDIT METADATA                 */
          /* ========================================================= */
          <div className="flex flex-1 flex-col gap-4 overflow-y-auto pr-1 py-1">
            <div className="flex flex-col sm:flex-row gap-5">
              {/* Cover Upload */}
              <div className="flex shrink-0 flex-col items-center gap-2">
                <div className="relative h-44 w-32 overflow-hidden rounded-lg bg-neutral-900 border border-border shadow-sm">
                  {coverUrl ? (
                    <img
                      src={coverUrl}
                      alt={book.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center p-2 text-center text-xs font-bold text-white">
                      {book.title.slice(0, 30)}
                    </div>
                  )}
                </div>
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
                  className="h-8 gap-1.5 text-xs font-medium cursor-pointer"
                >
                  <Upload className="h-3.5 w-3.5" />
                  <span>Upload Cover</span>
                </Button>
              </div>

              {/* Main Fields */}
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                  <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                    Rating
                    <RatingInput value={rating} onChange={setRating} />
                  </div>
                  <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                    <div className="flex items-center justify-between">
                      <span>Reading Progress</span>
                      <span className="font-bold text-primary">{progress}%</span>
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
                </div>
                <Field label="Tags (comma separated)">
                  <Input value={tags} onChange={(e) => setTags(e.target.value)} />
                </Field>
                <Field label="Description (Markdown supported: **bold**, *italic*, # headings, - lists, > quotes)">
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={6}
                    placeholder="Enter book synopsis or notes with markdown formatting..."
                    className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring font-sans leading-relaxed"
                  />
                </Field>
                <div className="grid grid-cols-2 items-end gap-3 pt-1">
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
                  <label className="flex items-center gap-2 pb-2 text-sm">
                    <input
                      type="checkbox"
                      checked={favorite}
                      onChange={(e) => setFavorite(e.target.checked)}
                      className="h-4 w-4 accent-primary cursor-pointer"
                    />
                    Favorite
                  </label>
                </div>
              </div>
            </div>

            <DialogFooter className="pt-3 border-t border-border/50 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setMode("view")}>
                Cancel
              </Button>
              <Button onClick={save}>Save Changes</Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Alias for backwards-compatibility across existing imports
export { BookDetailsModal as EditMetadataModal };
