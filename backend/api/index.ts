import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from '../src/app.module';

// Variável para armazenar a instância do app (Shared entre requisições serverless)
let cachedApp: any;

async function bootstrap() {
  if (cachedApp) return cachedApp;

  const app = await NestFactory.create(AppModule);

  // CORS
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // PREFIXO GLOBAL (Importante: Deve casar com o que a Vercel roteia)
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

  await app.init();
  cachedApp = app.getHttpAdapter().getInstance();
  return cachedApp;
}

// Handler Principal para Vercel
export default async (req: any, res: any) => {
  const app = await bootstrap();
  return app(req, res);
};
