import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiProduces,
  ApiTags,
} from '@nestjs/swagger';
import {
  BurnRequest,
  JobSubmit,
  JobStatus,
  MintRequest,
} from './dtos/vaulting.dto';
import { JobResult, JobResultReadable } from './vaulting.consumer';
import { VaultingService } from './vaulting.service';

@Controller('vaulting')
export class VaultingController {
  constructor(public VaultingService: VaultingService) {}

  @Get('/mint/:job_id')
  @ApiOperation({
    summary: 'Get NFT minting job status',
  })
  @ApiResponse({
    status: 200,
    type: JobStatus,
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
    type: JobSubmit,
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
      beckett_id: body.beckett_id,
      status: JobResultReadable[JobResult.JobReceived],
    };
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
  async burnNFT(@Body() body: BurnRequest) {
    const job = await this.VaultingService.burnNFT(body);
    return { id: job.id, beckett_id: 0, status: 0 };
  }
}
