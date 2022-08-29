import { Queue } from 'bull';
import { Contract } from 'ethers';
import { InjectQueue } from '@nestjs/bull';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';

import configuration, { RUNTIME_ENV } from '../config/configuration';
import {
  BurnRequest,
  ForwardRequest,
  LockRequest,
  MintRequest,
} from './dtos/vaulting.dto';

import { DatabaseService } from '../database/database.service';
import { BlockchainService } from '../blockchain/blockchain.service';
import {
  BurnJobResult,
  BurnJobResultReadable,
  ExecJobResult,
  ExecJobResultReadable,
  LockJobResult,
  LockJobResultReadable,
  MintJobResult,
  MintJobResultReadable,
  TokenStatus,
  TokenStatusReadable,
} from '../config/enum';
import { DetailedLogger } from '../logger/detailed.logger';

@Injectable()
export class VaultingService {
  private readonly logger = new DetailedLogger('VaultingService', {
    timestamp: true,
  });

  constructor(
    @InjectQueue(configuration()[process.env[RUNTIME_ENV]]['queue']['mint'])
    private mintQueue: Queue,
    @InjectQueue(configuration()[process.env[RUNTIME_ENV]]['queue']['burn'])
    private burnQueue: Queue,
    @InjectQueue(configuration()[process.env[RUNTIME_ENV]]['queue']['lock'])
    private lockQueue: Queue,
    @InjectQueue(configuration()[process.env[RUNTIME_ENV]]['queue']['exec'])
    private execQueue: Queue,
    private databaseService: DatabaseService,
    private blockchainService: BlockchainService,
  ) {}

  nftContracts: {
    [key: string]: Contract;
  };

  /////////////////////////
  // All queue operations

  async mintNFT(mint: MintRequest) {
    mint.collection = mint.collection.toLowerCase();
    const job = await this.mintQueue.add(mint);
    return job;
  }

  async burnNFT(burn: BurnRequest) {
    burn.collection = burn.collection.toLowerCase();
    const job = await this.burnQueue.add(burn);
    return job;
  }

  async lockNFT(lock: LockRequest) {
    lock.collection = lock.collection.toLowerCase();
    const job = await this.lockQueue.add(lock);
    return job;
  }

  async execute(forwardRequest: ForwardRequest) {
    forwardRequest.collection = forwardRequest.collection.toLowerCase();
    const job = await this.execQueue.add(forwardRequest);
    return job;
  }

  async getTokenStatus(collection: string, token_id: number) {
    const token_status_db = await this.databaseService.getTokenStatus(
      collection,
      token_id,
    );
    const token_status_bc = await this.blockchainService.getTokenStatus(
      collection,
      token_id,
    );
    this.logger.log(
      `token status: ${collection}, ${token_id}, db: ${token_status_db}, blockchain: ${token_status_bc}`,
    );

    // a finite-state machine with 5 status: not-minted, minting, minted, locked, burned
    switch (token_status_db) {
      case TokenStatus.NotMinted:
        if (
          token_status_bc == TokenStatus.Minted ||
          token_status_bc == TokenStatus.Locked
        ) {
          return token_status_bc;
        } else {
          return TokenStatus.NotMinted;
        }
      case TokenStatus.Minting:
        if (
          token_status_bc == TokenStatus.Minted ||
          token_status_bc == TokenStatus.Locked
        ) {
          return token_status_bc;
        } else {
          // if we can not find token on chain, then it is still being minted
          return TokenStatus.Minting;
        }
      case TokenStatus.Minted:
        if (
          token_status_bc == TokenStatus.Minted ||
          token_status_bc == TokenStatus.Locked
        ) {
          return token_status_bc;
        } else {
          // if we can not find token on chain, but it is already marked as minted
          //  then it is burned
          return TokenStatus.Burned;
        }
      case TokenStatus.Locked:
        if (
          token_status_bc == TokenStatus.Minted ||
          token_status_bc == TokenStatus.Locked
        ) {
          // on-chain status should not be minted again if db status is locked
          // but we will take the on-chain status as the source of truth
          return token_status_bc;
        } else {
          return TokenStatus.Burned;
        }
      case TokenStatus.Burned:
        if (
          token_status_bc == TokenStatus.Minted ||
          token_status_bc == TokenStatus.Locked
        ) {
          // on-chain status should not be minted or locked again if db status is burned
          // but we will take the on-chain status as the source of truth
          return token_status_bc;
        } else {
          return TokenStatus.Burned;
        }
    }
  }

