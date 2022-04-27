import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BlockchainModule } from 'src/blockchain/blockchain.module';
import configuration from 'src/config/configuration';
import { DatabaseModule } from 'src/database/database.module';
import { DeltaModule } from 'src/delta/delta.module';
import { WebhooksController } from './webhooks.controller';
import { WebhooksService } from './webhooks.service';

@Module({
  controllers: [WebhooksController],
  providers: [WebhooksService],
  imports: [
    DatabaseModule,
    BlockchainModule,
    DeltaModule,
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
    }),
  ],
})
export class WebhooksModule {}
