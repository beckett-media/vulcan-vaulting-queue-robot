import { Module } from '@nestjs/common';
import { BravoController } from './bravo.controller';
import { BravoService } from './bravo.service';

@Module({
  controllers: [BravoController],
  providers: [BravoService]
})
export class BravoModule {}
