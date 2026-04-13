import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: true }),
  );

  SwaggerModule.setup(
    '/',
    app,
    SwaggerModule.createDocument(
      app,
      new DocumentBuilder()
        .setTitle('Book Store Test API')
        .setDescription(
          [
            'This API is used as a test task for QA candidates.',
            '',
            'Where to start:',
            '1. Open `books` section and get a valid `bookId` from `GET /books`.',
            '2. Create purchase operation via `POST /book-purchase` with header `Idempotency-Key`.',
            '3. Poll final status using `GET /book-purchase/operations/{operationId}`.',
            '',
            'Main sections:',
            '- `books`: catalog data for purchase scenarios.',
            '- `book-purchase`: async mocked payment flow with idempotency, retries and status polling.',
            '',
            'What to verify:',
            '- Happy path: operation transitions from `PENDING` to `PAID`.',
            '- Negative path: invalid input, missing headers, not enough stock.',
            '- Idempotency: same key + same payload returns same operation; same key + different payload returns conflict.',
            '- Rate limiting: repeated create requests may return `429`.',
            '- Async behavior: polling timing, delayed processing and flaky payment outcomes.',
            '',
            'Payment token hints for mock behavior:',
            '- token contains `fail` => final status `FAILED`.',
            '- token contains `flaky` => first attempt may fail, then retry.',
            '- token contains `slow` => processing takes longer than default.',
          ].join('\n'),
        )
        .setVersion('1.0')
        .addTag('books', 'Catalog used for purchase scenarios')
        .addTag(
          'book-purchase',
          'Main async payment flow: idempotency, retries, status polling',
        )
        .build(),
    ),
  );

  app.useGlobalPipes(
    new ValidationPipe({
      stopAtFirstError: true,
      whitelist: true,
      transform: true,
    }),
  );

  await app.listen(+process.env.APP_PORT || 3000, '0.0.0.0');
}
bootstrap().then(() => console.log('App started'));
