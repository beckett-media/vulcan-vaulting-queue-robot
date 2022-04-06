import { NestFactory } from '@nestjs/core';
import { VaultingModule } from './vaulting/vaulting.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import configuration from './vaulting/config/configuration';
import * as bodyParser from 'body-parser';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { readFileSync } from 'fs';
import { ExpressAdapter } from '@nestjs/platform-express';

function setupApp(app: INestApplication) {
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
}

async function bootstrap() {
  const httpsOptions = {
    key: readFileSync(process.env.SSL_SERVER_KEY),
    cert: readFileSync(process.env.SSL_SERVER_CERT),
  };
  const app = await NestFactory.create(VaultingModule, { httpsOptions });
  setupApp(app);

  const config = configuration()[process.env['runtime']];
  await app.listen(config['https_port'], '0.0.0.0');
}
bootstrap();
