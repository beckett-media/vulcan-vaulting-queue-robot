import { NestFactory } from '@nestjs/core';
import { VaultingModule } from './vaulting/vaulting.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { BullModule } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import configuration from './vaulting/config/configuration';

async function bootstrap() {
  const app = await NestFactory.create(VaultingModule);
  app.enableCors();

  const docConfig = new DocumentBuilder()
    .setTitle('Vaulting API')
    .setDescription('The Vaulting API documents')
    .setVersion('0.1')
    .build();
  const document = SwaggerModule.createDocument(app, docConfig);
  SwaggerModule.setup('api', app, document);

  const config = configuration()[process.env['runtime']];
  await app.listen(config['port'], '0.0.0.0');
}
bootstrap();
