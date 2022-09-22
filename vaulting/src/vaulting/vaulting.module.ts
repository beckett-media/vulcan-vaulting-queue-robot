import { BullModule } from '@nestjs/bull';
import Redis from 'ioredis';
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
  DummyConsumer,
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
  BullDummyQueueModule,
} from '../queue/queue.module';
import { RequestLoggerMiddleware } from '../middleware/logger';
import { ResponseInterceptor } from '../interceptors/response';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { MarketplaceModule } from '../marketplace/marketplace.module';
import { MarketplaceService } from '../marketplace/marketplace.service';

@Module({
  controllers: [VaultingController],
  providers: [
    VaultingService,
    MarketplaceService,
    MintNFTConsumer,
    BurnNFTConsumer,
    LockNFTConsumer,
    ExecConsumer,
    DummyConsumer,
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
    BullModule.forRoot({
      createClient: () => {
        const runtime = process.env[RUNTIME_ENV];
        const config = redisConfig(configuration()[runtime]);
        // if runtime in ['test', 'dev'], use normal redis
        // otherwise use redis cluster
        if (runtime === 'test' || runtime === 'dev') {
          return new Redis(config['redis']['host'], config['redis']['port'], {
            maxRetriesPerRequest: null,
            enableReadyCheck: false,
          });
        } else {
          return new Redis.Cluster(
            [
              {
                host: config['redis']['host'],
                port: config['redis']['port'],
              },
            ],
            {
              dnsLookup: (address, callback) => callback(null, address),
              redisOptions: {
                tls: {},
              },
            },
          );
        }
      },
    }),
    BullMintQueueModule,
    BullBurnQueueModule,
    BullLockQueueModule,
    BullExecQueueModule,
    BullDummyQueueModule,
  ],
})
export class VaultingModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggerMiddleware).forRoutes('*');
  }
}
