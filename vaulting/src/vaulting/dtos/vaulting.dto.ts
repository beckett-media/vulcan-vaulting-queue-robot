import { IsNotEmpty, IsNumber, IsString, MinLength } from 'class-validator';
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
  @IsString()
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
