import { IsNumber, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class MintRequest {
  @ApiProperty()
  collection: string;

  @ApiProperty()
  owner: string;

  @ApiProperty()
  beckett_id: number;

  @ApiProperty()
  name: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  image_format: string;

  @ApiProperty()
  image: string;
}

export class BurnRequest {
  @ApiProperty()
  address: string;

  @ApiProperty()
  id: number;
}

export class JobStatus {
  @ApiProperty()
  id: number;

  @ApiProperty()
  beckett_id: number;

  @ApiProperty()
  status: number;
}
