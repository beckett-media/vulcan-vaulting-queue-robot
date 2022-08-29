import { Module } from '@nestjs/common';
import { MarketplaceService } from './marketplace.service';

@Module({
  providers: [MarketplaceService],
})
export class MarketplaceModule {}
