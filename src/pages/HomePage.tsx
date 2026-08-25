import {
  Library,
  Heart,
  BookOpen,
  Bookmark,
  CheckCircle2,
  Plus,
} from "lucide-react";
import { StatCard } from "@/components/layout/StatCard";
import { BookGrid } from "@/components/book/BookGrid";
import { Button } from "@/components/ui/button";
import type { MockBook } from "@/components/book/BookCard";

const mockBooks: MockBook[] = [
  {
    id: 1,
    title: "The Laws of Human Nature",
    author: "Robert Greene",
    fileType: "pdf",
    rating: 4,
    coverColor: "bg-rose-900",
  },
  {
    id: 2,
    title: "The 48 Laws of Power",
    author: "Robert Greene",
    fileType: "pdf",
    rating: 5,
    coverColor: "bg-blue-950",
  },
  {
    id: 3,
    title: "The Power of Your Subconscious Mind",
    author: "Joseph Murphy",
    fileType: "pdf",
    rating: 0,
    coverColor: "bg-neutral-800",
  },
  {
    id: 4,
    title: "Reality Transurfing",
    author: "Vadim Zeland",
    fileType: "pdf",
    rating: 5,
    coverColor: "bg-pink-700",
  },
];

export function HomePage({ viewLabel }: { viewLabel: string }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        <StatCard
          icon={Library}
          value={mockBooks.length}
          label="Total Books"
          colorClass="bg-blue-500/15 text-blue-400"
        />
        <StatCard
          icon={Heart}
          value={0}
          label="Favorites"
          colorClass="bg-rose-500/15 text-rose-400"
        />
        <StatCard
          icon={BookOpen}
          value={0}
          label="Reading"
          colorClass="bg-blue-500/15 text-blue-400"
        />
        <StatCard
          icon={Bookmark}
          value={0}
          label="Wanna Read"
          colorClass="bg-yellow-500/15 text-yellow-400"
        />
        <StatCard
          icon={CheckCircle2}
          value={0}
          label="Finished"
          colorClass="bg-green-500/15 text-green-400"
        />
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Download Sources</h2>
          <Button variant="outline" size="sm">
            <Plus className="mr-1 h-4 w-4" /> Add Source
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          No sources yet — add your favorite book download sites.
        </p>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold">
          {viewLabel === "Home" ? "All Books" : viewLabel}
        </h2>
        <BookGrid books={mockBooks} />
      </div>
    </div>
  );
}
