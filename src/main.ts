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
            'Test project with two main API sections:',
            '',
            '- `books`: catalog for choosing items to buy.',
            '- `book-purchase`: async mocked payment flow with idempotency and status polling.',
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
