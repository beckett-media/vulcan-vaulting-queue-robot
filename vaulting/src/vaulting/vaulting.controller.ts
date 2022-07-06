import {
  BadRequestException,
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  Param,
  Post,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiExcludeEndpoint,
  ApiOperation,
  ApiProduces,
  ApiResponse,
} from '@nestjs/swagger';
import configuration from 'src/config/configuration';
import { serviceConfig as blockchainConfig } from 'src/blockchain/blockchain.service.config';
import {
  BurnJobResult,
  BurnJobResultReadable,
  ExecJobResult,
  ExecJobResultReadable,
  LockJobResult,
  LockJobResultReadable,
  MintJobResult,
  MintJobResultReadable,
  TokenStatusReadable,
} from '../config/enum';

import {
  BurnJobStatus,
  BurnRequest,
  ForwardRequest,
  JobStatusResponse,
  JobSubmitResponse,
  LockRequest,
  MintJobStatus,
  MintRequest,
  MintStatus,
} from './dtos/vaulting.dto';
import { VaultingService } from './vaulting.service';

function InProd() {
  return 'prod' == process.env.runtime;
}

function check_auth(request: any) {
  const should_check_auth =
    configuration()[process.env['runtime']]['check_palantir_request_auth'];
  const auth = configuration()[process.env['runtime']]['palantir_request_auth'];
  if (should_check_auth) {
    return request.auth == auth;
  } else {
    return true;
  }
}

@Controller('vaulting')
@UseInterceptors(ClassSerializerInterceptor)
export class VaultingController {
  constructor(public VaultingService: VaultingService) {}

  @Get('/health')
  health() {
    return { status: 'ok' };
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
  async mintStatus(
    @Param('job_id') job_id: number,
  ): Promise<JobStatusResponse> {
    const jobStatus = await this.VaultingService.mintJobStatus(job_id);
    return new JobStatusResponse(jobStatus);
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
  async mintNFT(@Body() body: MintRequest): Promise<JobSubmitResponse> {
    if (!check_auth(body)) {
      throw new BadRequestException('Auth fields missing');
    }

    // Check if the collection's ABI is known
    if (!blockchainConfig.NftContractType[body.collection.toLowerCase()]) {
      throw new BadRequestException(
        `Collection ${body.collection} is not supported: ABI unknown`,
      );
    }

    const job = await this.VaultingService.mintNFT(body);
    return new JobSubmitResponse({
      job_id: Number(job.id),
      collection: body.collection.toLowerCase(),
      nft_record_uid: body.nft_record_uid,
      processed: false,
      status: MintJobResult.JobReceived,
      status_desc: MintJobResultReadable[MintJobResult.JobReceived],
    });
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
  async burnStatus(
    @Param('job_id') job_id: number,
  ): Promise<JobStatusResponse> {
    const jobStatus = await this.VaultingService.burnJobStatus(job_id);
    return new JobStatusResponse(jobStatus);
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
  async burnNFT(@Body() body: BurnRequest): Promise<JobSubmitResponse> {
    if (!check_auth(body)) {
      throw new BadRequestException('Auth fields missing');
    }
    // Check if the collection's ABI is known
    if (!blockchainConfig.NftContractType[body.collection.toLowerCase()]) {
      throw new BadRequestException(
        `Collection ${body.collection} is not supported: ABI unknown`,
      );
    }
    const job = await this.VaultingService.burnNFT(body);
    return new JobSubmitResponse({
      job_id: Number(job.id),
      nft_record_uid: body.nft_record_uid,
      collection: body.collection.toLowerCase(),
      token_id: body.token_id,
      processed: false,
      status: BurnJobResult.JobReceived,
      status_desc: BurnJobResultReadable[BurnJobResult.JobReceived],
    });
  }

  @Get('/lock/:job_id')
  @ApiExcludeEndpoint(InProd())
  @ApiOperation({
    summary: 'Get NFT locking job status',
  })
  @ApiResponse({
    status: 200,
    type: MintStatus,
    description: 'Return status of NFT locking job',
  })
  @ApiResponse({
    status: 404,
    description: 'Can not find locking job',
  })
  @ApiProduces('application/json')
  async lockStatus(
    @Param('job_id') job_id: number,
  ): Promise<JobStatusResponse> {
    const jobStatus = await this.VaultingService.lockJobStatus(job_id);
    return new JobStatusResponse(jobStatus);
  }

  @Post('/lock')
  @ApiExcludeEndpoint(InProd())
  @ApiOperation({
    summary: 'Lock a NFT token with the retrieval manager',
  })
  @ApiResponse({
    status: 201,
    description: 'The NFT locking job is successfully submitted.',
  })
  @ApiResponse({
    status: 500,
    description: 'Submission of NFT locking job is failed',
  })
  @ApiProduces('application/json')
  async lockNFT(@Body() body: LockRequest): Promise<JobSubmitResponse> {
    const job = await this.VaultingService.lockNFT(body);
    return new JobSubmitResponse({
      job_id: Number(job.id),
      collection: body.collection,
      token_id: body.token_id,
      processed: false,
      status: LockJobResult.JobReceived,
      status_desc: LockJobResultReadable[LockJobResult.JobReceived],
    });
  }

  @Post('/execute')
  @ApiOperation({
    summary: 'Submit gas-less transaction to trusted forwarder for execution.',
  })
  @ApiResponse({
    status: 201,
    description:
      'The gas-less transaction for execution is submitted successfully',
  })
  @ApiResponse({
    status: 500,
    description: 'Submission for gas-less transaction failed',
  })
  @ApiProduces('application/json')
  async execute(@Body() body: ForwardRequest): Promise<JobSubmitResponse> {
    const job = await this.VaultingService.execute(body);
    return new JobSubmitResponse({
      job_id: Number(job.id),
      processed: false,
      status: ExecJobResult.JobReceived,
      status_desc: ExecJobResultReadable[ExecJobResult.JobReceived],
    });
  }

  @Get('/execute/:job_id')
  @ApiOperation({
    summary: 'Get execution job status',
  })
  @ApiResponse({
    status: 200,
    type: MintStatus,
    description: 'Return status of execution job',
  })
  @ApiResponse({
    status: 404,
    description: 'Can not find execution job',
  })
  @ApiProduces('application/json')
  async execStatus(
    @Param('job_id') job_id: number,
  ): Promise<JobStatusResponse> {
    const jobStatus = await this.VaultingService.execJobStatus(job_id);
    return new JobStatusResponse(jobStatus);
  }
}
