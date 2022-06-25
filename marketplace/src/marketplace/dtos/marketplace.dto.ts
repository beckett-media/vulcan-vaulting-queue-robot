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

export class SubmissionRequest {
  @ApiProperty()
  @IsNumber()
  user_id: number;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  grading_company: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  serial_number: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  title: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  description: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  genre: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  manufacturer: string;

  @ApiProperty()
  @IsNumber()
  year: number;

  @ApiProperty()
  @IsString()
  overall_grade: string;

  @ApiProperty()
  @IsString()
  sub_grades: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  autograph: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  subject: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  image_base64: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  image_format: string;

  constructor(partial: Partial<SubmissionRequest>) {
    Object.assign(this, partial);
  }
}

export class SubmissionResponse {
  @ApiProperty()
  @IsNumber()
  user_id: number;

  @ApiProperty()
  @IsNumber()
  submission_id: number;

  @ApiProperty()
  @IsNumber()
  item_id: number;

  @ApiProperty()
  @IsNumber()
  status: number;

  @ApiProperty()
  @IsString()
  status_desc: string;

  constructor(partial: Partial<SubmissionResponse>) {
    Object.assign(this, partial);
  }
}

export class SubmissionDetails {
  @ApiProperty()
  @IsNumber()
  submission_id: number;

  @ApiProperty()
  @IsNumber()
  user_id: number;

  @ApiProperty()
  @IsNumber()
  created_at: number;

  @ApiProperty()
  @IsNumber()
  received_at: number;

  @ApiProperty()
  @IsNumber()
  minted_at: number;

  @ApiProperty()
  @IsNumber()
  status: number;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  status_desc: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  grading_company: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  serial_number: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  title: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  description: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  genre: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  manufacturer: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  year: number;

  @ApiProperty()
  @IsString()
  overall_grade: string;

  @ApiProperty()
  @IsString()
  sub_grades: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  autograph: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  subject: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  image: string;

  constructor(partial: Partial<SubmissionDetails>) {
    Object.assign(this, partial);
  }
}

export class SubmissionStatusUpdate {
  @ApiProperty()
  @IsNumber()
  status: number;

  constructor(partial: Partial<SubmissionStatusUpdate>) {
    Object.assign(this, partial);
  }
}

export class VaultingRequest {
  @ApiProperty({
    description: 'The id of the item to vault',
    example: 1,
    required: true,
  })
  @IsNotEmpty()
  @IsNumber()
  item_id: number;

  @ApiProperty({
    description: 'The id of the user who is vaulting the item',
    example: 1,
    required: true,
  })
  @IsNotEmpty()
  @IsNumber()
  user_id: number;

  @ApiProperty({
    description: 'The id of the submission from which the item is vaulted',
    example: 1,
    required: true,
  })
  @IsNotEmpty()
  @IsNumber()
  submission_id: number;

  @ApiProperty({
    description: 'The collection of the minted NFT',
    example: '0x1234567890123456789012345678901234567890',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  collection: string;

  @ApiProperty({
    description: 'The id of the minted NFT',
    example: 1,
    required: true,
  })
  @IsNotEmpty()
  @IsNumber()
  token_id: number;

  constructor(partial: Partial<VaultingRequest>) {
    Object.assign(this, partial);
  }
}

export class VaultingResponse {
  @ApiProperty({
    description: 'The id of the vaulting',
    example: 1,
    required: true,
  })
  @IsNotEmpty()
  @IsNumber()
  id: number;

  @ApiProperty({
    description: 'The id of the item to vault',
    example: 1,
    required: true,
  })
  @IsNotEmpty()
  @IsNumber()
  item_id: number;

  @ApiProperty({
    description: 'The id of the user who is vaulting the item',
    example: 1,
    required: true,
  })
  @IsNotEmpty()
  @IsNumber()
  user_id: number;

  @ApiProperty({
    description: 'The id of the submission from which the item is vaulted',
    example: 1,
    required: true,
  })
  @IsNotEmpty()
  @IsNumber()
  submission_id: number;

  @ApiProperty({
    description: 'The collection of the minted NFT',
    example: '0x1234567890123456789012345678901234567890',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  collection: string;

  @ApiProperty({
    description: 'The id of the minted NFT',
    example: 1,
    required: true,
  })
  @IsNotEmpty()
  @IsNumber()
  token_id: number;

  constructor(partial: Partial<VaultingResponse>) {
    Object.assign(this, partial);
  }
}

export class VaultingDetails {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  collection: string;

  @ApiProperty()
  @IsNumber()
  token_id: number;

  @ApiProperty()
  @IsNumber()
  submission_id: number;

  @ApiProperty()
  @IsNumber()
  user_id: number;

  @ApiProperty()
  @IsNumber()
  created_at: number;

  @ApiProperty()
  @IsNumber()
  received_at: number;

  @ApiProperty()
  @IsNumber()
  minted_at: number;

  @ApiProperty()
  @IsNumber()
  status: number;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  status_desc: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  grading_company: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  serial_number: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  title: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  description: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  genre: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  manufacturer: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  year: number;

  @ApiProperty()
  @IsString()
  overall_grade: string;

  @ApiProperty()
  @IsString()
  sub_grades: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  autograph: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  subject: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  image: string;

  constructor(partial: Partial<VaultingDetails>) {
    Object.assign(this, partial);
  }
}
