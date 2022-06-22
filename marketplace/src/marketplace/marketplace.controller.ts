import {
  BadRequestException,
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiExcludeEndpoint,
  ApiOperation,
  ApiProduces,
  ApiResponse,
} from '@nestjs/swagger';
import configuration from 'src/config/configuration';

import {
  SubmissionDetails,
  SubmissionRequest,
  SubmissionResponse,
  SubmissionStatusUpdate,
} from './dtos/marketplace.dto';
import { MarketplaceService } from './marketplace.service';

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

@Controller('marketplace')
@UseInterceptors(ClassSerializerInterceptor)
export class MarketplaceController {
  constructor(public MarketplaceService: MarketplaceService) {}

  @Get('/health')
  health() {
    return;
  }

  @Get('/submission/:submission_id')
  @ApiOperation({
    summary: 'Get submission by id',
  })
  @ApiResponse({
    status: 200,
    description: '',
  })
  @ApiResponse({
    status: 404,
    description: '',
  })
  @ApiProduces('application/json')
  async getSubmission(
    @Param('submission_id') submission_id: number,
  ): Promise<SubmissionDetails> {
    const submissionDetails = await this.MarketplaceService.getSubmission(
      submission_id,
    );
    return submissionDetails;
  }

  @Put('/submission/:submission_id')
  @ApiOperation({
    summary: 'Get submission by id',
  })
  @ApiResponse({
    status: 200,
    description: '',
  })
  @ApiResponse({
    status: 404,
    description: '',
  })
  @ApiProduces('application/json')
  async updateSubmission(
    @Body() body: SubmissionStatusUpdate,
    @Param('submission_id') submission_id: number,
  ): Promise<SubmissionDetails> {
    const submissionDetails = await this.MarketplaceService.updateSubmission(
      submission_id,
      body.status,
    );
    return submissionDetails;
  }

  @Get('/submission')
  @ApiOperation({
    summary: 'Get a list of submissions for user',
  })
  @ApiResponse({
    status: 201,
    description: "Returns a list of user's submissions",
  })
  @ApiResponse({
    status: 500,
    description: 'Can not retrieve the list of submissions',
  })
  @ApiProduces('application/json')
  async listSubmissions(
    @Query('user_id') user_id: number,
    @Query('start_at') start_at: number,
    @Query('limit') limit: number,
  ): Promise<SubmissionDetails[]> {
    const result = await this.MarketplaceService.listSubmissions(
      user_id,
      start_at,
      limit,
    );
    return result;
  }

  @Post('/submission')
  @ApiOperation({
    summary: 'Submit new item to marketplace',
  })
  @ApiResponse({
    status: 201,
    description: 'The item has been successfully submited.',
  })
  @ApiResponse({
    status: 500,
    description: 'Submission of the item is failed',
  })
  @ApiProduces('application/json')
  async submitItem(
    @Body() body: SubmissionRequest,
  ): Promise<SubmissionResponse> {
    console.log(body);
    const submissionResponse = await this.MarketplaceService.submitItem(body);
    return submissionResponse;
  }
}
