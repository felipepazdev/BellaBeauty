import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS (necessário para Swagger e frontend)
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // PREFIXO GLOBAL
  app.setGlobalPrefix('api');

  // VALIDATION PIPE
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // SWAGGER CONFIG
  const config = new DocumentBuilder()
    .setTitle('Bella Beauty API')
    .setDescription('API do sistema Bella Beauty')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('api/docs', app, document);

  await app.listen(3000, '0.0.0.0');

  console.log('🚀 Backend rodando em http://localhost:3000/api');
  console.log('📚 Swagger disponível em http://localhost:3000/api/docs');
}

bootstrap();