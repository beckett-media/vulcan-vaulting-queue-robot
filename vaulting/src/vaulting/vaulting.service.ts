import { Queue } from 'bull';
import { Contract } from 'ethers';
import { InjectQueue } from '@nestjs/bull';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';

import configuration from '../config/configuration';
import { BurnRequest, MintRequest } from './dtos/vaulting.dto';

import { DatabaseService } from 'src/database/database.service';
import { BlockchainService } from 'src/blockchain/blockchain.service';
import { IPFSService } from 'src/ipfs/ipfs.service';
import {
  BurnJobResult,
  MintJobResult,
  MintJobResultReadable,
  TokenStatus,
  TokenStatusReadable,
} from 'src/config/enum';

@Injectable()
export class VaultingService {
  private readonly logger = new Logger('VaultingServer');

  constructor(
    @InjectQueue(configuration()[process.env['runtime']]['queue']['mint'])
    private mintQueue: Queue,
    @InjectQueue(configuration()[process.env['runtime']]['queue']['burn'])
    private burnQueue: Queue,
    private databaseService: DatabaseService,
    private blockchainService: BlockchainService,
    private ipfsService: IPFSService,
  ) {}

  nftContracts: {
    [key: string]: Contract;
  };

  async mintNFT(mint: MintRequest) {
    mint.collection = mint.collection.toLowerCase();
    const job = await this.mintQueue.add(mint);
    return job;
  }

  async mintJobStatus(id: number) {
    const job = await this.mintQueue.getJob(id);
    if (job == undefined) {
      throw new NotFoundException(`mint job ${id} can not be found`);
    }
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
    var token_status = TokenStatus.NotMinted;
    var token_id: number;
    var jobFinished = false;
    if (job.finishedOn > 0) {
      jobFinished = true;
      const vaulting = await this.databaseService.getVaultingById(
        job.data.beckett_id,
      );
      token_id = vaulting.token_id;

      // check if it's minted
      var tokenMinted: boolean;
      if (vaulting != undefined) {
        tokenMinted = await this.blockchainService.nftMinted(
          job.data.collection,
          vaulting.token_id,
        );
      }
      // There is difference between job status and token status
      // update token status to 'minted' if job status is minted as well
      if (tokenMinted == true) {
        token_status = TokenStatus.Minted;
        this.databaseService.updateTokenStatus(
          job.data.collection,
          vaulting.token_id,
          token_status,
        );
      }
    }
    const jobStatus = {
      job_id: Number(job.id),
      beckett_id: job.data.beckett_id,
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

  //////////////////////////////////////////////////////
  /// brun nft
  //////////////////////////////////////////////////////

  async burnNFT(burn: BurnRequest) {
    burn.collection = burn.collection.toLowerCase();
    const job = await this.burnQueue.add(burn);
    return job;
  }

  async burnJobStatus(id: number) {
    const job = await this.burnQueue.getJob(id);
    if (job == undefined) {
      throw new NotFoundException(`burn job ${id} can not be found`);
    }
    const collection = job.data['collection'].toLowerCase();
    const token_id = job.data['token_id'] as number;
    const beckett_id = job.data['beckett_id'];
    var jobStatus = BurnJobResult.JobReceived;
    this.logger.log(job.returnvalue);
    if (job.returnvalue != null && job.returnvalue['status'] != undefined) {
      jobStatus = job.returnvalue['status'];
    }

    var jobFinished = false;
    if (job.finishedOn > 0) {
      jobFinished = true;
    }

    // if we can't find the token
    // and we sent the burn tx (passed all checks before sending burn tx)
    // then the token is burned
    const isNFTMinted = await this.blockchainService.nftMinted(
      collection,
      token_id,
    );
    if (!isNFTMinted) {
      if (jobStatus == BurnJobResult.TxSent) {
        jobStatus = BurnJobResult.TokenBurned;
      }
    }

    //TODO: update token status table
    await this.databaseService.updateTokenStatus(
      collection,
      token_id,
      TokenStatus.Burned,
    );

    return {
      job_id: job.id,
      collection: collection,
      token_id: token_id,
      beckett_id: beckett_id,
      processed: jobFinished,
      status: jobStatus,
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
