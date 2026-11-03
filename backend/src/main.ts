import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS if you plan to connect a frontend dashboard later
  app.enableCors();

  // Swagger API Documentation Setup
  const config = new DocumentBuilder()
    .setTitle('Amico Lab ERP API')
    .setDescription('Enterprise Resource Planning API documentation spanning all 12+ core departments (Procurement, Inventory, Production, Quality, Sales, Finance, HRM, Maintenance, Compliance, CRM, RMD, AI Analytics).')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document); // Accessible at http://localhost:3000/api/docs

  const port = Number(process.env.PORT ?? 3000);
  if (!Number.isSafeInteger(port) || port < 1 || port > 65535) {
    throw new Error('Invalid backend PORT configuration');
  }
  await app.listen(port);
}
bootstrap();