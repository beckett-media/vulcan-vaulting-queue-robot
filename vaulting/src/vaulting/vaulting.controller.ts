import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiProduces,
  ApiTags,
} from '@nestjs/swagger';
import { BurnRequest, JobStatus, MintRequest } from './dtos/vaulting.dto';
import {
  VaultingBurningService,
  VaultingMintingService,
} from './vaulting.service';

@Controller('vaulting')
export class VaultingController {
  constructor(
    public VaultingMintingService: VaultingMintingService,
    public VaultBurningService: VaultingBurningService,
  ) {}

  @Get('/mint/:id')
  @ApiOperation({
    summary: 'Get NFT minting job status',
  })
  @ApiResponse({
    status: 200,
    type: JobStatus,
    description: 'Return status of NFT minting job',
  })
  @ApiProduces('application/json')
  async mintStatus(@Param('id') id: number) {
    const jobStatus = await this.VaultingMintingService.mintJobStatus(id);
    return jobStatus;
  }

  @Post('/mint')
  @ApiOperation({
    summary: 'Put a NFT mint request into the NFT mint queue',
  })
  @ApiResponse({
    status: 201,
    description: 'The NFT has been successfully authenticated.',
  })
  @ApiResponse({
    status: 500,
    description: 'Submission of NFT minting job is failed',
  })
  @ApiProduces('application/json')
  async mintNFT(@Body() body: MintRequest) {
    const job = await this.VaultingMintingService.mintNFT(body);
    return { id: job.id, beckett_id: body.beckett_id, status: 0 };
  }

  @Get('/burn/:id')
  @ApiOperation({
    summary: 'Get NFT burning job status',
  })
  @ApiResponse({
    status: 200,
    type: JobStatus,
    description: 'Return status of NFT burning job',
  })
  @ApiProduces('application/json')
  burnStatus() {
    return { id: 111, beckett_id: 222, status: 333 };
  }

  @Post('/burn')
  @ApiOperation({
    summary: 'Put a NFT burn request into the NFT burn queue',
  })
  @ApiResponse({
    status: 201,
    description: 'The NFT burning job is successfully submitted.',
  })
  @ApiResponse({
    status: 500,
    description: 'Submission of NFT burnning job is failed',
  })
  @ApiProduces('application/json')
  burnNFT(@Body() body: BurnRequest) {
    return { id: 1111, beckett_id: 2222, status: 3333 };
  }
}
