import { Injectable } from '@nestjs/common';
import { promises as fs } from 'node:fs';
import { join } from 'path';
import { Book } from './book.model';
import { GetBooksQueryDto } from './dto/get-books-query.dto';

@Injectable()
export class BookService {
  private readonly filePath = join(process.cwd(), 'src', 'data', 'books.json');

  async getAll(query?: GetBooksQueryDto): Promise<Book[]> {
    let books = await this.readBooks();

    if (query?.category) {
      books = books.filter(book => book.categorySlug === query.category);
    }

    if (query?.inStock !== undefined) {
      books = books.filter(book =>
        query.inStock ? book.stock > 0 : book.stock === 0,
      );
    }

    if (query?.minPriceCents !== undefined) {
      books = books.filter(book => book.priceCents >= query.minPriceCents);
    }

    if (query?.maxPriceCents !== undefined) {
      books = books.filter(book => book.priceCents <= query.maxPriceCents);
    }

    return books.filter(book => book.active);
  }

  async findOne(id: string): Promise<Book | undefined> {
    const books = await this.readBooks();
    return books.find(book => book.id === id);
  }

  async reduceStock(bookId: string, quantity: number): Promise<void> {
    const books = await this.readBooks();
    const bookIndex = books.findIndex(book => book.id === bookId);

    if (bookIndex === -1) {
      return;
    }

    books[bookIndex].stock -= quantity;
    await this.writeBooks(books);
  }

  private async readBooks(): Promise<Book[]> {
    try {
      const raw = await fs.readFile(this.filePath, 'utf8');
      return JSON.parse(raw) as Book[];
    } catch {
      return [];
    }
  }

  private async writeBooks(books: Book[]): Promise<void> {
    await fs.writeFile(this.filePath, JSON.stringify(books, null, 2));
  }
}
