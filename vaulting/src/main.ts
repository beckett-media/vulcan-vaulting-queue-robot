import { NestFactory } from '@nestjs/core';
import { VaultingModule } from './vaulting/vaulting.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { BullModule } from '@nestjs/bull';

async function bootstrap() {
  const app = await NestFactory.create(VaultingModule);
  app.enableCors();

  const config = new DocumentBuilder()
    .setTitle('Vaulting API')
    .setDescription('The Vaulting API documents')
    .setVersion('0.1')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(3001, '0.0.0.0');
}
bootstrap();
