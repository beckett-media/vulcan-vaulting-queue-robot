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

export class JobSubmit {
  @ApiProperty()
  job_id: number;

  @ApiProperty()
  beckett_id: string;

  @ApiProperty()
  status: string;
}

export class JobStatus {
  @ApiProperty()
  job_id: number;

  @ApiProperty()
  beckett_id: string;

  @ApiProperty()
  collection: string;

  @ApiProperty()
  token_id: number;

  @ApiProperty()
  token_status: number;

  @ApiProperty()
  token_status_desc: string;

  @ApiProperty()
  job_status: number;

  @ApiProperty()
  job_status_desc: string;

  @ApiProperty()
  tx_hash: string;

  @ApiProperty()
  error: string;
}
