# Bookshelf

A personal ebook library and reader — organize, browse, and read your PDF and EPUB collection with a clean, dark-themed interface inspired by modern media library apps.

## Features

- **Library management** — import PDFs and EPUBs with automatic cover extraction, metadata editing (title, subtitle, author, tags, rating, description)
- **Organization** — Collections (sidebar, drag-to-reorder), Folders (per-view groupings with custom icons), Smart Views (auto-grouped by Author, Publisher, Tag)
- **Flexible views** — grid or row layout with configurable density, consistent across Home, Collections, and Smart Views
- **Drag-and-drop reordering** — global book order plus independent per-folder ordering, persisted locally
- **Bulk actions** — multi-select books to move, tag, or delete in bulk
- **In-app reader** — three-panel layout with bookmarks/table of contents, notes/highlights (in progress), and live-editable metadata alongside the reading pane
- **Local-first storage** — no account required; your library lives on your device

## Tech Stack

- **Framework**: [Vite](https://vitejs.dev/) + [React](https://react.dev/) (TypeScript)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/)
- **Icons**: [Lucide](https://lucide.dev/)
- **Local database**: [Dexie.js](https://dexie.org/) (IndexedDB wrapper) for metadata; [OPFS](https://developer.mozilla.org/en-US/docs/Web/API/File_System_API/Origin_private_file_system) / [Capacitor Filesystem](https://capacitorjs.com/docs/apis/filesystem) for book files
- **Data fetching/caching**: [TanStack Query](https://tanstack.com/query/latest)
- **Client state**: [Zustand](https://zustand-demo.pmnd.rs/)
- **Routing**: [React Router](https://reactrouter.com/)
- **Drag and drop**: [dnd-kit](https://dndkit.com/)
- **PDF rendering**: [react-pdf](https://github.com/wojtekmaj/react-pdf) (pdf.js)
- **EPUB rendering**: [epub.js](https://github.com/futurepress/epub.js)
- **Mobile**: [Capacitor](https://capacitorjs.com/) (Android)
