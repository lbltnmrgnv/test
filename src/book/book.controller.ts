import { Controller, Get, HttpStatus, Query } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { BookService } from './book.service';
import { Book } from './book.model';
import { GetBooksQueryDto } from './dto/get-books-query.dto';

@ApiTags('books')
@Controller('books')
export class BookController {
  constructor(private readonly bookService: BookService) {}

  @Get()
  @ApiResponse({ status: HttpStatus.OK, type: Book, isArray: true })
  async getAll(@Query() query: GetBooksQueryDto): Promise<Book[]> {
    return this.bookService.getAll(query);
  }
}
