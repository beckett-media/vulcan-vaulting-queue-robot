import { Module } from '@nestjs/common';
import { MarketplaceService } from './marketplace.service';
import { MarketplaceController } from './marketplace.controller';
import { ResponseInterceptor } from 'src/interceptors/response';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { DatabaseModule } from 'src/database/database.module';

@Module({
  controllers: [MarketplaceController],
  providers: [
    MarketplaceService,
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
  ],
  imports: [DatabaseModule],
})
export class MarketplaceModule {}
