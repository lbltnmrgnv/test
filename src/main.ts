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
            'Test project for Senior QA API interview.',
            '',
            'Candidate task (high level):',
            '1. Cover purchase flow from operation creation to final status.',
            '2. Validate idempotency behavior using `Idempotency-Key`.',
            '3. Validate negative scenarios: insufficient stock, rate limit, invalid statuses.',
            '4. Validate async behavior (polling) and flaky provider simulation.',
            '',
            'Key business flow:',
            '- `POST /book-purchase` returns `202` + `operationId`.',
            '- Final state is available via `GET /book-purchase/operations/:operationId`.',
            '- Token hints: `fail`, `flaky`, `slow`.',
            '',
            'Expected output from candidate:',
            '- Test design/checklist.',
            '- API checks (manual or automated).',
            '- Defects / risks found and prioritization.',
          ].join('\n'),
        )
        .setVersion('1.0')
        .addTag(
          'candidate-task',
          'Interview context and what should be tested by candidate',
        )
        .addTag('books', 'Catalog used for purchase scenarios')
        .addTag(
          'book-purchase',
          'Main async payment flow: idempotency, retries, status polling',
        )
        .addTag('category', 'Legacy CRUD module kept for baseline checks')
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
