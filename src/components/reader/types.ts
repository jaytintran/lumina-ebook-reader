export type LeftTab = "toc" | "bookmarks";
export type RightTab = "notes" | "highlights" | "metadata";

export interface PdfOutlineItem {
  title: string;
  pageNumber: number;
  depth: number;
}

export interface UnifiedTocItem {
  id?: number | string;
  title: string;
  pageOrLocation: number | string;
  depth: number;
  isCustom?: boolean;
}
