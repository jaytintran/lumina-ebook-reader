import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragOverlay,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { SettingsModal } from "@/components/settings/SettingsModal";
import { BulkActionBar } from "@/components/book/BulkActionBar";
import {
  useBooks,
  useSettings,
  useUpdateBook,
  useAddBooksToCollection,
  useAddBooksToFolder,
  useReorderGlobal,
} from "@/db/hooks";
import { useCover } from "@/lib/useCover";
import type { Book } from "@/db/schema";

import { Heart, Star } from "lucide-react";
import type { Modifier } from "@dnd-kit/core";
import { cn } from "@/lib/utils";

const snapCenterToCursor: Modifier = ({
  activatorEvent,
  activeNodeRect,
  overlayNodeRect,
  transform,
}) => {
  if (activatorEvent && (overlayNodeRect || activeNodeRect)) {
    const rect = overlayNodeRect ?? activeNodeRect;
    if (rect && "clientX" in activatorEvent && "clientY" in activatorEvent) {
      const mouseX = (activatorEvent as MouseEvent).clientX;
      const mouseY = (activatorEvent as MouseEvent).clientY;
      const originX = rect.left + rect.width / 2;
      const originY = rect.top + rect.height / 2;

      return {
        ...transform,
        x: transform.x + mouseX - originX,
        y: transform.y + mouseY - originY,
      };
    }
  }
  return transform;
};

