import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { BurnNFTConsumer, MintNFTConsumer } from './vaulting.consumer';
import { VaultingController } from './vaulting.controller';
import {
  VaultingBurningService,
  VaultingMintingService,
} from './vaulting.service';

@Module({
  controllers: [VaultingController],
  providers: [
    VaultingBurningService,
    VaultingMintingService,
    MintNFTConsumer,
    BurnNFTConsumer,
  ],
  imports: [
    BullModule.forRoot({
      redis: {
        host: 'localhost',
        port: 6379,
      },
    }),
    BullModule.registerQueue({
      name: 'beckett_mint',
    }),
    BullModule.registerQueue({
      name: 'beckett_burn',
    }),
  ],
})
export class VaultingModule {}
