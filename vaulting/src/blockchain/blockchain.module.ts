import { Module } from '@nestjs/common';
import { BlockchainService } from './blockchain.service';

@Module({
  providers: [BlockchainService],
  imports: [],
  exports: [BlockchainService],
})
export class BlockchainModule {}
