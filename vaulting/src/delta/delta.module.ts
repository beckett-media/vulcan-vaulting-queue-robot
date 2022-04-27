import { HttpService } from '@nestjs/axios';
import { Module } from '@nestjs/common';
//import { DatabaseService } from 'src/database/database.service';
import { DeltaService } from './delta.service';

@Module({
  providers: [DeltaService],
  imports: [],
  exports: [DeltaService],
})
export class DeltaModule {}
