import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiProduces, ApiResponse } from '@nestjs/swagger';
import { BurnJobResult, MintJobResult } from '../config/enum';

import {
  BurnJobStatus,
  BurnRequest,
  MintJobStatus,
  MintRequest,
  MintStatus,
} from './dtos/vaulting.dto';
import { VaultingService } from './vaulting.service';

@Controller('vaulting')
export class VaultingController {
  constructor(public VaultingService: VaultingService) {}

  @Get('/health')
  health() {
    return;
  }

  @Get('/mint/:job_id')
  @ApiOperation({
    summary: 'Get NFT minting job status',
  })
  @ApiResponse({
    status: 200,
    type: MintStatus,
    description: 'Return status of NFT minting job',
  })
  @ApiResponse({
    status: 404,
    description: 'Can not find minting job',
  })
  @ApiProduces('application/json')
  async mintStatus(@Param('job_id') job_id: number) {
    const jobStatus = await this.VaultingService.mintJobStatus(job_id);
    return jobStatus;
  }

  @Post('/mint')
  @ApiOperation({
    summary: 'Put a NFT mint request into the NFT mint queue',
  })
  @ApiResponse({
    status: 201,
    type: MintJobStatus,
    description: 'The NFT has been successfully authenticated.',
  })
  @ApiResponse({
    status: 500,
    description: 'Submission of NFT minting job is failed',
  })
  @ApiProduces('application/json')
  async mintNFT(@Body() body: MintRequest) {
    const job = await this.VaultingService.mintNFT(body);
    return {
      job_id: Number(job.id),
      beckett_id: body.nft_record_uid,
      processed: false,
      status: MintJobResult.JobReceived,
    };
  }

  @Get('/burn/:job_id')
  @ApiOperation({
    summary: 'Get NFT burning job status',
  })
  @ApiResponse({
    status: 200,
    type: BurnJobStatus,
    description: 'Return status of NFT burning job',
  })
  @ApiResponse({
    status: 404,
    description: 'Can not find burning job',
  })
  @ApiProduces('application/json')
  async burnStatus(@Param('job_id') job_id: number) {
    const jobStatus = await this.VaultingService.burnJobStatus(job_id);
    return jobStatus;
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
  async burnNFT(@Body() body: BurnRequest) {
    const job = await this.VaultingService.burnNFT(body);
    return {
      id: job.id,
      nft_record_uid: body.nft_record_uid,
      collection: body.collection.toLowerCase(),
      token_id: body.token_id,
      processed: false,
      status: BurnJobResult.JobReceived,
    };
  }
}
