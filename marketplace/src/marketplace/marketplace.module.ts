import { Module } from '@nestjs/common';
import { MarketplaceService } from './marketplace.service';
import { MarketplaceController } from './marketplace.controller';
import { ResponseInterceptor } from 'src/interceptors/response';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { DatabaseModule } from 'src/database/database.module';
import { AwsModule } from 'src/aws/aws.module';
import { AwsService } from 'src/aws/aws.service';

@Module({
  controllers: [MarketplaceController],
  providers: [
    MarketplaceService,
    AwsService,
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
  ],
  imports: [DatabaseModule, AwsModule],
})
export class MarketplaceModule {}