function DraggedBookOverlay({ book }: { book: Book }) {
  const { data: settings } = useSettings();
  const coverUrl = useCover(book.coverKey);
  const isRow = settings?.viewMode === "row";

  if (isRow) {
    return (
      <div className="w-[340px] rounded-lg border-2 border-primary/80 bg-card/85 p-3 shadow-2xl backdrop-blur-md opacity-85 rotate-1 pointer-events-none select-none">
        <div className="flex gap-3.5">
          <div className="relative shrink-0">
            {coverUrl ? (
              <img
                src={coverUrl}
                alt={book.title}
                className="h-28 w-20 shrink-0 rounded-sm object-cover shadow-sm"
              />
            ) : (
              <div className="flex h-28 w-20 shrink-0 items-center justify-center rounded-sm bg-neutral-800 p-1 text-center text-[9px] font-bold text-white shadow-sm">
                {book.title.slice(0, 20)}
              </div>
            )}

            {/* Status and Favorite Badges */}
            <div className="absolute left-1 top-1 z-10 flex flex-col items-start gap-1">
              {book.isFavorite && (
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-rose-950/80 text-rose-400 backdrop-blur border border-rose-500/30 shadow-xs">
                  <Heart className="h-2.5 w-2.5 fill-rose-500 text-rose-500" />
                </span>
              )}
              {book.readingStatus === "finished" && (
                <span className="rounded-full bg-green-950/80 px-1.5 py-0.2 text-[8px] font-semibold text-green-400 backdrop-blur border border-green-500/30 shadow-xs">
                  Finished
                </span>
              )}
              {book.readingStatus === "currently-reading" && (
                <span className="rounded-full bg-blue-950/80 px-1.5 py-0.2 text-[8px] font-semibold text-blue-400 backdrop-blur border border-blue-500/30 shadow-xs">
                  Reading
                </span>
              )}
              {book.readingStatus === "wanna-read" && (
                <span className="rounded-full bg-yellow-950/80 px-1.5 py-0.2 text-[8px] font-semibold text-yellow-400 backdrop-blur border border-yellow-500/30 shadow-xs">
                  Wanna Read
                </span>
              )}
            </div>
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <h3 className="truncate text-sm font-semibold leading-snug">
              {book.title}
            </h3>
            {(settings?.showSubtitle ?? true) && book.subtitle && (
              <p className="truncate text-xs text-muted-foreground">
                {book.subtitle}
              </p>
            )}
            {(settings?.showAuthor ?? true) && (
              <p className="truncate text-xs text-muted-foreground">
                {book.author} · {book.fileType.toUpperCase()}
              </p>
            )}
            {(settings?.showRating ?? true) && (
              <div className="flex items-center gap-0.5 pt-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      "h-3 w-3",
                      i < book.rating
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-muted-foreground/40",
                    )}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-52 rounded-lg border-2 border-primary/80 bg-card/80 p-3 shadow-2xl backdrop-blur-md opacity-85 rotate-2 pointer-events-none select-none">
      <div className="flex flex-col gap-2.5">
        <div className="relative aspect-[2/3] w-full overflow-hidden rounded-md bg-neutral-900 shadow-sm">
          {coverUrl ? (
            <img
              src={coverUrl}
              alt={book.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center p-3 text-center">
              <span className="text-xs font-semibold line-clamp-3 text-white">
                {book.title}
              </span>
              <span className="mt-1 text-[10px] text-neutral-400">
                {book.fileType.toUpperCase()}
              </span>
            </div>
          )}

          {/* Status and Favorite Badges */}
          <div className="absolute left-2 top-2 z-10 flex flex-wrap items-center gap-1">
            {book.isFavorite && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-950/80 text-rose-400 backdrop-blur border border-rose-500/30 shadow-xs">
                <Heart className="h-3 w-3 fill-rose-500 text-rose-500" />
              </span>
            )}
            {book.readingStatus === "finished" && (
              <span className="rounded-full bg-green-950/80 px-2 py-0.5 text-[9px] font-semibold text-green-400 backdrop-blur border border-green-500/30 shadow-xs">
                Finished
              </span>
            )}
            {book.readingStatus === "currently-reading" && (
              <span className="rounded-full bg-blue-950/80 px-2 py-0.5 text-[9px] font-semibold text-blue-400 backdrop-blur border border-blue-500/30 shadow-xs">
                Reading
              </span>
            )}
            {book.readingStatus === "wanna-read" && (
              <span className="rounded-full bg-yellow-950/80 px-2 py-0.5 text-[9px] font-semibold text-yellow-400 backdrop-blur border border-yellow-500/30 shadow-xs">
                Wanna Read
              </span>
            )}
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-1">
          <h3 className="truncate text-sm font-semibold leading-snug">
            {book.title}
          </h3>
          {(settings?.showAuthor ?? true) && (
            <p className="truncate text-xs text-muted-foreground">
              {book.author} · {book.fileType.toUpperCase()}
            </p>
          )}
          {(settings?.showRating ?? true) && (
            <div className="flex items-center gap-0.5 pt-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={cn(
                    "h-3 w-3",
                    i < book.rating
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-muted-foreground/40",
                  )}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function AppShell() {
  const { data: settings } = useSettings();
  const { data: books = [] } = useBooks();
  const updateBook = useUpdateBook();
  const addToCollection = useAddBooksToCollection();
  const addToFolder = useAddBooksToFolder();
  const reorderGlobal = useReorderGlobal();

  const [activeBook, setActiveBook] = useState<Book | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 6,
      },
    }),
  );

  useEffect(() => {
    document.documentElement.classList.toggle(
      "dark",
      settings?.theme !== "light",
    );
  }, [settings?.theme]);

  const handleDragStart = (event: DragStartEvent) => {
    const id = event.active.id;
    if (typeof id === "number") {
      const found = books.find((b) => b.id === id);
      if (found) setActiveBook(found);
    }
  };

  const handleDragEnd = (e: DragEndEvent) => {
    setActiveBook(null);
    const { active, over } = e;
    if (!over) return;
    const activeId = active.id as number;
    const overId = String(over.id);
    if (activeId === (over.id as unknown)) return;

    // 1. Sidebar primary navigation drop targets
    if (overId === "sidebar-nav-favorites") {
      updateBook.mutate({ id: activeId, patch: { isFavorite: true } });
      return;
    }
    if (overId === "sidebar-nav-reading") {
      updateBook.mutate({ id: activeId, patch: { readingStatus: "currently-reading" } });
      return;
    }
    if (overId === "sidebar-nav-wanna-read") {
      updateBook.mutate({ id: activeId, patch: { readingStatus: "wanna-read" } });
      return;
    }
    if (overId === "sidebar-nav-finished") {
      updateBook.mutate({ id: activeId, patch: { readingStatus: "finished" } });
      return;
    }

    // 2. Sidebar collections drop targets
    if (overId.startsWith("sidebar-collection-")) {
      const colId = Number(overId.slice("sidebar-collection-".length));
      addToCollection.mutate({ bookIds: [activeId], collectionId: colId });
      return;
    }

    // 3. In-page folder drop targets
    if (overId.startsWith("folder-")) {
      const folderId = Number(overId.slice("folder-".length));
      addToFolder.mutate({ bookIds: [activeId], folderId });
      return;
    }

    // 4. Global book reordering
    if (typeof over.id === "number") {
      const list = books.map((b) => b.id!);
      const oldI = list.indexOf(activeId);
      const newI = list.indexOf(over.id as number);
      if (oldI !== -1 && newI !== -1) {
        reorderGlobal.mutate(arrayMove(list, oldI, newI));
      }
    }
  };

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex h-screen overflow-hidden bg-background text-foreground">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Header />
          <div className="px-6 pt-4">
            <BulkActionBar />
          </div>
          <main className="flex-1 overflow-y-auto p-6">
            <Outlet />
          </main>
        </div>
        <SettingsModal />
        <DragOverlay dropAnimation={null} modifiers={[snapCenterToCursor]}>
          {activeBook ? <DraggedBookOverlay book={activeBook} /> : null}
        </DragOverlay>
      </div>
    </DndContext>
  );
}
