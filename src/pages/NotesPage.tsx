import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  Filter,
  Layers,
  Plus,
  Search,
  StickyNote,
  X,
} from "lucide-react";
import { useAllNotes, useBooks, useAddNote, useUpdateNote, useDeleteNote } from "@/db/hooks";
import type { Note } from "@/db/schema";
import { NoteCard } from "@/components/reader/notes/NoteCard";
import { NoteModal } from "@/components/reader/notes/NoteModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type NoteFilterBook = "all" | "standalone" | number;

export function NotesPage() {
  const navigate = useNavigate();
  const { data: notes = [], isLoading: notesLoading } = useAllNotes();
  const { data: books = [] } = useBooks();
  const addNote = useAddNote();
  const updateNote = useUpdateNote();
  const deleteNote = useDeleteNote();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBookFilter, setSelectedBookFilter] = useState<NoteFilterBook>("all");
  const [activeNote, setActiveNote] = useState<Note | null>(null);

  // Books map for instant title lookup
  const booksMap = useMemo(() => {
    const map = new Map<number, { title: string; fileType: "pdf" | "epub" }>();
    for (const b of books) {
      if (b.id) {
        map.set(b.id, { title: b.title, fileType: b.fileType });
      }
    }
    return map;
  }, [books]);

  // Filtered notes list
  const filteredNotes = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return notes.filter((n) => {
      // 1. Book Filter
      if (selectedBookFilter === "standalone" && n.bookId != null) {
        return false;
      }
      if (typeof selectedBookFilter === "number" && n.bookId !== selectedBookFilter) {
        return false;
      }

      // 2. Search Query
      if (!q) return true;
      const titleMatch = (n.title || "").toLowerCase().includes(q);
      const contentMatch = (n.content || "").toLowerCase().includes(q);
      const bookTitle = n.bookId ? booksMap.get(n.bookId)?.title.toLowerCase() : "";
      const bookMatch = bookTitle ? bookTitle.includes(q) : false;

      return titleMatch || contentMatch || bookMatch;
    });
  }, [notes, searchQuery, selectedBookFilter, booksMap]);

  // Books that have at least one note (for quick filter badges)
  const booksWithNotes = useMemo(() => {
    const countMap = new Map<number, number>();
    let standaloneCount = 0;

    for (const n of notes) {
      if (n.bookId == null) {
        standaloneCount++;
      } else {
        countMap.set(n.bookId, (countMap.get(n.bookId) || 0) + 1);
      }
    }

    const list: { id: number; title: string; count: number }[] = [];
    countMap.forEach((count, id) => {
      const book = booksMap.get(id);
      if (book) {
        list.push({ id, title: book.title, count });
      }
    });

    return { list, standaloneCount };
  }, [notes, booksMap]);

  const handleCreateNewNote = async (targetBookId?: number) => {
    const newId = await addNote.mutateAsync({
      bookId: targetBookId,
      title: "Untitled Note",
      icon: "💡",
      content: "",
    });

    if (newId) {
      setActiveNote({
        id: Number(newId),
        bookId: targetBookId,
        title: "Untitled Note",
        icon: "💡",
        content: "",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
  };

  const selectedBookLabel =
    selectedBookFilter === "all"
      ? "All Notes"
      : selectedBookFilter === "standalone"
        ? "General Notes (No Book)"
        : booksMap.get(selectedBookFilter)?.title || "Filtered Book";

  return (
    <div className="flex flex-col gap-6 select-text">
      {/* Top Header & Action Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-border/70">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/20 shadow-xs">
            <StickyNote className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              Notes & Knowledge
            </h1>
            <p className="text-xs text-muted-foreground">
              {notes.length} {notes.length === 1 ? "note" : "notes"} across your library and reading sessions
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* New Note Button with Book Association dropdown */}
          {books.length > 0 ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    size="sm"
                    className="gap-1.5 font-semibold shadow-xs cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                    <span>New Note</span>
                  </Button>
                }
              />
              <DropdownMenuContent align="end" className="w-56 p-1">
                <DropdownMenuLabel className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Create Note
                </DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() => handleCreateNewNote(undefined)}
                  className="cursor-pointer text-xs font-medium"
                >
                  <StickyNote className="h-3.5 w-3.5 text-amber-400" />
                  <span>General Quick Note</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Link to a Book
                </DropdownMenuLabel>
                <div className="max-h-48 overflow-y-auto">
                  {books.map((b) => (
                    <DropdownMenuItem
                      key={b.id}
                      onClick={() => handleCreateNewNote(b.id)}
                      className="cursor-pointer text-xs truncate"
                    >
                      <BookOpen className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span className="truncate">{b.title}</span>
                    </DropdownMenuItem>
                  ))}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              size="sm"
              onClick={() => handleCreateNewNote(undefined)}
              className="gap-1.5 font-semibold shadow-xs cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>New Note</span>
            </Button>
          )}
        </div>
      </div>

      {/* Filter Bar & Search */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search note titles, content, or book names..."
            className="h-9 pl-9 pr-8 text-xs bg-card/60"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer p-0.5 rounded"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Filter Dropdown */}
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "h-9 gap-1.5 px-3 text-xs font-medium cursor-pointer",
                    selectedBookFilter !== "all"
                      ? "border-primary/40 bg-primary/10 text-primary hover:bg-primary/20"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Filter className="h-3.5 w-3.5" />
                  <span className="max-w-[180px] truncate">{selectedBookLabel}</span>
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-60 p-1">
              <DropdownMenuLabel className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Filter by Source
              </DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => setSelectedBookFilter("all")}
                className="cursor-pointer text-xs justify-between"
              >
                <div className="flex items-center gap-2">
                  <Layers className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>All Notes</span>
                </div>
                <span className="text-[10px] text-muted-foreground tabular-nums">{notes.length}</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setSelectedBookFilter("standalone")}
                className="cursor-pointer text-xs justify-between"
              >
                <div className="flex items-center gap-2">
                  <StickyNote className="h-3.5 w-3.5 text-amber-400" />
                  <span>General (No Book)</span>
                </div>
                <span className="text-[10px] text-muted-foreground tabular-nums">
                  {booksWithNotes.standaloneCount}
                </span>
              </DropdownMenuItem>

              {booksWithNotes.list.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Books with Notes
                  </DropdownMenuLabel>
                  <div className="max-h-52 overflow-y-auto">
                    {booksWithNotes.list.map((b) => (
                      <DropdownMenuItem
                        key={b.id}
                        onClick={() => setSelectedBookFilter(b.id)}
                        className="cursor-pointer text-xs justify-between truncate"
                      >
                        <div className="flex items-center gap-2 truncate pr-2">
                          <BookOpen className="h-3.5 w-3.5 text-primary shrink-0" />
                          <span className="truncate">{b.title}</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground tabular-nums shrink-0">
                          {b.count}
                        </span>
                      </DropdownMenuItem>
                    ))}
                  </div>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Note Grid */}
      {notesLoading ? (
        <div className="flex h-48 items-center justify-center text-xs text-muted-foreground animate-pulse">
          Loading notes...
        </div>
      ) : filteredNotes.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
          {filteredNotes.map((n) => {
            const linkedBook = n.bookId ? booksMap.get(n.bookId) : undefined;
            return (
              <NoteCard
                key={n.id}
                note={n}
                onClick={() => setActiveNote(n)}
                onDelete={(id) => deleteNote.mutate({ id, bookId: n.bookId })}
                bookFileType={linkedBook?.fileType ?? "pdf"}
                bookTitle={linkedBook?.title}
              />
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border/80 bg-card/30 py-16 px-4 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400 mb-3 border border-amber-500/20 shadow-xs">
            <StickyNote className="h-6 w-6" />
          </div>
          <h3 className="text-base font-semibold text-foreground">
            {searchQuery || selectedBookFilter !== "all"
              ? "No notes match your filters"
              : "No notes yet"}
          </h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm">
            {searchQuery || selectedBookFilter !== "all"
              ? "Try clearing your search query or selecting a different book filter."
              : "Create notes while reading in the reader sidebar or click 'New Note' to start writing knowledge cards."}
          </p>
          <div className="mt-4">
            <Button
              size="sm"
              onClick={() => handleCreateNewNote(typeof selectedBookFilter === "number" ? selectedBookFilter : undefined)}
              className="gap-1.5 font-semibold cursor-pointer shadow-xs"
            >
              <Plus className="h-4 w-4" />
              <span>Create First Note</span>
            </Button>
          </div>
        </div>
      )}

      {/* Note Edit Modal */}
      {activeNote && (
        <NoteModal
          note={activeNote}
          isOpen={true}
          onClose={() => setActiveNote(null)}
          onSave={({ title, icon, content }) => {
            if (activeNote.id) {
              updateNote.mutate({
                id: activeNote.id,
                bookId: activeNote.bookId,
                patch: { title, icon, content },
              });
              setActiveNote((prev) => (prev ? { ...prev, title, icon, content } : null));
            }
          }}
          onDelete={(id) => {
            deleteNote.mutate({ id, bookId: activeNote.bookId });
            setActiveNote(null);
          }}
          onJumpToLocation={(_loc) => {
            if (activeNote.bookId) {
              navigate(`/reader/${activeNote.bookId}`);
            }
          }}
          bookFileType={activeNote.bookId ? booksMap.get(activeNote.bookId)?.fileType : "pdf"}
          bookTitle={activeNote.bookId ? booksMap.get(activeNote.bookId)?.title : undefined}
        />
      )}
    </div>
  );
}
