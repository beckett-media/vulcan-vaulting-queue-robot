import { Item, Submission, Vaulting } from '../database/database.entity';
import { Repository, getManager, In } from 'typeorm';

import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { isNumber } from 'class-validator';
import configuration from '../config/configuration';
import { DetailedLogger } from 'src/logger/detailed.logger';
import {
  SubmissionDetails,
  SubmissionRequest,
} from 'src/marketplace/dtos/marketplace.dto';
import { SubmissionStatus, SubmissionStatusReadable } from 'src/config/enum';

@Injectable()
export class DatabaseService {
  private readonly logger = new DetailedLogger('DatabaseService', {
    timestamp: true,
  });

  constructor(
    @InjectRepository(Submission)
    private submissionRepo: Repository<Submission>,
    @InjectRepository(Item) private itemRepo: Repository<Item>,
    @InjectRepository(Vaulting) private vaultingRepo: Repository<Vaulting>,
  ) {}

  async createNewSubmission(submission: SubmissionRequest, s3URL: string) {
    var submission_id: number;
    var item_id: number;
    var status: number;
    var defaultImage =
      'https://beckett-marketplace-dev.s3.us-west-1.amazonaws.com/baseball-cards-gettyimages-161023632.jpg';
    try {
      await getManager().transaction(
        'SERIALIZABLE',
        async (transactionalEntityManager) => {
          const newItem = this.itemRepo.create({
            grading_company: submission.grading_company,
            serial_number: submission.serial_number,
            title: submission.title,
            description: submission.description,
            genre: submission.genre,
            manufacturer: submission.manufacturer,
            year: submission.year,
            overall_grade: submission.overall_grade,
            sub_grades: submission.sub_grades,
            autograph: submission.autograph,
            subject: submission.subject,
            submission_image: s3URL || defaultImage,
            token_image: '',
          });
          const itemSaved = await this.itemRepo.save(newItem);
          item_id = itemSaved.id;
          const newSubmission = this.submissionRepo.create({
            user_id: submission.user_id,
            item_id: itemSaved.id,
            status: 1,
            created_at: Math.round(Date.now() / 1000),
            received_at: 0,
            minted_at: 0,
          });
          const submissionSaved = await this.submissionRepo.save(newSubmission);
          submission_id = submissionSaved.id;
        },
      );
    } catch (error) {
      status = SubmissionStatus.Failed;
      this.logger.error(error);
    }
    status = SubmissionStatus.Submitted;

    return {
      submission_id: submission_id,
      item_id: item_id,
      status: status,
    };
  }

  async listSubmissions(
    user_id: number,
    status: number,
    offset: number,
    limit: number,
  ): Promise<SubmissionDetails[]> {
    var where_filter = { user_id: user_id };
    if (status !== undefined) {
      where_filter['status'] = status;
    }
    if (offset == undefined) {
      offset = 0;
    }
    var filter = {
      where: where_filter,
      skip: offset,
    };
    if (limit != undefined) {
      filter['take'] = limit;
    }
    const submissions = await this.submissionRepo.find(filter);
    console.log(user_id, submissions.length);
    // get all item ids from submissions
    const item_ids = submissions.map((submission) => submission.item_id);
    // get all items from item_ids
    const items = await this.itemRepo.find({
      where: { id: In(item_ids) },
    });
    // build a map of item_id to item
    const itemMap = new Map<number, Item>();
    items.forEach((item) => {
      itemMap.set(item.id, item);
    });
    var submissionDetails: SubmissionDetails[] = [];
    submissions.forEach((submission) => {
      const item = itemMap.get(submission.item_id);
      submissionDetails.push(
        new SubmissionDetails({
          submission_id: submission.id,
          user_id: submission.user_id,
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
          image: item.submission_image,
          status: submission.status,
          status_desc: SubmissionStatusReadable[submission.status],
          created_at: submission.created_at,
          received_at: submission.received_at,
          minted_at: submission.minted_at,
        }),
      );
    });

    return submissionDetails;
  }

  async getSubmission(submission_id: number): Promise<Submission> {
    const submission = await this.submissionRepo.findOne(submission_id);
    // if we can not find submission, throw not found error
    if (!submission) {
      throw new NotFoundException('Submission not found');
    }
    return submission;
  }

  async updateSubmission(submission_id: number, status: number) {
    const submission = await this.submissionRepo.findOne(submission_id);
    submission.status = status;
    if (status === SubmissionStatus.Received) {
      submission.received_at = Math.round(Date.now() / 1000);
    }
    if (status === SubmissionStatus.Minted) {
      submission.minted_at = Math.round(Date.now() / 1000);
    }
    await this.submissionRepo.save(submission);
    return submission;
  }

  // list items by item ids
  async listItems(item_ids: number[]): Promise<Item[]> {
    const items = await this.itemRepo.find({
      where: { id: In(item_ids) },
    });
    return items;
  }

  async getItem(item_id: number): Promise<Item> {
    const item = await this.itemRepo.findOne(item_id);
    if (!item) {
      throw new NotFoundException('Item not found');
    }
    return item;
  }

  // create new vaulting item
  async createNewVaulting(
    user_id: number,
    submission_id: number,
    item_id: number,
    collection: string,
    token_id: number,
  ): Promise<Vaulting> {
    var vaulting: Vaulting;
    try {
      await getManager().transaction(
        'SERIALIZABLE',
        async (transactionalEntityManager) => {
          const newVaulting = this.vaultingRepo.create({
            user_id: user_id,
            submission_id: submission_id,
            item_id: item_id,
            collection: collection,
            token_id: token_id,
          });
          vaulting = await this.vaultingRepo.save(newVaulting);
        },
      );
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException(error);
    }
    return vaulting;
  }

  // list vaulting items by user id
  async listVaultings(
    user_id: number,
    offset: number,
    limit: number,
  ): Promise<Vaulting[]> {
    var where_filter = { user_id: user_id };
    if (offset == undefined) {
      offset = 0;
    }
    var filter = {
      where: where_filter,
      skip: offset,
    };
    if (limit != undefined) {
      filter['take'] = limit;
    }
    const vaultings = await this.vaultingRepo.find(filter);
    return vaultings;
  }

  async getVaulting(vaulting_id: number): Promise<Vaulting> {
    const vaulting = await this.vaultingRepo.findOne(vaulting_id);
    if (!vaulting) {
      throw new NotFoundException('Vaulting not found');
    }
    return vaulting;
  }

  async updateVaulting(vaulting_id: number, status: number): Promise<Vaulting> {
    const vaulting = await this.vaultingRepo.findOne(vaulting_id);
    if (!vaulting) {
      throw new NotFoundException('Vaulting not found');
    }
    Object.assign(vaulting, { status: status });
    await this.vaultingRepo.save(vaulting);
    return vaulting;
  }
}
