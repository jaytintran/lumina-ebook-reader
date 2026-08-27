import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Menu,
  Minus,
  PinOff,
  Plus,
  RotateCcw,
  SlidersHorizontal,
  StickyNote,
  Type,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ParsedEpubContent } from "@/lib/importer";

interface ReaderHeaderProps {
  book: {
    title: string;
    author: string;
    fileType: "pdf" | "epub";
  };
  onBack: () => void;
  // PDF Controls
  pdfCurrentPage: number;
  pdfNumPages: number;
  pdfScale: number;
  onPdfPrevPage: () => void;
  onPdfNextPage: () => void;
  onPdfZoomIn: () => void;
  onPdfZoomOut: () => void;
  onPdfZoomReset: () => void;
  onPdfFitWidth?: () => void;
  // EPUB Controls
  epubDoc: ParsedEpubContent | null;
  epubSectionIdx: number;
  epubFontSize: number;
  onEpubPrevSection: () => void;
  onEpubNextSection: () => void;
  onEpubZoomIn: () => void;
  onEpubZoomOut: () => void;
  onEpubZoomReset: () => void;
  // Sidebar Toggles
  leftPinned: boolean;
  rightPinned: boolean;
  onToggleLeftPinned: () => void;
  onToggleRightPinned: () => void;
}

