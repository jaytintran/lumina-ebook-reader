import { create } from "zustand";

export interface ActiveFolderContext {
  folderId: number;
  folderName: string;
  scopeType: "view" | "collection" | string;
  scopeId: string;
}

export const useUIStore = create<{
  settingsOpen: boolean;
  setSettingsOpen: (open: boolean) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedIds: number[];
  toggleSelected: (id: number) => void;
  clearSelection: () => void;
  isEditingMetadata: boolean;
  setIsEditingMetadata: (editing: boolean) => void;
  mobileDrawerOpen: boolean;
  setMobileDrawerOpen: (open: boolean) => void;
  isDragging: boolean;
  setIsDragging: (dragging: boolean) => void;
  activeFolderContext: ActiveFolderContext | null;
  setActiveFolderContext: (ctx: ActiveFolderContext | null) => void;
  lastLibraryLocation: { pathname: string; search?: string; folderId?: number | null } | null;
  setLastLibraryLocation: (loc: { pathname: string; search?: string; folderId?: number | null } | null) => void;
}>((set) => ({
  settingsOpen: false,
  setSettingsOpen: (open) => set({ settingsOpen: open }),
  searchQuery: "",
  setSearchQuery: (query) => set({ searchQuery: query }),
  selectedIds: [],
  toggleSelected: (id) =>
    set((s) => ({
      selectedIds: s.selectedIds.includes(id)
        ? s.selectedIds.filter((x) => x !== id)
        : [...s.selectedIds, id],
    })),
  clearSelection: () => set({ selectedIds: [] }),
  isEditingMetadata: false,
  setIsEditingMetadata: (editing) => set({ isEditingMetadata: editing }),
  mobileDrawerOpen: false,
  setMobileDrawerOpen: (open) => set({ mobileDrawerOpen: open }),
  isDragging: false,
  setIsDragging: (dragging) => set({ isDragging: dragging }),
  activeFolderContext: null,
  setActiveFolderContext: (ctx) => set({ activeFolderContext: ctx }),
  lastLibraryLocation: null,
  setLastLibraryLocation: (loc) => set({ lastLibraryLocation: loc }),
}));
