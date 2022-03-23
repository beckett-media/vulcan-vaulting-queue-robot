import { IsNumber, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class MintRequest {
  @ApiProperty()
  collection: string;

  @ApiProperty()
  owner: string;

  @ApiProperty()
  beckett_id: string;

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
  collection: string;

  @ApiProperty()
  id: number;
}

export class JobStatus {
  @ApiProperty()
  id: number;

  @ApiProperty()
  beckett_id: string;

  @ApiProperty()
  status: number;
}
