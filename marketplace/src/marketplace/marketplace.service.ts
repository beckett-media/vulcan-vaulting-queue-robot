import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { AwsService } from 'src/aws/aws.service';
import { SubmissionStatusReadable } from 'src/config/enum';
import { DatabaseService } from 'src/database/database.service';
import { DetailedLogger } from 'src/logger/detailed.logger';
import {
  SubmissionDetails,
  SubmissionRequest,
  SubmissionResponse,
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
      return new SubmissionDetails({
        user_id: submission.user_id,
        created_at: submission.created_at,
        received_at: submission.received_at,
        minted_at: submission.minted_at,
        status: submission.status,
        status_desc: SubmissionStatusReadable[submission.status],
        grading_company: item.grading_company,
        serial_number: item.serial_number,
        title: item.title,
        description: item.description,
        genre: item.genre,
        manufacturer: item.manufacturer,
        year: item.year,
        overall_grade: item.overall_grade,
        sub_grades: item.sub_grades,
        autograph: item.autograph,
        subject: item.subject,
        image: item.image,
      });
    }
  }

  async getSubmission(submission_id: number): Promise<SubmissionDetails> {
    const submission = await this.databaseService.getSubmission(submission_id);
    if (!submission) {
      throw new InternalServerErrorException('Submission not found');
    } else {
      const item = await this.databaseService.getItem(submission.item_id);
      return new SubmissionDetails({
        user_id: submission.user_id,
        created_at: submission.created_at,
        received_at: submission.received_at,
        minted_at: submission.minted_at,
        status: submission.status,
        status_desc: SubmissionStatusReadable[submission.status],
        grading_company: item.grading_company,
        serial_number: item.serial_number,
        title: item.title,
        description: item.description,
        genre: item.genre,
        manufacturer: item.manufacturer,
        year: item.year,
        overall_grade: item.overall_grade,
        sub_grades: item.sub_grades,
        autograph: item.autograph,
        subject: item.subject,
        image: item.image,
      });
    }
  }
}
