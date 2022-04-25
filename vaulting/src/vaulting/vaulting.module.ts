import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';

import configuration from '../config/configuration';
import { BurnNFTConsumer, MintNFTConsumer } from './vaulting.consumer';
import { VaultingController } from './vaulting.controller';
import { VaultingService } from './vaulting.service';
import { BlockchainModule } from '../blockchain/blockchain.module';
import { IPFSModule } from '../ipfs/ipfs.module';
import { DatabaseModule } from '../database/database.module';
import {
  BullMintQueueModule,
  BullBurnQueueModule,
} from '../queue/queue.module';

@Module({
  controllers: [VaultingController],
  providers: [VaultingService, MintNFTConsumer, BurnNFTConsumer],
  imports: [
    BlockchainModule,
    IPFSModule,
    DatabaseModule,
    BullModule.forRoot(configuration()[process.env['runtime']]),
    BullMintQueueModule,
    BullBurnQueueModule,
  ],
})
export class VaultingModule {}
