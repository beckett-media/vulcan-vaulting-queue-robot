import * as bodyParser from 'body-parser';
import express from 'express';
import http from 'http';

import { INestApplication, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import configuration from './config/configuration';
import { VaultingModule } from './vaulting/vaulting.module';
import { ExpressAdapter } from '@nestjs/platform-express';
import { WebhooksModule } from './webhooks/webhooks.module';
import { check_env } from './util/env';

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
    .setTitle('Bravo API')
    .setDescription('The Bravo API documents')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, docConfig);
  SwaggerModule.setup('api', app, document);
}

async function bootstrap() {
  const config = configuration()[process.env['runtime']];
  if (!check_env()) {
    throw new Error(
      'Missing env variables in prod. See check_env() for details',
    );
  }

  // create and setup vaulting server
  const vaultingServer = express();
  const vaultingApp = await NestFactory.create(
    VaultingModule,
    new ExpressAdapter(vaultingServer),
  );
  setupApp(vaultingApp);
  await vaultingApp.init();
  http.createServer(vaultingServer).listen(config['api_port'], '0.0.0.0');

  // create and setup webhook server
  const webhookServer = express();
  const webhookApp = await NestFactory.create(
    WebhooksModule,
    new ExpressAdapter(webhookServer),
  );
  setupApp(webhookApp);
  await webhookApp.init();
  http.createServer(webhookServer).listen(config['webhook_port'], '0.0.0.0');
}
bootstrap();
