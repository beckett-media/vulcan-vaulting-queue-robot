import { BullModule, getQueueOptionsToken } from '@nestjs/bull';
import { Module } from '@nestjs/common';

import configuration from '../config/configuration';
import { BurnNFTConsumer, MintNFTConsumer } from './vaulting.consumer';
import { VaultingController } from './vaulting.controller';
import { VaultingService } from './vaulting.service';
import { BlockchainModule } from 'src/blockchain/blockchain.module';
import { IPFSModule } from 'src/ipfs/ipfs.module';
import { DatabaseModule } from 'src/database/database.module';

@Module({
  controllers: [VaultingController],
  providers: [VaultingService, MintNFTConsumer, BurnNFTConsumer],
  imports: [
    BlockchainModule,
    IPFSModule,
    DatabaseModule,
    BullModule.forRoot(configuration()[process.env['runtime']]),
    BullModule.registerQueue({
      name: configuration()[process.env['runtime']]['queue']['mint'],
      limiter: configuration()[process.env['runtime']]['queue']['limiter'],
    }),
    BullModule.registerQueue({
      name: configuration()[process.env['runtime']]['queue']['burn'],
      limiter: configuration()[process.env['runtime']]['queue']['limiter'],
    }),
  ],
})
export class VaultingModule {}
