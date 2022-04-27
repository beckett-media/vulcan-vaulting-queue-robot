import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';

import configuration from '../config/configuration';
import {
  BurnNFTConsumer,
  ExecConsumer,
  LockNFTConsumer,
  MintNFTConsumer,
} from './vaulting.consumer';
import { VaultingController } from './vaulting.controller';
import { VaultingService } from './vaulting.service';
import { BlockchainModule } from '../blockchain/blockchain.module';
import { IPFSModule } from '../ipfs/ipfs.module';
import { DatabaseModule } from '../database/database.module';
import {
  BullMintQueueModule,
  BullBurnQueueModule,
  BullLockQueueModule,
  BullExecQueueModule,
} from '../queue/queue.module';

@Module({
  controllers: [VaultingController],
  providers: [
    VaultingService,
    MintNFTConsumer,
    BurnNFTConsumer,
    LockNFTConsumer,
    ExecConsumer,
  ],
  imports: [
    BlockchainModule,
    IPFSModule,
    DatabaseModule,
    BullModule.forRoot(configuration()[process.env['runtime']]),
    BullMintQueueModule,
    BullBurnQueueModule,
    BullLockQueueModule,
    BullExecQueueModule,
  ],
})
export class VaultingModule {}
