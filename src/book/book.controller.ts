import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { BookService } from './book.service';
import { Book } from './book.model';
import { GetBooksQueryDto } from './dto/get-books-query.dto';
import { CreateBookDto } from './dto/create-book.dto';
import { PatchBookDto } from './dto/patch-book.dto';

@ApiTags('books')
@Controller('books')
export class BookController {
  constructor(private readonly bookService: BookService) {}

  @Get()
  @ApiOperation({
    summary: 'List books available for purchase',
    description: 'Use this endpoint to fetch valid `bookId` values for purchase scenarios.',
  })
  @ApiResponse({ status: HttpStatus.OK, type: Book, isArray: true })
  async getAll(@Query() query: GetBooksQueryDto): Promise<Book[]> {
    return this.bookService.getAll(query);
  }

  @Post()
  @ApiOperation({
    summary: 'Create a book',
    description: 'Adds a new book to catalog. `id` must be unique.',
  })
  @ApiResponse({ status: HttpStatus.CREATED, type: Book })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Book id already exists.' })
  async create(@Body() dto: CreateBookDto): Promise<Book> {
    return this.bookService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update a book',
    description: 'Partially updates catalog book fields.',
  })
  @ApiResponse({ status: HttpStatus.OK, type: Book })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Book not found.' })
  async patch(@Param('id') id: string, @Body() dto: PatchBookDto): Promise<Book> {
    return this.bookService.patch(id, dto);
  }
}
