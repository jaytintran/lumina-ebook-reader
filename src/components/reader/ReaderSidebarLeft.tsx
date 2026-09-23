import { useState } from "react";
import {
  Bookmark as BookmarkIcon,
  Check,
  Edit2,
  List,
  Plus,
  RotateCcw,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { Bookmark, CustomTocItem } from "@/db/schema";
import type { ParsedEpubContent } from "@/lib/importer";
import type { LeftTab, PdfOutlineItem, UnifiedTocItem } from "./types";

interface ReaderSidebarLeftProps {
  leftTab: LeftTab;
  onTabChange: (tab: LeftTab) => void;
  book: { fileType: "pdf" | "epub" };
  pdfOutline: PdfOutlineItem[];
  pdfNumPages: number;
  pdfCurrentPage: number;
  onPdfOutlineClick: (pageNumber: number) => void;
  epubDoc: ParsedEpubContent | null;
  epubSectionIdx: number;
  onEpubTocClick: (tocHref: string) => void;
  bookmarks: Bookmark[];
  onAddBookmark: () => void;
  onUpdateBookmark: (id: number, title: string) => void;
  onDeleteBookmark: (id: number) => void;
  onBookmarkClick: (pageOrLocation: number | string) => void;
  customToc: CustomTocItem[];
  onAddTocItem: (item: Omit<CustomTocItem, "id">) => void;
  onUpdateTocItem: (id: number, patch: Partial<Omit<CustomTocItem, "id" | "bookId">>) => void;
  onDeleteTocItem: (id: number) => void;
  onSaveCustomToc: (items: Array<Omit<CustomTocItem, "id"> | CustomTocItem>) => void;
  onResetToc: () => void;
  onClose?: () => void;
}

export function ReaderSidebarLeft({
  leftTab,
  onTabChange,
  book,
  pdfOutline,
  pdfNumPages,
  pdfCurrentPage,
  onPdfOutlineClick,
  epubDoc,
  epubSectionIdx,
  onEpubTocClick,
  bookmarks,
  onAddBookmark,
  onUpdateBookmark,
  onDeleteBookmark,
  onBookmarkClick,
  customToc,
  onAddTocItem,
  onUpdateTocItem,
  onDeleteTocItem,
  onSaveCustomToc,
  onResetToc,
  onClose,
}: ReaderSidebarLeftProps) {
  // Bookmark inline editing state
  const [editingBmId, setEditingBmId] = useState<number | null>(null);
  const [editingBmTitle, setEditingBmTitle] = useState("");

  // TOC Item Modal State (for Adding or Editing)
  const [tocModalOpen, setTocModalOpen] = useState(false);
  const [editingTocItem, setEditingTocItem] = useState<{
    id?: number;
    title: string;
    pageOrLocation: number | string;
    depth: number;
    isNew?: boolean;
    seedBeforeSave?: boolean;
    originalIndex?: number;
  } | null>(null);

  const startEditBookmark = (bm: Bookmark) => {
    setEditingBmId(bm.id!);
    setEditingBmTitle(bm.title);
  };

  const saveBookmarkTitle = (id: number) => {
    if (editingBmTitle.trim()) {
      onUpdateBookmark(id, editingBmTitle.trim());
    }
    setEditingBmId(null);
  };

  // Convert raw intrinsic outline to UnifiedTocItem[] if no custom TOC exists
  const isCustom = customToc.length > 0;
  const displayTocItems: UnifiedTocItem[] = isCustom
    ? customToc.map((it) => ({
        id: it.id,
        title: it.title,
        pageOrLocation: it.pageOrLocation,
        depth: it.depth,
        isCustom: true,
      }))
    : book.fileType === "pdf"
      ? pdfOutline.map((item, idx) => ({
          id: `orig-pdf-${idx}`,
          title: item.title,
          pageOrLocation: item.pageNumber,
          depth: item.depth || 0,
          isCustom: false,
        }))
      : (epubDoc?.toc || []).map((t, idx) => ({
          id: t.id || `orig-epub-${idx}`,
          title: t.label,
          pageOrLocation: t.href,
          depth: t.depth || 0,
          isCustom: false,
        }));

  // Helper to seed original outline into customToc array before editing/deleting
  const getSeedList = (): Array<Omit<CustomTocItem, "id">> => {
    if (isCustom) return customToc;
    if (book.fileType === "pdf") {
      return pdfOutline.map((item, idx) => ({
        bookId: 0,
        title: item.title,
        pageOrLocation: item.pageNumber,
        depth: item.depth || 0,
        order: idx,
      }));
    }
    return (epubDoc?.toc || []).map((t, idx) => ({
      bookId: 0,
      title: t.label,
      pageOrLocation: t.href,
      depth: t.depth || 0,
      order: idx,
    }));
  };

  const handleOpenAddTocModal = () => {
    const defaultLocation =
      book.fileType === "pdf" ? pdfCurrentPage : `${epubSectionIdx + 1}`;
    setEditingTocItem({
      title: `Chapter ${displayTocItems.length + 1}`,
      pageOrLocation: defaultLocation,
      depth: 0,
      isNew: true,
      seedBeforeSave: !isCustom,
    });
    setTocModalOpen(true);
  };

  const handleOpenEditTocModal = (item: UnifiedTocItem, idx: number) => {
    setEditingTocItem({
      id: typeof item.id === "number" ? item.id : undefined,
      title: item.title,
      pageOrLocation: item.pageOrLocation,
      depth: item.depth,
      isNew: false,
      seedBeforeSave: !isCustom,
      originalIndex: idx,
    });
    setTocModalOpen(true);
  };

  const handleDeleteToc = (item: UnifiedTocItem, idx: number) => {
    if (isCustom && typeof item.id === "number") {
      onDeleteTocItem(item.id);
    } else {
      // Seed original list and remove the selected item
      const seed = getSeedList();
      const next = seed.filter((_, i) => i !== idx);
      onSaveCustomToc(next);
    }
  };

  const handleSaveTocModal = () => {
    if (!editingTocItem || !editingTocItem.title.trim()) return;
    const title = editingTocItem.title.trim();
    const pageOrLocation =
      book.fileType === "pdf"
        ? Math.max(1, Number(editingTocItem.pageOrLocation) || 1)
        : String(editingTocItem.pageOrLocation || "1");
    const depth = editingTocItem.depth || 0;

    if (editingTocItem.isNew) {
      if (editingTocItem.seedBeforeSave) {
        const seed = getSeedList();
        seed.push({
          bookId: 0,
          title,
          pageOrLocation,
          depth,
          order: seed.length,
        });
        onSaveCustomToc(seed);
      } else {
        onAddTocItem({
          bookId: 0,
          title,
          pageOrLocation,
          depth,
          order: customToc.length,
        });
      }
    } else {
      // Edit existing
      if (editingTocItem.id != null) {
        onUpdateTocItem(editingTocItem.id, {
          title,
          pageOrLocation,
          depth,
        });
      } else {
        // Seed original outline and update the item at originalIndex
        const seed = getSeedList();
        if (editingTocItem.originalIndex != null && seed[editingTocItem.originalIndex]) {
          seed[editingTocItem.originalIndex] = {
            ...seed[editingTocItem.originalIndex],
            title,
            pageOrLocation,
            depth,
          };
          onSaveCustomToc(seed);
        }
      }
    }

    setTocModalOpen(false);
    setEditingTocItem(null);
  };

  const handleTocClick = (item: UnifiedTocItem) => {
    if (book.fileType === "pdf") {
      onPdfOutlineClick(Number(item.pageOrLocation) || 1);
    } else {
      const locStr = String(item.pageOrLocation);
      if (locStr.includes("#") || locStr.includes(".xhtml") || locStr.includes(".html")) {
        onEpubTocClick(locStr);
      } else {
        const secNum = Number(locStr);
        if (!Number.isNaN(secNum) && epubDoc?.sections[secNum - 1]) {
          onEpubTocClick(epubDoc.sections[secNum - 1].href);
        } else {
          onEpubTocClick(locStr);
        }
      }
    }
  };

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-40 w-80 max-w-[85vw] md:static md:w-76 shrink-0 border-r border-border bg-card shadow-2xl md:shadow-none flex flex-col animate-in slide-in-from-left duration-200">
        {/* Left Tabs */}
        <div className="flex h-10 border-b border-border bg-background/50 items-stretch">
          <button
            onClick={() => onTabChange("toc")}
            className={cn(
              "flex-1 h-full rounded-none text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer border-r border-border/50",
              leftTab === "toc"
                ? "bg-primary text-primary-foreground font-bold"
                : "text-muted-foreground hover:text-foreground hover:bg-accent/40"
            )}
          >
            <List className="h-3.5 w-3.5" /> Contents
          </button>
          <button
            onClick={() => onTabChange("bookmarks")}
            className={cn(
              "flex-1 h-full rounded-none text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer",
              leftTab === "bookmarks"
                ? "bg-primary text-primary-foreground font-bold"
                : "text-muted-foreground hover:text-foreground hover:bg-accent/40"
            )}
          >
            <BookmarkIcon className="h-3.5 w-3.5" /> Bookmarks ({bookmarks.length})
          </button>
          {onClose && (
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={onClose}
              className="md:hidden h-full rounded-none px-2.5 border-l border-border/50 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Left Tab Content */}
        <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
          {/* --- TABLE OF CONTENTS TAB --- */}
          {leftTab === "toc" && (
            <div className="flex flex-col gap-3">
              {/* Header Actions: Add Item & Reset */}
              <div className="flex items-center justify-between gap-1.5 pb-1 border-b border-border/40">
                <div className="flex items-center gap-1.5">
                  <span
                    className={cn(
                      "text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded",
                      isCustom
                        ? "bg-amber-500/15 text-amber-400 border border-amber-500/20"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {isCustom ? "Custom TOC" : "Original Outline"}
                  </span>
                  <span className="text-[11px] text-muted-foreground font-medium">
                    ({displayTocItems.length})
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  {isCustom && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 px-1.5 text-[11px] gap-1 text-muted-foreground hover:text-destructive"
                      onClick={onResetToc}
                      title="Reset back to original document table of contents"
                    >
                      <RotateCcw className="h-3 w-3" />
                      <span>Reset</span>
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-6 px-2 text-[11px] gap-1 border-dashed font-medium"
                    onClick={handleOpenAddTocModal}
                  >
                    <Plus className="h-3 w-3" />
                    <span>Add Item</span>
                  </Button>
                </div>
              </div>

              {/* TOC Items List */}
              <div className="flex flex-col gap-1">
                {displayTocItems.length > 0 ? (
                  displayTocItems.map((item, idx) => {
                    const isPdfActive =
                      book.fileType === "pdf" && pdfCurrentPage === Number(item.pageOrLocation);
                    const isEpubActive =
                      book.fileType === "epub" &&
                      (String(item.pageOrLocation) === String(epubSectionIdx + 1) ||
                        (epubDoc?.sections[epubSectionIdx] &&
                          String(item.pageOrLocation).includes(epubDoc.sections[epubSectionIdx].href)));

                    const isActive = isPdfActive || isEpubActive;

                    return (
                      <div
                        key={item.id || idx}
                        style={{ paddingLeft: `${Math.max(6, (item.depth || 0) * 14 + 6)}px` }}
                        className={cn(
                          "group relative flex items-center justify-between rounded-lg py-1.5 pr-1.5 transition-all text-xs",
                          isActive
                            ? "bg-primary/20 text-primary font-bold shadow-xs"
                            : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                        )}
                      >
                        <button
                          type="button"
                          onClick={() => handleTocClick(item)}
                          className="flex-1 flex items-center justify-between text-left truncate cursor-pointer pr-1"
                        >
                          <span className="truncate">{item.title}</span>
                          {book.fileType === "pdf" && (
                            <span className="text-[10px] opacity-70 ml-1 shrink-0 font-normal">
                              p.{item.pageOrLocation}
                            </span>
                          )}
                        </button>

                        {/* Edit & Delete Action Buttons */}
                        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 shrink-0 transition-opacity bg-card/90 rounded px-1 shadow-xs border border-border/40">
                          <button
                            type="button"
                            onClick={() => handleOpenEditTocModal(item, idx)}
                            className="p-1 text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                            title="Edit Chapter / Section"
                          >
                            <Edit2 className="h-3 w-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteToc(item, idx)}
                            className="p-1 text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                            title="Delete from TOC"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center p-6 text-center rounded-lg border border-dashed border-border/70 bg-card/20">
                    <p className="text-xs text-muted-foreground mb-2">No table of contents in this document.</p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs gap-1.5 font-medium"
                      onClick={handleOpenAddTocModal}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add First Chapter
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* --- BOOKMARKS TAB --- */}
          {leftTab === "bookmarks" && (
            <div className="flex flex-col gap-3">
              <Button
                size="sm"
                variant="outline"
                className="w-full text-xs gap-1.5 border-dashed"
                onClick={onAddBookmark}
              >
                <Plus className="h-3.5 w-3.5" />
                Bookmark current {book.fileType === "pdf" ? `Page ${pdfCurrentPage}` : `Section ${epubSectionIdx + 1}`}
              </Button>

              <div className="flex flex-col gap-1.5">
                {bookmarks.map((bm) => {
                  const isEditing = editingBmId === bm.id;

                  return (
                    <div
                      key={bm.id}
                      className="group flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2 text-xs transition-colors hover:border-primary/50"
                    >
                      {isEditing ? (
                        <div className="flex items-center gap-1.5 w-full">
                          <Input
                            autoFocus
                            value={editingBmTitle}
                            onChange={(e) => setEditingBmTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") saveBookmarkTitle(bm.id!);
                              if (e.key === "Escape") setEditingBmId(null);
                            }}
                            className="h-7 text-xs flex-1"
                          />
                          <Button
                            size="icon-xs"
                            variant="default"
                            className="h-7 w-7 shrink-0 cursor-pointer"
                            onClick={() => saveBookmarkTitle(bm.id!)}
                            title="Save name"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="icon-xs"
                            variant="ghost"
                            className="h-7 w-7 shrink-0 text-muted-foreground cursor-pointer"
                            onClick={() => setEditingBmId(null)}
                            title="Cancel"
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => onBookmarkClick(bm.pageOrLocation)}
                            className="flex-1 text-left truncate font-medium text-foreground hover:text-primary cursor-pointer pr-2"
                          >
                            {bm.title}
                          </button>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              type="button"
                              onClick={() => startEditBookmark(bm)}
                              className="text-muted-foreground hover:text-primary p-0.5 cursor-pointer transition-colors"
                              title="Rename bookmark"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => bm.id && onDeleteBookmark(bm.id)}
                              className="text-muted-foreground hover:text-destructive p-0.5 cursor-pointer transition-colors"
                              title="Delete bookmark"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
                {bookmarks.length === 0 && (
                  <p className="text-xs text-muted-foreground p-3 text-center">No bookmarks saved yet.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* --- ADD / EDIT TOC ITEM DIALOG --- */}
      {tocModalOpen && editingTocItem && (
        <Dialog open onOpenChange={(o) => !o && setTocModalOpen(false)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <span>{editingTocItem.isNew ? "Add Table of Contents Item" : "Edit Table of Contents Item"}</span>
              </DialogTitle>
            </DialogHeader>

            <div className="flex flex-col gap-4 py-2">
              <label className="flex flex-col gap-1.5 text-xs font-medium text-muted-foreground">
                Chapter / Section Title
                <Input
                  autoFocus
                  value={editingTocItem.title}
                  onChange={(e) =>
                    setEditingTocItem((prev) => (prev ? { ...prev, title: e.target.value } : null))
                  }
                  placeholder="e.g. Chapter 1: The Beginning"
                  className="text-sm text-foreground"
                />
              </label>

              {book.fileType === "pdf" ? (
                <label className="flex flex-col gap-1.5 text-xs font-medium text-muted-foreground">
                  Target Page Number (1 to {pdfNumPages || 1})
                  <Input
                    type="number"
                    min={1}
                    max={pdfNumPages || 9999}
                    value={editingTocItem.pageOrLocation}
                    onChange={(e) =>
                      setEditingTocItem((prev) =>
                        prev ? { ...prev, pageOrLocation: Number(e.target.value) || 1 } : null
                      )
                    }
                    className="text-sm text-foreground"
                  />
                </label>
              ) : (
                <label className="flex flex-col gap-1.5 text-xs font-medium text-muted-foreground">
                  Target Section
                  <select
                    value={String(editingTocItem.pageOrLocation)}
                    onChange={(e) =>
                      setEditingTocItem((prev) =>
                        prev ? { ...prev, pageOrLocation: e.target.value } : null
                      )
                    }
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-foreground"
                  >
                    {epubDoc?.sections.map((sec, idx) => (
                      <option key={sec.id || idx} value={sec.href || String(idx + 1)}>
                        Section {idx + 1} ({sec.id || `sec-${idx + 1}`})
                      </option>
                    ))}
                  </select>
                </label>
              )}

              <label className="flex flex-col gap-1.5 text-xs font-medium text-muted-foreground">
                Nesting Level / Indentation
                <select
                  value={editingTocItem.depth}
                  onChange={(e) =>
                    setEditingTocItem((prev) =>
                      prev ? { ...prev, depth: Number(e.target.value) } : null
                    )
                  }
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-foreground"
                >
                  <option value={0}>Level 1 (Main Chapter)</option>
                  <option value={1}>Level 2 (Sub-section)</option>
                  <option value={2}>Level 3 (Sub-sub-section)</option>
                </select>
              </label>
            </div>

            <DialogFooter className="flex items-center justify-end gap-2">
              <Button variant="outline" onClick={() => setTocModalOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSaveTocModal}
                disabled={!editingTocItem.title.trim()}
              >
                {editingTocItem.isNew ? "Add to TOC" : "Save Changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
