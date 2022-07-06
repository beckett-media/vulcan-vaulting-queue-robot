import { Item, Submission, Vaulting, User } from '../database/database.entity';
import { Repository, getManager, In } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

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
  VaultingStatusUpdate,
} from 'src/marketplace/dtos/marketplace.dto';
import {
  SubmissionStatus,
  SubmissionStatusReadable,
  VaultingStatus,
} from 'src/config/enum';
import { ethers } from 'ethers';

const DEFAULT_USER_SOURCE = 'cognito';

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
    @InjectRepository(User) private userRepo: Repository<User>,
  ) {}

  async maybeCreateNewUser(user_uuid: string, source: string): Promise<User> {
    const user = await this.userRepo.findOne({
      where: { uuid: user_uuid },
    });
    if (!user) {
      const newUser = this.userRepo.create({
        uuid: user_uuid,
        created_at: Math.round(Date.now() / 1000),
        source: source,
      });
      await this.userRepo.save(newUser);
      return newUser;
    }
    return user;
  }

  async createNewSubmission(submission: SubmissionRequest, s3URL: string) {
    var submission_id: number;
    var item_id: number;
    var uuid: string;
    var status: number;
    var defaultImage =
      'https://beckett-marketplace-dev.s3.us-west-1.amazonaws.com/baseball-cards-gettyimages-161023632.jpg';
    try {
      await getManager().transaction(
        'SERIALIZABLE',
        async (transactionalEntityManager) => {
          const user = await this.maybeCreateNewUser(
            submission.user,
            DEFAULT_USER_SOURCE,
          );
          const newItem = this.itemRepo.create({
            uuid: uuidv4(),
            user: user.id,
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
            nft_image: '',
          });
          const itemSaved = await this.itemRepo.save(newItem);
          item_id = itemSaved.id;
          uuid = itemSaved.uuid;
          const newSubmission = this.submissionRepo.create({
            user: user.id,
            item_id: itemSaved.id,
            status: 1,
            created_at: Math.round(Date.now() / 1000),
            received_at: 0,
            approved_at: 0,
            rejected_at: 0,
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
      uuid: uuid,
      status: status,
    };
  }

  async listSubmissions(
    userUUID: string,
    status: number,
    offset: number,
    limit: number,
  ): Promise<SubmissionDetails[]> {
    // find user by uuid
    const user = await this.userRepo.findOne({
      where: { uuid: userUUID },
    });
    if (!user) {
      throw new NotFoundException(`User ${userUUID} not found`);
    }

    var where_filter = { user: user.id };
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
          user: user.uuid,
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
          submission_image: item.submission_image,
          status: submission.status,
          status_desc: SubmissionStatusReadable[submission.status],
          created_at: submission.created_at,
          received_at: submission.received_at,
          approved_at: submission.approved_at,
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
    if (status === SubmissionStatus.Approved) {
      submission.approved_at = Math.round(Date.now() / 1000);
    }
    if (status === SubmissionStatus.Rejected) {
      submission.rejected_at = Math.round(Date.now() / 1000);
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

  // list users by user ids
  async listUsers(user_ids: number[]): Promise<User[]> {
    const users = await this.userRepo.find({
      where: { id: In(user_ids) },
    });
    return users;
  }

  // get user by id
  async getUser(user_id: number): Promise<User> {
    const user = await this.userRepo.findOne(user_id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  // get user by uuid
  async getUserByUUID(user_uuid: string): Promise<User> {
    const user = await this.userRepo.findOne({
      where: { uuid: user_uuid },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  // create new vaulting item
  async createNewVaulting(
    user: number,
    item_id: number,
    mint_job_id: number,
  ): Promise<Vaulting> {
    var vaulting: Vaulting;
    try {
      await getManager().transaction(
        'SERIALIZABLE',
        async (transactionalEntityManager) => {
          const newVaulting = this.vaultingRepo.create({
            user: user,
            item_id: item_id,
            mint_job_id: mint_job_id,
            burn_job_id: 0,
            collection: '',
            token_id: 0,
            status: VaultingStatus.Minting,
            minted_at: 0,
            burned_at: 0,
            last_updated: Math.round(Date.now() / 1000),
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
    user: number,
    offset: number,
    limit: number,
  ): Promise<Vaulting[]> {
    var where_filter = { user: user };
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

  // get vaulting by item uuid
  async getVaultingByItemUUID(item_uuid: string): Promise<Vaulting> {
    // get item by uuid
    const item = await this.itemRepo.findOne({
      where: { uuid: item_uuid },
    });
    if (!item) {
      throw new NotFoundException(`Item ${item_uuid} not found`);
    }
    const vaulting = await this.vaultingRepo.findOne({
      where: { item_id: item.id },
    });
    if (!vaulting) {
      throw new NotFoundException(`Vaulting not found for item ${item.id}`);
    }
    return vaulting;
  }

  async updateVaulting(
    vaultingStatusUpdate: VaultingStatusUpdate,
  ): Promise<Vaulting> {
    const vaulting = await this.getVaultingByItemUUID(
      vaultingStatusUpdate.item_uuid,
    );
    if (!vaulting) {
      throw new NotFoundException(
        `Vaulting not found for item ${vaultingStatusUpdate.item_uuid}`,
      );
    }
    Object.assign(vaulting, {
      collection: vaultingStatusUpdate.collection,
      token_id: vaultingStatusUpdate.token_id,
      status: vaultingStatusUpdate.status,
    });
    await this.vaultingRepo.save(vaulting);
    return vaulting;
  }
}
