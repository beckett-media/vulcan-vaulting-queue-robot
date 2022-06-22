import * as bodyParser from 'body-parser';
import express from 'express';
import http from 'http';

import { INestApplication, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import configuration from './config/configuration';
import { MarketplaceModule } from './marketplace/marketplace.module';
import { ExpressAdapter } from '@nestjs/platform-express';

function setupApp(app: INestApplication) {
  // increase body size
  app.use(bodyParser.json({ limit: '50mb' }));
  app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

  // cors
  app.enableCors();

  // pipes
  app.useGlobalPipes(new ValidationPipe());

  // swagger documents
  const docConfig = new DocumentBuilder()
    .setTitle('Vaulting API')
    .setDescription('The Vaulting API documents')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, docConfig);
  SwaggerModule.setup('api', app, document);
}

async function bootstrap() {
  const config = configuration()[process.env['runtime']];
  // create and setup vaulting server
  const vaultingServer = express();
  const vaultingApp = await NestFactory.create(
    MarketplaceModule,
    new ExpressAdapter(vaultingServer),
  );
  setupApp(vaultingApp);
  await vaultingApp.init();
  http.createServer(vaultingServer).listen(config['api_port'], '0.0.0.0');
}
bootstrap();
