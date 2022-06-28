import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { AwsService } from 'src/aws/aws.service';
import { SubmissionStatusReadable, VaultingStatus } from 'src/config/enum';
import { DatabaseService } from 'src/database/database.service';
import { DetailedLogger } from 'src/logger/detailed.logger';
import { newSubmissionDetails, newVaultingDetails } from 'src/util/format';
import {
  SubmissionDetails,
  SubmissionRequest,
  SubmissionResponse,
  VaultingDetails,
  VaultingRequest,
  VaultingResponse,
} from './dtos/marketplace.dto';

@Injectable()
export class MarketplaceService {
  private readonly logger = new DetailedLogger('MarketplaceService', {
    timestamp: true,
  });

  constructor(
    private databaseService: DatabaseService,
    private awsService: AwsService,
  ) {}

  async submitItem(request: SubmissionRequest): Promise<SubmissionResponse> {
    // convert request.image_base64 to buffer
    const image_buffer = Buffer.from(request.image_base64, 'base64');
    const s3URL = await this.awsService.uploadItemImage(
      image_buffer,
      'submission',
      request.image_format,
    );

    if (!s3URL) {
      throw new InternalServerErrorException('Image upload failed');
    }
    const result = await this.databaseService.createNewSubmission(
      request,
      s3URL,
    );
    return new SubmissionResponse({
      user_id: request.user_id,
      submission_id: result.submission_id,
      item_id: result.item_id,
      status: result.status,
      status_desc: SubmissionStatusReadable[result.status],
    });
  }

  async listSubmissions(
    user_id: number,
    status: number,
    offset: number,
    limit: number,
  ): Promise<SubmissionDetails[]> {
    const submissionDetails = await this.databaseService.listSubmissions(
      user_id,
      status,
      offset,
      limit,
    );
    return submissionDetails;
  }

  async updateSubmission(
    submission_id: number,
    status: number,
  ): Promise<SubmissionDetails> {
    const submission = await this.databaseService.updateSubmission(
      submission_id,
      status,
    );
    if (!submission) {
      throw new InternalServerErrorException('Submission not found');
    } else {
      const item = await this.databaseService.getItem(submission.item_id);
      return newSubmissionDetails(submission, item);
    }
  }

  async getSubmission(submission_id: number): Promise<SubmissionDetails> {
    const submission = await this.databaseService.getSubmission(submission_id);
    if (!submission) {
      throw new InternalServerErrorException('Submission not found');
    } else {
      const item = await this.databaseService.getItem(submission.item_id);
      return newSubmissionDetails(submission, item);
    }
  }

  async listVaultings(
    user_id: number,
    offset: number,
    limit: number,
  ): Promise<VaultingDetails[]> {
    const vaultings = await this.databaseService.listVaultings(
      user_id,
      offset,
      limit,
    );
    // get item ids from vaultings
    const item_ids = vaultings.map((vaulting) => vaulting.item_id);
    // get item details from database
    const item_details = await this.databaseService.listItems(item_ids);
    // create new vaulting details from vaultings and item details
    const vaultingDetails = vaultings.map((vaulting) => {
      const item = item_details.find((item) => item.id === vaulting.item_id);
      return newVaultingDetails(vaulting, item);
    });
    return vaultingDetails;
  }

  async newVaulting(request: VaultingRequest): Promise<VaultingResponse> {
    const vaulting = await this.databaseService.createNewVaulting(
      request.user_id,
      request.submission_id,
      request.item_id,
      request.collection,
      request.token_id,
    );
    return new VaultingResponse({
      id: vaulting.id,
      user_id: vaulting.user_id,
      submission_id: vaulting.submission_id,
      item_id: vaulting.item_id,
      collection: vaulting.collection,
      token_id: vaulting.token_id,
    });
  }

  async withdrawVaulting(vaulting_id: number): Promise<VaultingDetails> {
    const vaultingDetails = await this.updateVaulting(
      vaulting_id,
      VaultingStatus.Withdrawing,
    );

    return vaultingDetails;
  }

  async getVaulting(vaulting_id: number): Promise<VaultingDetails> {
    const vaulting = await this.databaseService.getVaulting(vaulting_id);
    const item = await this.databaseService.getItem(vaulting.item_id);
    return newVaultingDetails(vaulting, item);
  }

  async updateVaulting(
    vaulting_id: number,
    status: number,
  ): Promise<VaultingDetails> {
    const vaulting = await this.databaseService.updateVaulting(
      vaulting_id,
      status,
    );
    const item = await this.databaseService.getItem(vaulting.item_id);
    return newVaultingDetails(vaulting, item);
  }
}