  async mintJobStatus(id: number) {
    const job = await this.mintQueue.getJob(id);
    if (job == undefined) {
      throw new NotFoundException(`mint job ${id} can not be found`);
    }
    const collection = job.data['collection'].toLowerCase();
    const beckett_id = job.data['nft_record_uid'];
    this.logger.log(JSON.stringify(job));
    var tx_hash: string;
    var error: string;
    var status: number;
    // job status endpoint is called before job finishes
    if (job.returnvalue == null) {
      tx_hash = '';
      error = '';
      status = MintJobResult.JobReceived;
    } else {
      tx_hash = job.returnvalue['tx_hash'];
      error = job.returnvalue['error'];
      status = job.returnvalue['status'];
    }

    var token_id: number;
    const vaulting = await this.databaseService.getVaultingById(beckett_id);
    if (vaulting == undefined) {
      throw new NotFoundException(
        `vaulting/token record can not be found for ${beckett_id}`,
      );
    } else {
      token_id = vaulting.token_id;
    }

    var jobFinished = false;
    this.logger.log(
      `vaulting: ${vaulting.beckett_id}, ${vaulting.collection}, ${vaulting.token_id}`,
    );
    const token_status = await this.getTokenStatus(collection, token_id);
    if (job.finishedOn > 0) {
      jobFinished = true;
      await this.databaseService.updateTokenStatus(
        collection,
        token_id,
        token_status,
      );
    }

    const jobStatus = {
      job_id: Number(job.id),
      nft_record_uid: job.data.nft_record_uid,
      collection: job.data.collection,
      token_id: token_id,
      token_status: token_status,
      token_status_desc: TokenStatusReadable[token_status],
      job_status: status,
      job_status_desc: MintJobResultReadable[status],
      tx_hash: tx_hash,
      processed: jobFinished,
      error: error,
    };
    return jobStatus;
  }

  async burnJobStatus(id: number) {
    const job = await this.burnQueue.getJob(id);
    if (job == undefined) {
      throw new NotFoundException(`burn job ${id} can not be found`);
    }
    const collection = job.data['collection'].toLowerCase();
    const token_id = job.data['token_id'] as number;
    const beckett_id = job.data['nft_record_uid'];

    this.logger.log(`<burnJobStatus> ${JSON.stringify(job.returnvalue)}`);

    var tx_hash: string;
    var error: string;
    var status: number;
    // job status endpoint is called before job finishes
    if (job.returnvalue == null) {
      tx_hash = '';
      error = '';
      status = BurnJobResult.JobReceived;
    } else {
      tx_hash = job.returnvalue['tx_hash'];
      error = job.returnvalue['error'];
      status = job.returnvalue['status'];
    }

    var token_status = await this.getTokenStatus(collection, token_id);
    var jobFinished = false;
    if (job.finishedOn > 0) {
      jobFinished = true;
      await this.databaseService.updateTokenStatus(
        collection,
        token_id,
        token_status,
      );
    }

    return {
      job_id: Number(job.id),
      nft_record_uid: beckett_id,
      collection: collection,
      token_id: token_id,
      token_status: token_status,
      token_status_desc: TokenStatusReadable[token_status],
      job_status: status,
      job_status_desc: BurnJobResultReadable[status],
      tx_hash: tx_hash,
      processed: jobFinished,
      error: error,
    };
  }

  async lockJobStatus(id: number) {
    const job = await this.lockQueue.getJob(id);
    if (job == undefined) {
      throw new NotFoundException(`lock job ${id} can not be found`);
    }
    const collection = job.data['collection'].toLowerCase();
    const token_id = job.data['token_id'] as number;
    const nft_record_uid = await this.databaseService.getVaultingUUID(
      collection,
      token_id,
    );

    this.logger.log(JSON.stringify(job.returnvalue));

    var tx_hash: string;
    var error: string;
    var status: number;
    // job status endpoint is called before job finishes
    if (job.returnvalue == null) {
      tx_hash = '';
      error = '';
      status = LockJobResult.JobReceived;
    } else {
      tx_hash = job.returnvalue['tx_hash'];
      error = job.returnvalue['error'];
      status = job.returnvalue['status'];
    }

    var token_status = await this.getTokenStatus(collection, token_id);
    var jobFinished = false;
    if (job.finishedOn > 0) {
      jobFinished = true;
      await this.databaseService.updateTokenStatus(
        collection,
        token_id,
        token_status,
      );
    }

    return {
      job_id: Number(job.id),
      nft_record_uid: nft_record_uid,
      collection: collection,
      token_id: token_id,
      token_status: token_status,
      token_status_desc: TokenStatusReadable[token_status],
      job_status: status,
      job_status_desc: LockJobResultReadable[status],
      tx_hash: tx_hash,
      processed: jobFinished,
      error: error,
    };
  }

