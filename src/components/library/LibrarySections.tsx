import { useSearchParams } from "react-router-dom";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import {
  ArrowDownAZ,
  ArrowDownWideNarrow,
  ArrowLeft,
  ArrowUpDown,
  ArrowUpNarrowWide,
  Calendar,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  FolderPlus,
  GripVertical,
  Pin,
  Search,
  Settings2,
  Star,
  User,
  X,
} from "lucide-react";
import { usePinnedBooks, useScopeBooks, useSettings } from "@/db/hooks";
import { useUIStore } from "@/stores/uiStore";
import type { Book, Folder as FolderT } from "@/db/schema";
import { BookGrid } from "@/components/book/BookGrid";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  FolderIcon,
  FolderPillStrip,
  FolderSettingsDialog,
} from "@/components/folder/FolderPillStrip";
import { FolderCard } from "@/components/folder/FolderCard";

type SortField = "custom" | "dateAdded" | "title" | "author" | "rating";
type SortOrder = "asc" | "desc";

interface SortConfig {
  field: SortField;
  order: SortOrder;
}

function FolderSection({
  folder,
  books,
  scopeType: _scopeType,
  scopeId: _scopeId,
  onOpenFolderView,
}: {
  folder: FolderT;
  books: Book[];
  scopeType: string;
  scopeId: string;
  onOpenFolderView?: () => void;
}) {
  const isDragging = useUIStore((s) => s.isDragging);
  const { setNodeRef, isOver } = useDroppable({
    id: `folder-${folder.id}`,
    disabled: !isDragging,
  });
  const storageKey = `folder-collapsed-${folder.id}`;

  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(storageKey) === "true";
    } catch {
      return false;
    }
  });

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(storageKey, String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const { data: folderPinned = [] } = usePinnedBooks("folder", String(folder.id));
  const pinnedSet = useMemo(() => new Set(folderPinned.map((p) => p.bookId)), [folderPinned]);

  const { pinnedBooks, unpinnedBooks } = useMemo(() => {
    const pinnedMap = new Map(folderPinned.map((p) => [p.bookId, p.position]));
    const pinned: Book[] = [];
    const unpinned: Book[] = [];

    for (const b of books) {
      if (pinnedSet.has(b.id!)) {
        pinned.push(b);
      } else {
        unpinned.push(b);
      }
    }

    pinned.sort((a, b) => (pinnedMap.get(a.id!) ?? 0) - (pinnedMap.get(b.id!) ?? 0));
    return { pinnedBooks: pinned, unpinnedBooks: unpinned };
  }, [books, folderPinned, pinnedSet]);

  return (
    <section
      ref={setNodeRef}
      id={`folder-${folder.id}`}
      className={`flex scroll-mt-24 flex-col gap-3 rounded-xl border transition-all p-4 ${
        isOver
          ? "border-primary bg-primary/10 ring-2 ring-primary/30"
          : "border-border/70 bg-card/40 hover:border-border"
      }`}
    >
      <div
        className="flex items-center justify-between"
        onContextMenu={(e) => {
          if (onOpenFolderView) {
            e.preventDefault();
            onOpenFolderView();
          }
        }}
        title="Click to collapse/expand, right-click to open folder view"
      >
        <button
          type="button"
          onClick={toggleCollapsed}
          className="flex items-center gap-2.5 text-base font-semibold text-foreground hover:text-primary transition-colors cursor-pointer group select-none"
        >
          <span className="text-muted-foreground group-hover:text-primary transition-colors">
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </span>
          <FolderIcon name={folder.icon} className="h-5 w-5 text-primary" />
          <span>{folder.name}</span>
          <span className="text-xs font-normal text-muted-foreground tabular-nums">
            ({books.length} {books.length === 1 ? "book" : "books"})
          </span>
        </button>
      </div>

      {!collapsed && (
        <div className="pt-1 flex flex-col gap-4">
          {pinnedBooks.length > 0 && (
            <div className="flex flex-col gap-2.5 rounded-lg bg-amber-500/5 border border-amber-500/20 p-3">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-400">
                <Pin className="h-3.5 w-3.5 fill-amber-400" />
                <span>Pinned</span>
                <span className="text-[11px] font-normal text-muted-foreground tabular-nums">
                  ({pinnedBooks.length})
                </span>
              </div>
              <BookGrid
                books={pinnedBooks}
                scopeType="folder"
                scopeId={String(folder.id)}
                sortable={{
                  pinnedScope: { scopeType: "folder", scopeId: String(folder.id) },
                }}
              />
            </div>
          )}

          {unpinnedBooks.length > 0 ? (
            <BookGrid
              books={unpinnedBooks}
              scopeType="folder"
              scopeId={String(folder.id)}
              sortable={{ folderId: folder.id! }}
            />
          ) : pinnedBooks.length === 0 ? (
            <div
              className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed py-8 px-4 text-center transition-all ${
                isOver
                  ? "border-primary bg-primary/15 text-primary"
                  : "border-border/80 bg-background/30 text-muted-foreground"
              }`}
            >
              <FolderPlus className="h-8 w-8 mb-2 opacity-60" />
              <p className="text-sm font-medium">Empty folder</p>
              <p className="text-xs opacity-75 mt-0.5">
                Drag and drop book cards here to add them to "{folder.name}"
              </p>
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}

export function LibrarySections({
  title,
  baseBooks,
  scopeType,
  scopeId,
  emptyText,
}: {
  title?: string;
  baseBooks: Book[];
  scopeType: string;
  scopeId: string;
  emptyText: string;
}) {
  const { data: settings } = useSettings();
  const { data } = useScopeBooks(baseBooks, scopeType, scopeId);
  const storageKey = `lumina-hide-grouped-${scopeType}-${scopeId}`;
  const sortStorageKey = `lumina-sort-${scopeType}-${scopeId}`;

  const [searchParams, setSearchParams] = useSearchParams();
  const activeFolderIdStorageKey = `lumina-active-folder-${scopeType}-${scopeId}`;
  
  // Initialize from search param first, then sessionStorage
  const [activeFolderId, setActiveFolderId] = useState<number | null>(() => {
    const paramFolder = searchParams.get("folder");
    if (paramFolder && !Number.isNaN(Number(paramFolder))) {
      return Number(paramFolder);
    }
    try {
      const saved = sessionStorage.getItem(activeFolderIdStorageKey);
      return saved ? Number(saved) : null;
    } catch {
      return null;
    }
  });

  const [editingActiveFolder, setEditingActiveFolder] = useState(false);
  const setLastLibraryLocation = useUIStore((s) => s.setLastLibraryLocation);

  const handleOpenFolder = useCallback((folderId: number) => {
    setActiveFolderId(folderId);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set("folder", String(folderId));
        return next;
      },
      { replace: false },
    );
    try {
      sessionStorage.setItem(activeFolderIdStorageKey, String(folderId));
    } catch {
      // ignore
    }
  }, [activeFolderIdStorageKey, setSearchParams]);

  const handleCloseFolder = useCallback(() => {
    setActiveFolderId(null);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete("folder");
        return next;
      },
      { replace: true },
    );
    try {
      sessionStorage.removeItem(activeFolderIdStorageKey);
    } catch {
      // ignore
    }
  }, [activeFolderIdStorageKey, setSearchParams]);

  // Sync state if URL query param changes (e.g. popstate / browser back)
  useEffect(() => {
    const paramFolder = searchParams.get("folder");
    if (paramFolder && !Number.isNaN(Number(paramFolder))) {
      const fid = Number(paramFolder);
      setActiveFolderId(fid);
      try {
        sessionStorage.setItem(activeFolderIdStorageKey, String(fid));
      } catch {
        // ignore
      }
    } else if (!paramFolder) {
      // Check session storage fallback
      try {
        const saved = sessionStorage.getItem(activeFolderIdStorageKey);
        if (saved) {
          setActiveFolderId(Number(saved));
        } else {
          setActiveFolderId(null);
        }
      } catch {
        setActiveFolderId(null);
      }
    }
  }, [searchParams, activeFolderIdStorageKey]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const currentUrl = new URL(window.location.href);
      if (activeFolderId != null) {
        currentUrl.searchParams.set("folder", String(activeFolderId));
      }
      setLastLibraryLocation({
        pathname: currentUrl.pathname,
        search: currentUrl.search,
        folderId: activeFolderId,
      });
    }
  }, [scopeType, scopeId, activeFolderId, setLastLibraryLocation]);

  const [hideGrouped, setHideGrouped] = useState<boolean>(() => {
    try {
      return localStorage.getItem(storageKey) === "true";
    } catch {
      return false;
    }
  });

  const [sortConfig, setSortConfig] = useState<SortConfig>(() => {
    try {
      const saved = localStorage.getItem(sortStorageKey);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return { field: "custom", order: "desc" };
  });

  useEffect(() => {
    try {
      setHideGrouped(localStorage.getItem(storageKey) === "true");
    } catch {
      setHideGrouped(false);
    }
  }, [storageKey]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(sortStorageKey);
      if (saved) setSortConfig(JSON.parse(saved));
      else setSortConfig({ field: "custom", order: "desc" });
    } catch {
      setSortConfig({ field: "custom", order: "desc" });
    }
  }, [sortStorageKey]);

  const updateSort = (field: SortField, order?: SortOrder) => {
    setSortConfig((prev) => {
      let nextOrder = order;
      if (!nextOrder) {
        if (field === prev.field) {
          nextOrder = prev.order === "asc" ? "desc" : "asc";
        } else {
          nextOrder = field === "title" || field === "author" ? "asc" : "desc";
        }
      }
      const nextConfig: SortConfig = { field, order: nextOrder };
      try {
        localStorage.setItem(sortStorageKey, JSON.stringify(nextConfig));
      } catch {
        // ignore
      }
      return nextConfig;
    });
  };

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(activeFolderIdStorageKey);
      setActiveFolderId(saved ? Number(saved) : null);
    } catch {
      setActiveFolderId(null);
    }
  }, [activeFolderIdStorageKey]);

  const toggleHideGrouped = () => {
    setHideGrouped((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(storageKey, String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  if (!data) return null;
  const { folders, grouped, ungrouped, allBooks } = data;
  const rawDisplayedBooks = hideGrouped ? ungrouped : allBooks;

  const displayedBooks = useMemo(() => {
    if (sortConfig.field === "custom") {
      return rawDisplayedBooks;
    }
    const list = [...rawDisplayedBooks];
    const modifier = sortConfig.order === "asc" ? 1 : -1;

    return list.sort((a, b) => {
      if (sortConfig.field === "dateAdded") {
        return ((a.dateAdded ?? 0) - (b.dateAdded ?? 0)) * modifier;
      }
      if (sortConfig.field === "title") {
        return (a.title || "").localeCompare(b.title || "", undefined, { sensitivity: "base" }) * modifier;
      }
      if (sortConfig.field === "author") {
        return (a.author || "").localeCompare(b.author || "", undefined, { sensitivity: "base" }) * modifier;
      }
      if (sortConfig.field === "rating") {
        return ((a.rating ?? 0) - (b.rating ?? 0)) * modifier;
      }
      return 0;
    });
  }, [rawDisplayedBooks, sortConfig]);

  const { data: scopePinned = [] } = usePinnedBooks(scopeType, scopeId);
  const scopePinnedSet = useMemo(() => new Set(scopePinned.map((p) => p.bookId)), [scopePinned]);
  const scopePinnedMap = useMemo(() => new Map(scopePinned.map((p) => [p.bookId, p.position])), [scopePinned]);

  const { pinnedBooks, unpinnedBooks } = useMemo(() => {
    const pinned: Book[] = [];
    const unpinned: Book[] = [];

    for (const b of displayedBooks) {
      if (scopePinnedSet.has(b.id!)) {
        pinned.push(b);
      } else {
        unpinned.push(b);
      }
    }

    // Pinned books are always ordered by their custom pinned position
    pinned.sort((a, b) => (scopePinnedMap.get(a.id!) ?? 0) - (scopePinnedMap.get(b.id!) ?? 0));
    return { pinnedBooks: pinned, unpinnedBooks: unpinned };
  }, [displayedBooks, scopePinnedSet, scopePinnedMap]);

  const headerTitle = hideGrouped
    ? "Ungrouped Books"
    : title || "All Books";

  const isCardsMode = settings?.folderViewMode === "cards";
  const cols = settings?.booksPerRow ?? 4;

  const activeFolder =
    activeFolderId != null ? folders.find((f) => f.id === activeFolderId) : null;

  const setActiveFolderContext = useUIStore((s) => s.setActiveFolderContext);

  useEffect(() => {
    if (activeFolder) {
      setActiveFolderContext({
        folderId: activeFolder.id!,
        folderName: activeFolder.name,
        scopeType,
        scopeId,
      });
    } else {
      setActiveFolderContext(null);
    }
    return () => {
      setActiveFolderContext(null);
    };
  }, [activeFolder?.id, activeFolder?.name, scopeType, scopeId, setActiveFolderContext]);

  // Escape key to exit folder view back to main library
  useEffect(() => {
    if (activeFolderId == null) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        const target = e.target as HTMLElement | null;
        if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target?.isContentEditable) {
          return;
        }
        if (editingActiveFolder) {
          return; // Let dialog handle its own close
        }
        e.preventDefault();
        setActiveFolderId(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeFolderId, editingActiveFolder]);

  const searchQuery = useUIStore((s) => s.searchQuery).trim();
  const setSearchQuery = useUIStore((s) => s.setSearchQuery);
  const isSearching = searchQuery.length > 0;

  // Query pinned books for activeFolder unconditionally so hook count and order never change
  const { data: activeFolderPinned = [] } = usePinnedBooks("folder", String(activeFolderId ?? -1));

  // --- SEARCH RESULTS VIEW (CLEAN FLAT LIST WITHOUT FOLDER FRAGMENTATION) ---
  if (isSearching) {
    return (
      <div className="flex flex-col gap-6 select-text">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-border/70">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 text-primary border border-primary/20 shadow-xs">
              <Search className="h-4.5 w-4.5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">
                Search Results
              </h1>
              <p className="text-xs text-muted-foreground">
                {displayedBooks.length} {displayedBooks.length === 1 ? "book found" : "books found"} matching &ldquo;{searchQuery}&rdquo;
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Sort Pill */}
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "h-8 gap-1.5 px-2.5 text-xs font-medium transition-colors cursor-pointer",
                      sortConfig.field !== "custom"
                        ? "border-primary/40 bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary"
                        : "border-border text-muted-foreground hover:text-foreground hover:bg-accent",
                    )}
                    title="Sort search results"
                  >
                    <ArrowUpDown className="h-3.5 w-3.5" />
                    <span>
                      Sort:{" "}
                      {sortConfig.field === "custom"
                        ? "Default"
                        : sortConfig.field === "dateAdded"
                          ? "Date Added"
                          : sortConfig.field === "title"
                            ? "Title"
                            : sortConfig.field === "author"
                              ? "Author"
                              : "Rating"}
                    </span>
                    {sortConfig.field !== "custom" && (
                      <span className="text-[10px] uppercase font-bold tracking-wider opacity-80">
                        ({sortConfig.order})
                      </span>
                    )}
                  </Button>
                }
              />
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                  Sort By
                </DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() => updateSort("custom")}
                  className="flex items-center justify-between text-xs cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>Default Match</span>
                  </div>
                  {sortConfig.field === "custom" && (
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  )}
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => updateSort("title")}
                  className="flex items-center justify-between text-xs cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <ArrowDownAZ className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>Title</span>
                  </div>
                  {sortConfig.field === "title" && (
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  )}
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => updateSort("author")}
                  className="flex items-center justify-between text-xs cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>Author</span>
                  </div>
                  {sortConfig.field === "author" && (
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  )}
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => updateSort("dateAdded")}
                  className="flex items-center justify-between text-xs cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>Date Added</span>
                  </div>
                  {sortConfig.field === "dateAdded" && (
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  )}
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => updateSort("rating")}
                  className="flex items-center justify-between text-xs cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Star className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>Rating</span>
                  </div>
                  {sortConfig.field === "rating" && (
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  )}
                </DropdownMenuItem>

                {sortConfig.field !== "custom" && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                      Order Direction
                    </DropdownMenuLabel>
                    <DropdownMenuItem
                      onClick={() => updateSort(sortConfig.field, "asc")}
                      className="flex items-center justify-between text-xs cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <ArrowUpNarrowWide className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>Ascending (A → Z, Oldest, Low)</span>
                      </div>
                      {sortConfig.order === "asc" && (
                        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => updateSort(sortConfig.field, "desc")}
                      className="flex items-center justify-between text-xs cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <ArrowDownWideNarrow className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>Descending (Z → A, Newest, High)</span>
                      </div>
                      {sortConfig.order === "desc" && (
                        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                      )}
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Clear Search Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchQuery("")}
              className="h-8 gap-1 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
              <span>Clear Search</span>
            </Button>
          </div>
        </div>

        {/* Results Grid - Drag & Drop Disabled */}
        {displayedBooks.length > 0 ? (
          <BookGrid
            books={displayedBooks}
            scopeType={scopeType}
            scopeId={scopeId}
            sortable={undefined}
          />
        ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border/80 bg-card/30 py-16 px-4 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground mb-3 shadow-xs">
              <Search className="h-6 w-6" />
            </div>
            <h3 className="text-base font-semibold text-foreground">
              No books found
            </h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm">
              We couldn&apos;t find any books matching &ldquo;{searchQuery}&rdquo; in this view.
            </p>
            <div className="mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSearchQuery("")}
                className="gap-1.5 text-xs font-semibold cursor-pointer shadow-xs"
              >
                <X className="h-3.5 w-3.5" />
                <span>Reset Search</span>
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // --- FULL-PAGE FOLDER DRILL-DOWN VIEW ---
  if (activeFolder) {
    const activeBooks = grouped.get(activeFolder.id!) ?? [];
    const activePinnedSet = new Set(activeFolderPinned.map((p) => p.bookId));
    const activePinnedMap = new Map(activeFolderPinned.map((p) => [p.bookId, p.position]));

    const pinnedInFolder: Book[] = [];
    const unpinnedInFolder: Book[] = [];

    for (const b of activeBooks) {
      if (activePinnedSet.has(b.id!)) {
        pinnedInFolder.push(b);
      } else {
        unpinnedInFolder.push(b);
      }
    }

    pinnedInFolder.sort((a, b) => (activePinnedMap.get(a.id!) ?? 0) - (activePinnedMap.get(b.id!) ?? 0));

    return (
      <div className="flex flex-col gap-6">
        {/* Top Navigation Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-border/70">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCloseFolder}
              className="h-8 gap-1.5 text-xs font-medium cursor-pointer shadow-xs"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to {title || "All Books"}</span>
            </Button>

            <div className="h-4 w-px bg-border/80" />

            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/15 text-primary border border-primary/20">
                <FolderIcon name={activeFolder.icon} className="h-4 w-4" />
              </span>
              <h1 className="text-xl font-bold text-foreground">
                {activeFolder.name}
              </h1>
              <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-semibold text-muted-foreground tabular-nums">
                {activeBooks.length} {activeBooks.length === 1 ? "book" : "books"}
              </span>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setEditingActiveFolder(true)}
            className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
            title="Edit Folder Settings"
          >
            <Settings2 className="h-3.5 w-3.5" />
            <span>Folder Settings</span>
          </Button>
        </div>

        {/* Pinned Books in Folder */}
        {pinnedInFolder.length > 0 && (
          <section className="flex flex-col gap-3 rounded-xl bg-amber-500/5 border border-amber-500/20 p-4">
            <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-amber-400">
              <Pin className="h-4 w-4 fill-amber-400" />
              <span>Pinned in Folder</span>
              <span className="text-xs font-normal text-muted-foreground tabular-nums">
                ({pinnedInFolder.length})
              </span>
            </div>
            <BookGrid
              books={pinnedInFolder}
              scopeType="folder"
              scopeId={String(activeFolder.id)}
              sortable={{
                pinnedScope: { scopeType: "folder", scopeId: String(activeFolder.id) },
              }}
            />
          </section>
        )}

        {/* Unpinned Folder Books Grid */}
        {unpinnedInFolder.length > 0 ? (
          <BookGrid
            books={unpinnedInFolder}
            scopeType="folder"
            scopeId={String(activeFolder.id)}
            sortable={{ folderId: activeFolder.id! }}
          />
        ) : pinnedInFolder.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border/80 bg-background/30 py-16 px-4 text-center text-muted-foreground">
            <FolderPlus className="h-10 w-10 mb-2.5 opacity-50 text-primary" />
            <p className="text-sm font-semibold text-foreground">
              This folder is empty
            </p>
            <p className="text-xs opacity-75 mt-1 max-w-xs">
              Right-click books in your library or drag and drop them onto this folder to add them.
            </p>
          </div>
        ) : null}

        {editingActiveFolder && (
          <FolderSettingsDialog
            folder={activeFolder}
            onClose={() => setEditingActiveFolder(false)}
          />
        )}
      </div>
    );
  }

  // --- NORMAL LIBRARY SECTIONS VIEW ---
  return (
    <div className="flex flex-col gap-8">
      <FolderPillStrip
        scopeType={scopeType}
        scopeId={scopeId}
        onFolderClick={isCardsMode ? (folder) => handleOpenFolder(folder.id!) : undefined}
      />

      {/* DEDICATED PINNED SECTION (FOR CURRENT VIEW / SCOPE) */}
      {pinnedBooks.length > 0 && (
        <section className="flex flex-col gap-3 rounded-xl bg-amber-500/5 border border-amber-500/20 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-amber-500/15 text-amber-400">
                <Pin className="h-3.5 w-3.5 fill-amber-400" />
              </div>
              <h2 className="text-base font-bold uppercase tracking-wider text-amber-400">
                Pinned Books
              </h2>
              <span className="text-xs text-muted-foreground font-normal tabular-nums">
                ({pinnedBooks.length})
              </span>
            </div>
          </div>
          <BookGrid
            books={pinnedBooks}
            scopeType={scopeType}
            scopeId={scopeId}
            sortable={{
              pinnedScope: { scopeType, scopeId },
            }}
          />
        </section>
      )}

      {/* FOLDERS GRID (When in Cards Mode) */}
      {isCardsMode && folders.length > 0 && (
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">Folders</h2>
              <span className="text-xs text-muted-foreground font-normal tabular-nums">
                ({folders.length})
              </span>
            </div>
          </div>
          <div
            className="grid gap-4"
            style={{
              gridTemplateColumns:
                settings?.viewMode === "row"
                  ? `repeat(auto-fill, minmax(min(100%, max(260px, calc(100% / ${cols} - 1rem))), 1fr))`
                  : `repeat(${cols}, minmax(0, 1fr))`,
            }}
          >
            {folders.map((f) => (
              <FolderCard
                key={f.id}
                folder={f}
                books={grouped.get(f.id!) ?? []}
                onOpen={handleOpenFolder}
              />
            ))}
          </div>
        </section>
      )}

      {/* FLAT LIST BOOKS */}
      {(unpinnedBooks.length > 0 || hideGrouped) && baseBooks.length > 0 && (
        <section className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">{headerTitle}</h2>
              <span className="text-xs text-muted-foreground font-normal tabular-nums">
                ({unpinnedBooks.length})
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* SORT PILL DROPDOWN */}
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      variant="outline"
                      size="sm"
                      className={cn(
                        "h-7 gap-1.5 px-2.5 text-xs font-medium transition-colors cursor-pointer",
                        sortConfig.field !== "custom"
                          ? "border-primary/40 bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary"
                          : "border-border text-muted-foreground hover:text-foreground hover:bg-accent",
                      )}
                      title="Sort books"
                    >
                      <ArrowUpDown className="h-3.5 w-3.5" />
                      <span>
                        Sort:{" "}
                        {sortConfig.field === "custom"
                          ? "Custom"
                          : sortConfig.field === "dateAdded"
                            ? "Date Added"
                            : sortConfig.field === "title"
                              ? "Title"
                              : sortConfig.field === "author"
                                ? "Author"
                                : "Rating"}
                      </span>
                      {sortConfig.field !== "custom" && (
                        <span className="text-[10px] uppercase font-bold tracking-wider opacity-80">
                          ({sortConfig.order})
                        </span>
                      )}
                    </Button>
                  }
                />
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                    Sort By
                  </DropdownMenuLabel>
                  <DropdownMenuItem
                    onClick={() => updateSort("custom")}
                    className="flex items-center justify-between text-xs cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>Custom Order</span>
                    </div>
                    {sortConfig.field === "custom" && (
                      <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    )}
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={() => updateSort("dateAdded")}
                    className="flex items-center justify-between text-xs cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>Date Added</span>
                    </div>
                    {sortConfig.field === "dateAdded" && (
                      <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    )}
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={() => updateSort("title")}
                    className="flex items-center justify-between text-xs cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <ArrowDownAZ className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>Title</span>
                    </div>
                    {sortConfig.field === "title" && (
                      <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    )}
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={() => updateSort("author")}
                    className="flex items-center justify-between text-xs cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <User className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>Author</span>
                    </div>
                    {sortConfig.field === "author" && (
                      <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    )}
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={() => updateSort("rating")}
                    className="flex items-center justify-between text-xs cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Star className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>Rating</span>
                    </div>
                    {sortConfig.field === "rating" && (
                      <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    )}
                  </DropdownMenuItem>

                  {sortConfig.field !== "custom" && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                        Order Direction
                      </DropdownMenuLabel>
                      <DropdownMenuItem
                        onClick={() => updateSort(sortConfig.field, "asc")}
                        className="flex items-center justify-between text-xs cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <ArrowUpNarrowWide className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>Ascending (A → Z, Oldest, Low)</span>
                        </div>
                        {sortConfig.order === "asc" && (
                          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => updateSort(sortConfig.field, "desc")}
                        className="flex items-center justify-between text-xs cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <ArrowDownWideNarrow className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>Descending (Z → A, Newest, High)</span>
                        </div>
                        {sortConfig.order === "desc" && (
                          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                        )}
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* HIDE GROUPED TOGGLE */}
              {folders.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleHideGrouped}
                  className={cn(
                    "h-7 gap-1.5 px-2.5 text-xs font-medium transition-colors cursor-pointer",
                    hideGrouped
                      ? "border-primary/40 bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary"
                      : "border-border text-muted-foreground hover:text-foreground hover:bg-accent",
                  )}
                  title={
                    hideGrouped
                      ? "Showing ungrouped books. Click to show all books."
                      : "Showing all books. Click to hide books in folders."
                  }
                >
                  {hideGrouped ? (
                    <EyeOff className="h-3.5 w-3.5 text-primary" />
                  ) : (
                    <Eye className="h-3.5 w-3.5" />
                  )}
                  <span>Hide Grouped</span>
                </Button>
              )}
            </div>
          </div>

          {unpinnedBooks.length > 0 ? (
            <BookGrid
              books={unpinnedBooks}
              scopeType={scopeType}
              scopeId={scopeId}
              sortable={sortConfig.field === "custom" ? "global" : undefined}
            />
          ) : (
            <div className="rounded-lg border border-dashed border-border/70 py-6 text-center text-xs text-muted-foreground">
              {pinnedBooks.length > 0
                ? "All remaining books in this view are pinned to the top or in folders."
                : "All books in this view are organized into folders."}
            </div>
          )}
        </section>
      )}

      {baseBooks.length === 0 && (
        <p className="text-sm text-muted-foreground">{emptyText}</p>
      )}

      {/* FOLDER SECTIONS (When in Sections Mode) */}
      {!isCardsMode &&
        folders.map((f) => (
          <FolderSection
            key={f.id}
            folder={f}
            books={grouped.get(f.id!) ?? []}
            scopeType={scopeType}
            scopeId={scopeId}
            onOpenFolderView={() => setActiveFolderId(f.id!)}
          />
        ))}
    </div>
  );
}
