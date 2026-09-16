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
            'Book purchase API with mocked async payment processing.',
            '',
            '### Authorization',
            '1. Call `POST /auth/login` with the example credentials, or create a user via `POST /auth/register`.',
            '2. Copy `accessToken` from the response.',
            '3. Click **Authorize** and paste the token into the `access-token` field. Swagger UI adds the `Bearer` prefix automatically.',
            '4. Swagger UI will send `Authorization: Bearer <accessToken>` only for endpoints marked with a lock icon.',
          ].join('\n'),
        )
        .setVersion('1.0')
        .addBearerAuth(
          {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'Access token',
            description:
              'Paste the `accessToken` returned by `POST /auth/login` or `POST /auth/register`. Enter the token only; Swagger UI adds the `Bearer` prefix.',
          },
          'access-token',
        )
        .addTag('auth', 'Register or log in to get an access token')
        .addTag('books', 'Catalog used for purchase scenarios')
        .addTag(
          'book-purchase',
          'Main async payment flow: idempotency, retries, status polling',
        )
        .addTag('wallet', 'Authenticated user wallet')
        .addTag('orders', 'Authenticated user order history')
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