export function ReaderHeader({
  book,
  onBack,
  pdfCurrentPage,
  pdfNumPages,
  pdfScale,
  onPdfPrevPage,
  onPdfNextPage,
  onPdfZoomIn,
  onPdfZoomOut,
  onPdfZoomReset,
  onPdfFitWidth,
  epubDoc,
  epubSectionIdx,
  epubFontSize,
  onEpubPrevSection,
  onEpubNextSection,
  onEpubZoomIn,
  onEpubZoomOut,
  onEpubZoomReset,
  leftPinned,
  rightPinned,
  onToggleLeftPinned,
  onToggleRightPinned,
}: ReaderHeaderProps) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-card/90 px-2 sm:px-4 backdrop-blur z-20 gap-2">
      {/* Left: Back & Title */}
      <div className="flex items-center gap-2 min-w-0 max-w-[40%] sm:max-w-[45%] md:max-w-md">
        <Button variant="ghost" size="icon-sm" onClick={onBack} className="shrink-0">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex flex-col min-w-0">
          <h1 className="text-xs sm:text-sm font-bold truncate leading-tight">{book.title}</h1>
          <p className="text-[10px] sm:text-[11px] text-muted-foreground truncate">
            {book.author} · {book.fileType.toUpperCase()}
          </p>
        </div>
      </div>

      {/* Center Controls (Desktop: expanded, Mobile: compact navigation) */}
      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        {book.fileType === "pdf" ? (
          <>
            <Button
              variant="ghost"
              size="icon-sm"
              disabled={pdfCurrentPage <= 1}
              onClick={onPdfPrevPage}
              className="h-8 w-8"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs font-medium tabular-nums px-0.5 sm:px-1">
              {pdfCurrentPage} <span className="text-muted-foreground">/</span> {pdfNumPages || 1}
            </span>
            <Button
              variant="ghost"
              size="icon-sm"
              disabled={pdfCurrentPage >= pdfNumPages}
              onClick={onPdfNextPage}
              className="h-8 w-8"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>

            {/* Desktop-only zoom controls */}
            <div className="hidden md:flex items-center gap-1">
              <div className="h-4 w-px bg-border mx-1" />
              <Button
                variant="ghost"
                size="icon-sm"
                disabled={pdfScale <= 0.4}
                onClick={onPdfZoomOut}
                title="Zoom Out (-)"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <button
                onClick={onPdfZoomReset}
                title="Reset Zoom to 100% (0)"
                className="text-[11px] text-muted-foreground hover:text-foreground w-11 text-center font-medium transition-colors cursor-pointer"
              >
                {Math.round(pdfScale * 100)}%
              </button>
              <Button
                variant="ghost"
                size="icon-sm"
                disabled={pdfScale >= 3.0}
                onClick={onPdfZoomIn}
                title="Zoom In (+)"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              {onPdfFitWidth && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={onPdfFitWidth}
                  title="Fit to Width"
                >
                  <Maximize2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </>
        ) : (
          epubDoc && (
            <>
              <Button
                variant="ghost"
                size="icon-sm"
                disabled={epubSectionIdx <= 0}
                onClick={onEpubPrevSection}
                className="h-8 w-8"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs font-medium tabular-nums px-0.5 sm:px-1">
                <span className="hidden sm:inline">Section </span>{epubSectionIdx + 1}{" "}
                <span className="text-muted-foreground">/ {epubDoc.sections.length}</span>
              </span>
              <Button
                variant="ghost"
                size="icon-sm"
                disabled={epubSectionIdx >= epubDoc.sections.length - 1}
                onClick={onEpubNextSection}
                className="h-8 w-8"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>

              {/* Desktop-only font size controls */}
              <div className="hidden md:flex items-center gap-1">
                <div className="h-4 w-px bg-border mx-1" />
                <Button
                  variant="ghost"
                  size="icon-sm"
                  disabled={epubFontSize <= 70}
                  onClick={onEpubZoomOut}
                  title="Decrease Font Size (-)"
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <button
                  onClick={onEpubZoomReset}
                  title="Reset Font Size to 100% (0)"
                  className="text-[11px] text-muted-foreground hover:text-foreground w-11 text-center font-medium transition-colors cursor-pointer"
                >
                  {epubFontSize}%
                </button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  disabled={epubFontSize >= 200}
                  onClick={onEpubZoomIn}
                  title="Increase Font Size (+)"
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </div>
            </>
          )
        )}
      </div>

      {/* Right Controls: Display/Zoom Dropdown + Sidebars */}
      <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
        {/* Mobile Display Settings Popover / Dropdown */}
        <div className="md:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger render={
              <Button variant="ghost" size="icon-sm" className="h-8 w-8" title="Appearance & Zoom">
                {book.fileType === "pdf" ? <SlidersHorizontal className="h-4 w-4" /> : <Type className="h-4 w-4" />}
              </Button>
            } />
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel className="text-xs">
                {book.fileType === "pdf" ? "Zoom Controls" : "Text Size"}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {book.fileType === "pdf" ? (
                <>
                  <DropdownMenuItem onClick={onPdfZoomIn} className="flex items-center justify-between">
                    <span className="flex items-center gap-2"><ZoomIn className="h-4 w-4" /> Zoom In</span>
                    <span className="text-[11px] text-muted-foreground">+</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onPdfZoomOut} className="flex items-center justify-between">
                    <span className="flex items-center gap-2"><ZoomOut className="h-4 w-4" /> Zoom Out</span>
                    <span className="text-[11px] text-muted-foreground">-</span>
                  </DropdownMenuItem>
                  {onPdfFitWidth && (
                    <DropdownMenuItem onClick={onPdfFitWidth} className="flex items-center gap-2">
                      <Maximize2 className="h-4 w-4" /> Fit Width
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={onPdfZoomReset} className="flex items-center gap-2">
                    <RotateCcw className="h-4 w-4" /> Reset (100%)
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuItem onClick={onEpubZoomIn} className="flex items-center justify-between">
                    <span className="flex items-center gap-2"><Plus className="h-4 w-4" /> Increase Size</span>
                    <span className="text-[11px] text-muted-foreground">+10%</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onEpubZoomOut} className="flex items-center justify-between">
                    <span className="flex items-center gap-2"><Minus className="h-4 w-4" /> Decrease Size</span>
                    <span className="text-[11px] text-muted-foreground">-10%</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onEpubZoomReset} className="flex items-center gap-2">
                    <RotateCcw className="h-4 w-4" /> Reset Size (100%)
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* TOC Button */}
        <Button
          variant={leftPinned ? "secondary" : "ghost"}
          size="sm"
          className="text-xs h-8 px-2 sm:px-3 gap-1.5"
          onClick={onToggleLeftPinned}
          title="Table of Contents & Bookmarks ([)"
        >
          {leftPinned ? <PinOff className="h-3.5 w-3.5 hidden md:inline" /> : <Menu className="h-3.5 w-3.5" />}
          <span className="hidden md:inline">TOC / Bookmarks</span>
        </Button>

        {/* Notes & Info Button */}
        <Button
          variant={rightPinned ? "secondary" : "ghost"}
          size="sm"
          className="text-xs h-8 px-2 sm:px-3 gap-1.5"
          onClick={onToggleRightPinned}
          title="Notes, Highlights & Info (])"
        >
          {rightPinned ? <PinOff className="h-3.5 w-3.5 hidden md:inline" /> : <StickyNote className="h-3.5 w-3.5" />}
          <span className="hidden md:inline">Notes & Info</span>
        </Button>
      </div>
    </header>
  );
}
