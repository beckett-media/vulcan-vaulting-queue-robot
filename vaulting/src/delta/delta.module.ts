import { HttpService } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/database/database.module';
import { DeltaService } from './delta.service';

@Module({
  providers: [DeltaService],
  imports: [DatabaseModule],
  exports: [DeltaService],
})
export class DeltaModule {}
