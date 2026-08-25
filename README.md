# Lumina Ebook Reader & Bookshelf

A personal, local-first ebook library and reading application — organize, browse, annotate, and read your PDF and EPUB collections with a clean dark theme, responsive grid/row views, full drag-and-drop organization, and a 3-column in-app reader.

---

## ✨ Features

- **Personal Library Management**:
  - Drag-and-drop import for PDF and EPUB files with automatic cover thumbnail generation and metadata extraction.
  - Live metadata editor: Edit title, subtitle, author, publisher, tags, rating (1–5 stars), and descriptions.
  - Multi-select mode with bulk action bar: Batch move to collections, bulk tag, or delete.
- **Organization & Structure**:
  - **Sidebar Collections**: Create, rename, delete, and drag-and-drop reorder custom collections.
  - **Collapsible In-Page Folders**: Group books inside custom folders with icons. Folders remain persistent and collapsible with persistent state in `localStorage`.
  - **Smart Views**: Auto-categorized dynamic views by **Authors**, **Publishers**, and **Tags** with interactive quick-filter pill strips.
  - **Drag-to-Sidebar**: Drag book cards directly over sidebar categories (Favorites, Reading, Wanna Read, Finished) or custom collections to re-categorize or move them.
- **Reading Experience**:
  - **Full 3-Column Reader**: Left panel (TOC and bookmarks), Center panel (continuous vertical scroll reader), Right panel (notes, highlights, and on-the-fly metadata).
  - **Continuous Vertical Flow**: Lazy-rendered PDF pages and seamless EPUB section reading.
  - **Jump Navigation**: Click any chapter in Table of Contents or saved bookmark to smoothly scroll directly to that position.
- **Local-First & Private**:
  - Stored locally on your machine via IndexedDB ([Dexie.js](https://dexie.org/)) and Origin Private File System ([OPFS](https://developer.mozilla.org/en-US/docs/Web/API/File_System_API/Origin_private_file_system)). No external tracking or servers required.

---

## 🛠️ Tech Stack

- **Framework**: React 19 + TypeScript + Vite 8
- **Styling**: Tailwind CSS v4 + Lucide Icons + Radix / Base UI
- **Database**: Dexie.js (IndexedDB) + OPFS (Origin Private File System)
- **State & Data Fetching**: TanStack React Query v5 + Zustand
- **Drag and Drop**: `@dnd-kit/core` + `@dnd-kit/sortable`
- **Document Engines**: PDF.js (Web Worker) + Custom EPUB Unpacker (`fflate`)
- **Desktop Runtime**: Tauri v2 (Rust)

---

## 💻 Development

1. **Install dependencies**:
   ```bash
   npm install
   ```
2. **Start Vite development server**:
   ```bash
   npm run dev
   ```
3. **Build web production bundle**:
   ```bash
   npm run build
   ```
4. **Preview production build**:
   ```bash
   npm run preview
   ```

---

## 📦 Packaging as a Native Desktop App (Tauri)

Lumina is configured with **Tauri v2** to compile into a lightweight native desktop app for **Windows (`.msi` / `.exe`)**, **macOS (`.dmg`)**, and **Linux (`.deb` / `.AppImage`)**.

### Prerequisites for Desktop Builds:
- Install [Rust & Cargo](https://www.rust-lang.org/tools/install) (runs `rustup-init.exe` on Windows).
- On Windows: Ensure the C++ Build Tools from [Visual Studio](https://visualstudio.microsoft.com/visual-cpp-build-tools/) are installed.

### Commands:
- **Run Desktop App in Development Mode**:
  ```bash
  npm run tauri:dev
  ```
- **Compile Production Desktop Executable / Installer**:
  ```bash
  npm run tauri:build
  ```
  The compiled installer will be located in `src-tauri/target/release/bundle/`.

---

## 🌐 Web Deployment Options

Because Lumina is a client-side Single-Page Application (SPA):

### Option 1: Vercel
Create `vercel.json` in the project root:
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```
Run `vercel` or connect your repository on [vercel.com](https://vercel.com).

### Option 2: Cloudflare Pages
1. Connect your repository on Cloudflare Dashboard $\rightarrow$ **Workers & Pages**.
2. **Build command**: `npm run build`
3. **Output directory**: `dist`
4. Add `public/_redirects`:
   ```text
   /*    /index.html   200
   ```

### Option 3: Netlify
Deploy directly with:
```bash
netlify deploy --prod --dir=dist
```
Add `public/_redirects` with `/* /index.html 200`.
