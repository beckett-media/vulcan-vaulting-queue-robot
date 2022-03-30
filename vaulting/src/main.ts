import { NestFactory } from '@nestjs/core';
import { VaultingModule } from './vaulting/vaulting.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import configuration from './vaulting/config/configuration';
import * as bodyParser from 'body-parser';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(VaultingModule);

  // increase body size
  app.use(bodyParser.json({ limit: '50mb' }));
  app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

  // cors
  app.enableCors();

  // pipes
  app.useGlobalPipes(new ValidationPipe());

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
