import { BullModule } from '@nestjs/bull';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';

import configuration, {
  redisConfig,
  RUNTIME_ENV,
} from '../config/configuration';
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
import { RequestLoggerMiddleware } from 'src/middleware/logger';
import { ResponseInterceptor } from 'src/interceptors/response';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { MarketplaceModule } from 'src/marketplace/marketplace.module';
import { MarketplaceService } from 'src/marketplace/marketplace.service';

@Module({
  controllers: [VaultingController],
  providers: [
    VaultingService,
    MarketplaceService,
    MintNFTConsumer,
    BurnNFTConsumer,
    LockNFTConsumer,
    ExecConsumer,
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
  ],
  imports: [
    BlockchainModule,
    IPFSModule,
    MarketplaceModule,
    DatabaseModule,
    BullModule.forRoot(redisConfig(configuration()[process.env[RUNTIME_ENV]])),
    BullMintQueueModule,
    BullBurnQueueModule,
    BullLockQueueModule,
    BullExecQueueModule,
  ],
})
export class VaultingModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggerMiddleware).forRoutes('*');
  }
}
