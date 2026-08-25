import { BookCard, type MockBook } from "./BookCard";

export function BookGrid({ books }: { books: MockBook[] }) {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
      {books.map((book) => (
        <BookCard key={book.id} book={book} />
      ))}
    </div>
  );
}