  async execJobStatus(id: number) {
    const job = await this.execQueue.getJob(id);
    if (job == undefined) {
      throw new NotFoundException(`lock job ${id} can not be found`);
    }
    const collection = job.data['collection'];
    const token_id = job.data['token_id'];
    const nft_record_uid = await this.databaseService.getVaultingUUID(
      collection,
      token_id,
    );
    if (nft_record_uid == undefined) {
      throw new NotFoundException(
        `nft record uid can not be found for collection: ${collection}, token_id: ${token_id}`,
      );
    }

    this.logger.log(
      `exec job: ${id} return value: ${JSON.stringify(job.returnvalue)}`,
    );

    var tx_hash: string;
    var error: string;
    var status: number;
    // job status endpoint is called before job finishes
    if (job.returnvalue == null) {
      tx_hash = '';
      error = '';
      status = ExecJobResult.JobReceived;
    } else {
      tx_hash = job.returnvalue['tx_hash'];
      error = job.returnvalue['error'];
      status = job.returnvalue['status'];
    }

    var token_status = await this.getTokenStatus(collection, token_id);
    var jobFinished = false;
    if (job.finishedOn > 0) {
      jobFinished = true;
      await this.databaseService.updateTokenStatus(
        collection,
        token_id,
        token_status,
      );
    }

    return {
      job_id: Number(job.id),
      nft_record_uid: nft_record_uid,
      collection: collection,
      token_id: token_id,
      token_status: token_status,
      token_status_desc: TokenStatusReadable[token_status],
      job_status: status,
      job_status_desc: ExecJobResultReadable[status],
      tx_hash: tx_hash,
      processed: jobFinished,
      error: error,
    };
  }

  async handleMintEvent(collection: string, tokenId: number, reason: any) {
    collection = collection.toLowerCase();
    this.logger.log(`Event safeMint: ${collection}, ${tokenId}`);
    const minted = await this.blockchainService.nftMinted(collection, tokenId);
    if (minted) {
      await this.databaseService.updateTokenStatus(
        collection,
        tokenId,
        TokenStatus.Minted,
      );
    }
  }

  async handleBurnEvent(collection: string, tokenId: number, reason: any) {
    collection = collection.toLowerCase();
    this.logger.log(`Event burn: ${collection}, params: ${tokenId}`);
    const burned = !(await this.blockchainService.nftMinted(
      collection,
      tokenId,
    ));
    if (burned) {
      await this.databaseService.updateTokenStatus(
        collection,
        tokenId,
        TokenStatus.Burned,
      );
    }
  }

  async handleTransferEvent(collection: string, reason: any) {
    this.logger.log(
      `Event Transfer: ${collection}, params: ${JSON.stringify(
        reason['params'],
      )}`,
    );
  }

  async callbackHandler(notification: any) {
    const events = notification['events'];
    for (var i = 0; i < events.length; i++) {
      const event = events[i];
      const collection = event['matchedAddresses'][0].toLowerCase();
      for (var j = 0; j < event['matchReasons'].length; j++) {
        const reason = event['matchReasons'][j];
        this.logger.log(`Event received: ${JSON.stringify(reason)}`);
        if (reason['signature'].includes('Transfer')) {
          await this.handleTransferEvent(collection, reason);
        } else if (reason['signature'].includes('safeMint')) {
          const tokenId = Number(reason['params']['tokenId_']);
          await this.handleMintEvent(collection, tokenId, reason);
        } else if (reason['signature'].includes('burn')) {
          const tokenId = Number(reason['params']['tokenId_']);
          await this.handleBurnEvent(collection, tokenId, reason);
        }
      }
    }
  }
}
