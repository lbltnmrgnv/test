import { Controller, Get, HttpStatus, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { BookService } from './book.service';
import { Book } from './book.model';
import { GetBooksQueryDto } from './dto/get-books-query.dto';

@ApiTags('books')
@Controller('books')
export class BookController {
  constructor(private readonly bookService: BookService) {}

  @Get()
  @ApiOperation({
    summary: 'List books available for purchase',
    description: 'Start point for candidate: fetch valid `bookId` values for purchase scenarios.',
  })
  @ApiResponse({ status: HttpStatus.OK, type: Book, isArray: true })
  async getAll(@Query() query: GetBooksQueryDto): Promise<Book[]> {
    return this.bookService.getAll(query);
  }
}
