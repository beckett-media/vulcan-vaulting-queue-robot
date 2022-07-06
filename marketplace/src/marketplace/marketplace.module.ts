import { MiddlewareConsumer, Module } from '@nestjs/common';
import { MarketplaceService } from './marketplace.service';
import { MarketplaceController } from './marketplace.controller';
import { ResponseInterceptor } from 'src/interceptors/response';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { DatabaseModule } from 'src/database/database.module';
import { AwsModule } from 'src/aws/aws.module';
import { AuthModule } from 'src/auth/auth.module';
import { AwsService } from 'src/aws/aws.service';
import { BravoModule } from 'src/bravo/bravo.module';
import { BravoService } from 'src/bravo/bravo.service';
import { RequestLoggerMiddleware } from 'src/middleware/logger';

@Module({
  controllers: [MarketplaceController],
  providers: [
    MarketplaceService,
    AwsService,
    BravoService,
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
  ],
  imports: [DatabaseModule, AwsModule, AuthModule, BravoModule],
})
export class MarketplaceModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggerMiddleware).forRoutes('*');
  }
}
