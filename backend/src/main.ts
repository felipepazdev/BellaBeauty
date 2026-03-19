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

  // Se não estiver na Vercel, escuta numa porta
  if (!process.env.VERCEL) {
    const port = process.env.PORT || 3000;
    await app.listen(port, '0.0.0.0');
    console.log(`🚀 Backend rodando em http://localhost:${port}/api`);
    console.log(`📚 Swagger disponível em http://localhost:${port}/api/docs`);
  }

  return app;
}

// Handler para Vercel Serverless
let app: any;
export default async (req: any, res: any) => {
  if (!app) {
    const nestApp = await bootstrap();
    await nestApp.init();
    app = nestApp.getHttpAdapter().getInstance();
  }
  return app(req, res);
};

// Execução para ambiente local (nest start)
if (!process.env.VERCEL) {
  bootstrap();
}
