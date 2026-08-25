import type { ReactNode } from "react";
import {
  SortableContext,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { BookCard } from "./BookCard";
import { BookRow } from "./BookRow";
import { useSettings } from "@/db/hooks";
import type { Book } from "@/db/schema";

export type SortableMode = "global" | { folderId: number };

function SortableItem({
  id,
  children,
}: {
  id: number;
  children: ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });
  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : undefined,
        zIndex: isDragging ? 10 : undefined,
      }}
      {...attributes}
      {...listeners}
    >
      {children}
    </div>
  );
}

export function BookGrid({
  books,
  scopeType,
  scopeId,
  sortable,
}: {
  books: Book[];
  scopeType?: string;
  scopeId?: string;
  sortable?: SortableMode;
}) {
  const { data: settings } = useSettings();
  const cols = settings?.booksPerRow ?? 4;
  const Row = settings?.viewMode === "row" ? BookRow : BookCard;

  const grid = (
    <div
      className="grid gap-4"
      style={{
        gridTemplateColumns:
          settings?.viewMode === "row"
            ? `repeat(auto-fill, minmax(min(100%, max(360px, calc(100% / ${cols} - 1rem))), 1fr))`
            : `repeat(${cols}, minmax(0, 1fr))`,
      }}
    >
      {books.map((book) =>
        sortable ? (
          <SortableItem key={book.id} id={book.id!}>
            <Row book={book} scopeType={scopeType} scopeId={scopeId} />
          </SortableItem>
        ) : (
          <Row key={book.id} book={book} scopeType={scopeType} scopeId={scopeId} />
        ),
      )}
    </div>
  );

  if (!sortable) return grid;

  return (
    <SortableContext
      items={books.map((b) => b.id!)}
      strategy={rectSortingStrategy}
    >
      {grid}
    </SortableContext>
  );
}
