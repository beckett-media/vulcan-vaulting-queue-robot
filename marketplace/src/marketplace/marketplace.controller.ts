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
  ApiParam,
  ApiProduces,
  ApiQuery,
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
  @ApiOperation({
    summary: 'LB health check',
  })
  health() {
    return;
  }

  @Get('/submission/:submission_id')
  @ApiOperation({
    summary: 'Get submission by id',
  })
  @ApiResponse({
    status: 200,
    description: 'Submission retrived',
    type: SubmissionDetails,
  })
  @ApiResponse({
    status: 404,
    description: 'Submission not found',
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
    summary: 'Update submission status by id (mainly used by admin)',
  })
  @ApiResponse({
    status: 200,
    description: 'Submission status updated',
    type: SubmissionDetails,
  })
  @ApiResponse({
    status: 404,
    description: 'Submission not found',
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
    summary: 'Get a list of submissions from the user',
  })
  @ApiQuery({
    name: 'status',
    type: String,
    description: 'Status of the submission',
    required: false,
  })
  @ApiQuery({
    name: 'offset',
    type: String,
    description: 'offset for the query',
    required: false,
  })
  @ApiQuery({
    name: 'limit',
    type: String,
    description: 'limit for the query',
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: "Returns a list of user's submissions",
    type: SubmissionDetails,
  })
  @ApiResponse({
    status: 500,
    description: 'Can not retrieve the list of submissions',
  })
  @ApiProduces('application/json')
  async listSubmissions(
    @Query('user_id') user_id: number,
    @Query('status') status: number,
    @Query('offset') offset: number,
    @Query('limit') limit: number,
  ): Promise<SubmissionDetails[]> {
    console.log(user_id, status, offset, limit);
    const result = await this.MarketplaceService.listSubmissions(
      user_id,
      status,
      offset,
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
    type: SubmissionResponse,
  })
  @ApiResponse({
    status: 500,
    description: 'Submission of the item failed',
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
