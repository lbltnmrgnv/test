import { ApiProperty } from '@nestjs/swagger';

export class Book {
  @ApiProperty({ example: 'book-atomic-habits' })
  id: string;

  @ApiProperty({ example: 'Atomic Habits' })
  title: string;

  @ApiProperty({ example: 'James Clear' })
  author: string;

  @ApiProperty({ example: 'books' })
  categorySlug: string;

  @ApiProperty({ example: 1490 })
  priceCents: number;

  @ApiProperty({ example: 8 })
  stock: number;

  @ApiProperty({ example: true })
  active: boolean;
}
