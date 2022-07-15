import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class MintRequest {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  collection: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  owner: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  nft_record_uid: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  name: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  description: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  image_format: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  image: string;

  @ApiProperty()
  @IsString()
  animation_format: string;

  @ApiProperty()
  @IsString()
  animation: string;

  @ApiProperty()
  @IsOptional()
  attributes: { [key: string]: any };

  @IsString()
  @IsOptional()
  auth: string;
}

export class BurnRequest {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  collection: string;

  @ApiProperty()
  @IsNumber()
  token_id: number;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  nft_record_uid: string;

  @IsString()
  @IsOptional()
  auth: string;
}

export class MintJobStatus {
  @ApiProperty()
  @IsNumber()
  job_id: number;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  nft_record_uid: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  status: string;
}

export class BurnJobStatus {
  @ApiProperty()
  @IsNumber()
  job_id: number;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  collection: string;

  @ApiProperty()
  @IsNumber()
  token_id: number;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  nft_record_uid: string;

  @ApiProperty()
  @IsNumber()
  status: number;
}

export class MintStatus {
  @ApiProperty()
  @IsNumber()
  job_id: number;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  nft_redord_uid: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  collection: string;

  @ApiProperty()
  @IsNumber()
  token_id: number;

  @ApiProperty()
  @IsNumber()
  token_status: number;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  token_status_desc: string;

  @ApiProperty()
  @IsNumber()
  job_status: number;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  job_status_desc: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  tx_hash: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  error: string;
}

export class ForwardRequest {
  @ApiProperty()
  @IsString()
  @MinLength(40)
  from: string;

  @ApiProperty()
  @IsString()
  @MinLength(40)
  to: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  value: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  gas: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  nonce: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  data: string;

  @ApiProperty()
  @IsString()
  @MinLength(32)
  signature: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  collection: string;

  @ApiProperty()
  @IsNumber()
  token_id: number;
}

export class LockRequest {
  @ApiProperty()
  @IsString()
  @MinLength(40)
  collection: string;

  @ApiProperty()
  @IsNumber()
  token_id: number;

  @ApiProperty()
  @IsString()
  @MinLength(64)
  hash: string;

  @IsString()
  @IsOptional()
  auth: string;
}

export class JobSubmitResponse {
  @IsNumber()
  job_id: number;

  @IsString()
  @IsOptional()
  nft_record_uid: string;

  @IsNumber()
  @IsOptional()
  token_id: number;

  @IsString()
  @IsOptional()
  collection: string;

  @IsBoolean()
  processed: boolean;

  @IsNumber()
  status: number;

  @IsString()
  status_desc: string;

  constructor(partial: Partial<JobSubmitResponse>) {
    Object.assign(this, partial);
  }
}

export class JobStatusResponse {
  @IsNumber()
  job_id: number;

  @IsString()
  nft_record_uid: string;

  @IsString()
  collection: string;

  @IsNumber()
  token_id: number;

  @IsNumber()
  token_status: number;

  @IsString()
  token_status_desc: string;

  @IsNumber()
  job_status: number;

  @IsString()
  job_status_desc: string;

  @IsString()
  @IsOptional()
  tx_hash: string;

  @IsBoolean()
  processed: boolean;

  @IsString()
  @IsOptional()
  error: string;

  constructor(partial: Partial<JobStatusResponse>) {
    Object.assign(this, partial);
  }
}
