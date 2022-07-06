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
  @ApiProperty({
    description: 'The user who submitted the item',
    required: true,
  })
  @IsString()
  @MinLength(1)
  user: string;

  @ApiProperty({
    description: 'The grading company of the submitted the item',
    required: true,
  })
  @IsString()
  grading_company: string;

  @ApiProperty({
    description: 'The serial number of the submitted the item',
    required: true,
  })
  @IsString()
  serial_number: string;

  @ApiProperty({
    description: 'The title of the submitted the item',
    required: true,
  })
  @IsString()
  title: string;

  @ApiProperty({
    description: 'The description of the submitted the item',
    required: true,
  })
  @IsString()
  description: string;

  @ApiProperty({
    description: 'The genre of the submitted the item',
    required: true,
  })
  @IsString()
  genre: string;

  @ApiProperty({
    description: 'The manufacturer of the submitted the item',
    required: true,
  })
  @IsString()
  @MinLength(0)
  manufacturer: string;

  @ApiProperty({
    description: 'The year of the submitted the item',
    required: true,
  })
  @IsNumber()
  year: number;

  @ApiProperty({
    description: 'The overall grade of the submitted the item',
    required: true,
  })
  @IsString()
  overall_grade: string;

  @ApiProperty({
    description: 'The sub grades of the submitted the item',
    required: true,
  })
  @IsString()
  sub_grades: string;

  @ApiProperty({
    description: 'The autograph of the submitted the item',
    required: true,
  })
  @IsString()
  @IsOptional()
  @MinLength(0)
  autograph: string;

  @ApiProperty({
    description: 'The subject of the submitted the item',
    required: true,
  })
  @IsString()
  subject: string;

  @ApiProperty({
    description: "The base64 encoding of the submitted the item's image ",
    required: true,
  })
  @IsString()
  image_base64: string;

  @ApiProperty({
    description: 'The image format  of the submitted the item',
    required: true,
  })
  @IsString()
  image_format: string;

  constructor(partial: Partial<SubmissionRequest>) {
    Object.assign(this, partial);
  }
}

export class SubmissionResponse {
  @ApiProperty({
    description: 'The uuid of the user who submitted the item',
    required: true,
  })
  @IsNumber()
  user: string;

  @ApiProperty({
    description: 'The  of the submitted the item',
    required: true,
  })
  @IsNumber()
  submission_id: number;

  @ApiProperty({
    description: 'The id of the submission',
    required: true,
  })
  @IsNumber()
  item_id: number;

  @ApiProperty({
    description: 'The uuid of the submission',
    required: true,
  })
  @IsString()
  item_uuid: string;

  @ApiProperty({
    description: 'The status of the submitted the item',
    required: true,
  })
  @IsNumber()
  status: number;

  @ApiProperty({
    description: 'The description of the status of the submitted the item',
    required: true,
  })
  @IsString()
  status_desc: string;

  constructor(partial: Partial<SubmissionResponse>) {
    Object.assign(this, partial);
  }
}

export class SubmissionDetails {
  @ApiProperty({
    description: 'The id of the submission',
    required: true,
  })
  @IsNumber()
  submission_id: number;

  @ApiProperty({
    description: 'The uuid of the user who submitted the item',
    required: true,
  })
  @IsNumber()
  user: string;

  @ApiProperty({
    description: 'The timestamp of the creation of the submission',
    required: true,
  })
  @IsNumber()
  created_at: number;

  @ApiProperty({
    description: 'The timestamp of the receipt of the item',
    required: true,
  })
  @IsNumber()
  received_at: number;

  @ApiProperty({
    description: 'The timestamp of the approval of submitted the item',
    required: true,
  })
  @IsNumber()
  approved_at: number;

  @ApiProperty({
    description: 'The timestamp of the rejection of submitted the item',
    required: true,
  })
  @IsNumber()
  rejected_at: number;

  @ApiProperty({
    description: 'The current status of the submitted the item',
    required: true,
  })
  @IsNumber()
  status: number;

  @ApiProperty({
    description: 'The description of current status of the submitted the item',
    required: true,
  })
  @IsString()
  @MinLength(1)
  status_desc: string;

  @ApiProperty({
    description: 'The grading company of the submitted the item',
    required: true,
  })
  @IsString()
  @MinLength(1)
  grading_company: string;

  @ApiProperty({
    description: 'The serial number of the submitted the item',
    required: true,
  })
  @IsString()
  @MinLength(1)
  serial_number: string;

  @ApiProperty({
    description: 'The title of the submitted the item',
    required: true,
  })
  @IsString()
  @MinLength(1)
  title: string;

  @ApiProperty({
    description: 'The description of the submitted the item',
    required: true,
  })
  @IsString()
  @MinLength(1)
  description: string;

  @ApiProperty({
    description: 'The genre of the submitted the item',
    required: true,
  })
  @IsString()
  @MinLength(1)
  genre: string;

  @ApiProperty({
    description: 'The manufacturer of the submitted the item',
    required: true,
  })
  @IsString()
  @MinLength(1)
  manufacturer: string;

  @ApiProperty({
    description: 'The year of the submitted the item',
    required: true,
  })
  @IsString()
  @MinLength(1)
  year: number;

  @ApiProperty({
    description: 'The overall grade of the submitted the item',
    required: true,
  })
  @IsString()
  overall_grade: string;

  @ApiProperty({
    description: 'The sub grades of the submitted the item',
    required: true,
  })
  @IsString()
  sub_grades: string;

  @ApiProperty({
    description: 'The autograph of the submitted the item',
    required: true,
  })
  @IsString()
  @IsOptional()
  autograph: string;

  @ApiProperty({
    description: 'The subject of the submitted the item',
    required: true,
  })
  @IsString()
  @IsOptional()
  subject: string;

  @ApiProperty({
    description: 'The image url of the submitted the item',
    required: true,
  })
  @IsString()
  @IsOptional()
  submission_image: string;

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
    description: 'The uuid of the user who is vaulting the item',
    example: 1,
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  user: string;

  @ApiProperty({
    description: 'The id of the submission from which the item is vaulted',
    example: 1,
    required: true,
  })
  @IsNotEmpty()
  @IsNumber()
  submission_id: number;

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
    description: 'The uuid of the item to vault',
    example: 1,
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  item_uuid: string;

  @ApiProperty({
    description: 'The uuid of the user who is vaulting the item',
    example: 1,
    required: true,
  })
  @IsNotEmpty()
  @IsNumber()
  user: string;

  @ApiProperty({
    description: 'The status of the vaulted item',
    example: 1,
    required: true,
  })
  @IsNotEmpty()
  @IsNumber()
  status: number;

  @ApiProperty({
    description: 'The description of the status of the vaulted item',
    example: 1,
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  status_desc: number;

  constructor(partial: Partial<VaultingResponse>) {
    Object.assign(this, partial);
  }
}

export class VaultingDetails {
  @ApiProperty()
  @IsNumber()
  id: number;

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
  user: string;

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

export class VaultingStatusUpdate {
  @ApiProperty()
  @IsString()
  item_uuid: string;

  @ApiProperty()
  @IsString()
  collection: string;

  @ApiProperty()
  @IsNumber()
  token_id: number;

  @ApiProperty()
  @IsNumber()
  status: number;

  constructor(partial: Partial<VaultingStatusUpdate>) {
    Object.assign(this, partial);
  }
}
