import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export interface MockBook {
  id: number;
  title: string;
  author: string;
  fileType: "pdf" | "epub";
  rating: number;
  coverColor: string; // temp placeholder until real covers are wired
}

export function BookCard({ book }: { book: MockBook }) {
  return (
    <div className="group cursor-pointer rounded-lg border border-border bg-card p-3 transition-colors hover:border-primary/50">
      <div className="flex gap-3">
        <div
          className={cn(
            "flex h-24 w-16 shrink-0 items-center justify-center rounded-sm text-[10px] font-bold text-white",
            book.coverColor,
          )}
        >
          {book.title.slice(0, 12)}
        </div>
        <div className="flex min-w-0 flex-col justify-between py-0.5">
          <div>
            <h3 className="truncate text-sm font-semibold leading-tight">
              {book.title}
            </h3>
            <p className="mt-1 truncate text-xs text-muted-foreground">
              {book.author} · {book.fileType.toUpperCase()}
            </p>
          </div>
          <div className="flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={cn(
                  "h-3 w-3",
                  i < book.rating
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-muted-foreground",
                )}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
