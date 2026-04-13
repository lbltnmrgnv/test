import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from './../src/app.module';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { join } from 'path';
import { promises as fs } from 'fs';

const booksFilePath = join(process.cwd(), 'src', 'data', 'books.json');
const operationsFilePath = join(
  process.cwd(),
  'src',
  'data',
  'purchase-operations.json',
);
const booksFixture = [
  {
    id: 'book-atomic-habits',
    title: 'Atomic Habits',
    author: 'James Clear',
    categorySlug: 'books',
    priceCents: 1490,
    stock: 8,
    active: true,
  },
  {
    id: 'book-ddd',
    title: 'Domain-Driven Design',
    author: 'Eric Evans',
    categorySlug: 'books',
    priceCents: 3590,
    stock: 3,
    active: true,
  },
  {
    id: 'book-clean-code',
    title: 'Clean Code',
    author: 'Robert C. Martin',
    categorySlug: 'books',
    priceCents: 2190,
    stock: 0,
    active: true,
  },
];

describe('App (e2e)', () => {
  let app: NestFastifyApplication;

  beforeEach(async () => {
    await fs.writeFile(booksFilePath, JSON.stringify(booksFixture, null, 2));
    await fs.writeFile(operationsFilePath, JSON.stringify([], null, 2));

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  it('/books (GET)', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/books',
    });

    expect(response.statusCode).toBe(200);
    expect(Array.isArray(response.json())).toBe(true);
  });

  it('/book-purchase (POST) should validate idempotency key', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/book-purchase',
      payload: {
        bookId: 'book-atomic-habits',
        customerId: 'user-1',
        quantity: 1,
        paymentToken: 'tok_visa_test',
      },
    });

    expect(response.statusCode).toBe(400);
  });

  it('/book-purchase (POST) should return 409 for idempotency conflict', async () => {
    const firstResponse = await app.inject({
      method: 'POST',
      url: '/book-purchase',
      headers: {
        'idempotency-key': 'idempotency-key-1',
      },
      payload: {
        bookId: 'book-atomic-habits',
        customerId: 'user-1',
        quantity: 1,
        paymentToken: 'tok_slow_visa_test',
      },
    });

    const conflictResponse = await app.inject({
      method: 'POST',
      url: '/book-purchase',
      headers: {
        'idempotency-key': 'idempotency-key-1',
      },
      payload: {
        bookId: 'book-atomic-habits',
        customerId: 'user-1',
        quantity: 2,
        paymentToken: 'tok_slow_visa_test',
      },
    });

    expect(firstResponse.statusCode).toBe(202);
    expect(conflictResponse.statusCode).toBe(409);
  });

  it('/book-purchase (POST) should apply rate limit', async () => {
    const payload = {
      bookId: 'book-atomic-habits',
      customerId: 'senior-candidate',
      quantity: 1,
      paymentToken: 'tok_slow_visa_test',
    };

    for (let index = 1; index <= 3; index += 1) {
      const response = await app.inject({
        method: 'POST',
        url: '/book-purchase',
        headers: {
          'idempotency-key': `limit-key-${index}`,
        },
        payload,
      });

      expect(response.statusCode).toBe(202);
    }

    const limitedResponse = await app.inject({
      method: 'POST',
      url: '/book-purchase',
      headers: {
        'idempotency-key': 'limit-key-4',
      },
      payload,
    });

    expect(limitedResponse.statusCode).toBe(429);
  });
});
