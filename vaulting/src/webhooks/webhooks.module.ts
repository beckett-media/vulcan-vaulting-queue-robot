import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { BlockchainModule } from 'src/blockchain/blockchain.module';
import configuration from 'src/config/configuration';
import { DatabaseModule } from 'src/database/database.module';
import { DeltaModule } from 'src/delta/delta.module';
import { ResponseInterceptor } from 'src/interceptors/response';
import { RequestLoggerMiddleware } from 'src/middleware/logger';
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
