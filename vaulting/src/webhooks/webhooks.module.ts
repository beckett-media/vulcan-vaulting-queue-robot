import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { BlockchainModule } from '../blockchain/blockchain.module';
import configuration from '../config/configuration';
import { DatabaseModule } from '../database/database.module';
import { DeltaModule } from '../delta/delta.module';
import { ResponseInterceptor } from '../interceptors/response';
import { RequestLoggerMiddleware } from '../middleware/logger';
import { WebhooksController } from './webhooks.controller';
import { WebhooksService } from './webhooks.service';

@Module({
  controllers: [WebhooksController],
  providers: [
    WebhooksService,
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
  ],
  imports: [
    DatabaseModule,
    BlockchainModule,
    DeltaModule,
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
    }),
  ],
})
export class WebhooksModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggerMiddleware).forRoutes('*');
  }
}
