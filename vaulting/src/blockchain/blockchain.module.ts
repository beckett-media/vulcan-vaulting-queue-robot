import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from 'src/config/configuration';
import { BlockchainService } from './blockchain.service';

@Module({
  providers: [BlockchainService],
  imports: [],
  exports: [BlockchainService],
})
export class BlockchainModule {}
