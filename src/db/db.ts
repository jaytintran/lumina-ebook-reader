import Dexie, { type EntityTable } from "dexie";
import type {
  Book,
  Collection,
  Folder,
  BookFolder,
  BookCollection,
  BookOrder,
  AppSettings,
} from "./schema";

export const db = new Dexie("BookshelfDB") as Dexie & {
  books: EntityTable<Book, "id">;
  collections: EntityTable<Collection, "id">;
  folders: EntityTable<Folder, "id">;
  bookFolders: EntityTable<BookFolder, "id">;
  bookCollections: EntityTable<BookCollection, "id">;
  bookOrder: EntityTable<BookOrder, "id">;
  settings: EntityTable<AppSettings, "key">;
};

db.version(1).stores({
  books: "++id, title, author, publisher, readingStatus, isFavorite, dateAdded",
  collections: "++id, order",
  folders: "++id, scopeType, scopeId, order",
  bookFolders: "++id, bookId, folderId, [bookId+folderId]",
  bookCollections: "++id, bookId, collectionId, [bookId+collectionId]",
  bookOrder: "++id, bookId, scopeType, scopeId, [scopeType+scopeId]",
  settings: "key",
});
