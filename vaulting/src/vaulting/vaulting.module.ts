import { BullModule, getQueueOptionsToken } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BurnNFTConsumer, MintNFTConsumer } from './vaulting.consumer';
import { VaultingController } from './vaulting.controller';
import { VaultingService } from './vaulting.service';
import configuration from './config/configuration';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Token, Vaulting } from './vaulting.entity';

@Module({
  controllers: [VaultingController],
  providers: [VaultingService, MintNFTConsumer, BurnNFTConsumer],
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: configuration()[process.env['runtime']]['db']['name'],
      entities: [Vaulting, Token],
      synchronize: configuration()[process.env['runtime']]['db']['sync'],
    }),
    TypeOrmModule.forFeature([Vaulting, Token]),
    BullModule.forRoot(configuration()[process.env['runtime']]),
    BullModule.registerQueue({
      name: configuration()[process.env['runtime']]['queue']['mint'],
      limiter: configuration()[process.env['runtime']]['queue']['limiter'],
    }),
    BullModule.registerQueue({
      name: configuration()[process.env['runtime']]['queue']['burn'],
      limiter: configuration()[process.env['runtime']]['queue']['limiter'],
    }),
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
    }),
  ],
})
export class VaultingModule {}
