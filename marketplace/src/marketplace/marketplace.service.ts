import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { AwsService } from 'src/aws/aws.service';
import { BravoService } from 'src/bravo/bravo.service';
import {
  SubmissionStatus,
  SubmissionStatusReadable,
  VaultingStatus,
  VaultingStatusReadable,
} from 'src/config/enum';
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
  VaultingStatusUpdate,
} from './dtos/marketplace.dto';

@Injectable()
export class MarketplaceService {
  private readonly logger = new DetailedLogger('MarketplaceService', {
    timestamp: true,
  });

  constructor(
    private databaseService: DatabaseService,
    private awsService: AwsService,
    private bravoService: BravoService,
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
      user: request.user,
      submission_id: result.submission_id,
      item_id: result.item_id,
      status: result.status,
      status_desc: SubmissionStatusReadable[result.status],
    });
  }

  async listSubmissions(
    user: string,
    status: number,
    offset: number,
    limit: number,
  ): Promise<SubmissionDetails[]> {
    const submissionDetails = await this.databaseService.listSubmissions(
      user,
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
      const user = await this.databaseService.getUser(submission.user);
      return newSubmissionDetails(submission, item, user);
    }
  }

  async getSubmission(submission_id: number): Promise<SubmissionDetails> {
    const submission = await this.databaseService.getSubmission(submission_id);
    if (!submission) {
      throw new InternalServerErrorException('Submission not found');
    } else {
      const item = await this.databaseService.getItem(submission.item_id);
      const user = await this.databaseService.getUser(submission.user);
      return newSubmissionDetails(submission, item, user);
    }
  }

  async listVaultings(
    userUUID: string,
    offset: number,
    limit: number,
  ): Promise<VaultingDetails[]> {
    // get user by uuid
    const user = await this.databaseService.getUserByUUID(userUUID);
    if (!user) {
      throw new NotFoundException(`User not found for ${userUUID}`);
    }
    const vaultings = await this.databaseService.listVaultings(
      user.id,
      offset,
      limit,
    );
    // get item ids from vaultings
    const item_ids = vaultings.map((vaulting) => vaulting.item_id);
    // get user ids from vaultings
    const user_ids = vaultings.map((vaulting) => vaulting.user);
    // get item details from database
    const item_details = await this.databaseService.listItems(item_ids);
    // get user details from database
    const user_details = await this.databaseService.listUsers(user_ids);
    // create new vaulting details from vaultings and item details
    const vaultingDetails = vaultings.map((vaulting) => {
      const item = item_details.find((item) => item.id === vaulting.item_id);
      const user = user_details.find((user) => user.id === vaulting.user);
      return newVaultingDetails(vaulting, item, user);
    });
    return vaultingDetails;
  }

  // call by admin
  async newVaulting(request: VaultingRequest): Promise<VaultingResponse> {
    // TODO: don't allow multiple vaultings for the same item

    // get user by uuid
    const user = await this.databaseService.getUserByUUID(request.user);

    // get epoch time in seconds
    const mint_job_id = Math.floor(Date.now() / 1000);
    const vaulting = await this.databaseService.createNewVaulting(
      user.id,
      request.item_id,
      mint_job_id,
    );

    // update submission status
    await this.databaseService.updateSubmission(
      request.submission_id,
      SubmissionStatus.Vaulted,
    );

    /*
    await this.bravoService.mintNFT(
      request.user,
      request.title,
      result.uuid,
      result.submission_id,
      request.description,
      request.image_format,
      request.image_base64,
    );*/

    return new VaultingResponse({
      id: vaulting.id,
      user: user.uuid,
      item_id: vaulting.item_id,
      status: vaulting.status,
      status_desc: VaultingStatusReadable[vaulting.status],
    });
  }

  async withdrawVaulting(vaulting_id: number): Promise<VaultingDetails> {
    const vaultingDetails = await this.getVaulting(vaulting_id);

    // TODO: call bravo service to withdraw nft
    // bravo will callback updateVaulting()

    return vaultingDetails;
  }

  async getVaulting(vaulting_id: number): Promise<VaultingDetails> {
    const vaulting = await this.databaseService.getVaulting(vaulting_id);
    const item = await this.databaseService.getItem(vaulting.item_id);
    const user = await this.databaseService.getUser(vaulting.user);
    return newVaultingDetails(vaulting, item, user);
  }

  async updateVaulting(
    vaultingStatusUpdate: VaultingStatusUpdate,
  ): Promise<VaultingDetails> {
    const vaulting = await this.databaseService.updateVaulting(
      vaultingStatusUpdate,
    );
    const item = await this.databaseService.getItem(vaulting.item_id);
    const user = await this.databaseService.getUser(vaulting.user);
    return newVaultingDetails(vaulting, item, user);
  }
}
