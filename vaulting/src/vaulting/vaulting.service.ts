import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  ShutdownSignal,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { BurnJobStatus, BurnRequest, MintRequest } from './dtos/vaulting.dto';
import { Contract, ethers } from 'ethers';
import { serviceConfig } from './vaulting.service.config';
import {
  DefenderRelayProvider,
  DefenderRelaySigner,
} from 'defender-relay-client/lib/ethers';
import { isString } from 'class-validator';
import configuration from './config/configuration';
import {
  MintJobResult,
  MintJobResultReadable,
  BurnJobResult,
  TokenStatus,
  TokenStatusReadable,
} from './vaulting.consumer';
import { Token, Vaulting } from './vaulting.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class VaultingService {
  private readonly logger = new Logger('VaultingServer');

  constructor(
    @InjectRepository(Token) private tokenRepo: Repository<Token>,
    @InjectRepository(Vaulting) private vaultingRepo: Repository<Vaulting>,
    @InjectQueue(configuration()[process.env['runtime']]['queue']['mint'])
    private mintQueue: Queue,
    @InjectQueue(configuration()[process.env['runtime']]['queue']['burn'])
    private burnQueue: Queue,
  ) {}

  nftContracts: {
    [key: string]: Contract;
  };

  getContract(address: string): Contract {
    // cache the contract obj in class variable
    if (this.nftContracts == undefined) {
      this.nftContracts = {};
    }
    // return cached contract obj if we already have it, otherwise create one
    if (this.nftContracts[address] != undefined) {
      return this.nftContracts[address];
    } else {
      try {
        const relayConfig =
          serviceConfig.RelayConfig[
            configuration()[process.env['runtime']]['network_mint_relayer']
          ];
        this.logger.log(`relay config: ${JSON.stringify(relayConfig)}`);
        const credentials = {
          apiKey: relayConfig['apiKey'],
          apiSecret: relayConfig['apiSecret'],
        };
        const provider = new DefenderRelayProvider(credentials);
        const signer = new DefenderRelaySigner(credentials, provider, {
          speed: 'fast',
        });
        this.nftContracts[address] = new ethers.Contract(
          address,
          serviceConfig.ERC721ABI,
          signer,
        );
      } catch (error) {
        throw new InternalServerErrorException(error.toString());
      }
      return this.nftContracts[address];
    }
  }

  async mintNFT(mint: MintRequest) {
    const job = await this.mintQueue.add(mint);
    return job;
  }

  async mintJobStatus(id: number) {
    const job = await this.mintQueue.getJob(id);
    if (job == undefined) {
      throw new NotFoundException();
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
      const vaulting = await this.vaultingRepo.findOne(job.data.beckett_id);
      token_id = vaulting.token_id;

      // check if it's minted
      var tokenMinted: boolean;
      if (vaulting != undefined) {
        tokenMinted = await this.nftMinted(
          job.data.collection,
          vaulting.token_id,
        );
      }
      // There is difference between job status and token status
      // update token status to 'minted' if job status is minted as well
      if (tokenMinted == true) {
        token_status = TokenStatus.Minted;
        this.updateTokenStatus(
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

  async nftMinted(collection: string, id: number) {
    const nftContract = this.getContract(collection);
    try {
      const owner = await nftContract.ownerOf(id);
      return isString(owner);
    } catch (error) {
      return false;
    }
  }

  //////////////////////////////////////////////////////
  /// brun nft
  //////////////////////////////////////////////////////

  async burnNFT(burn: BurnRequest) {
    const job = await this.burnQueue.add(burn);
    return job;
  }

  async burnJobStatus(id: number) {
    const job = await this.burnQueue.getJob(id);
    const collection = job.data['collection'];
    const token_id = job.data['token_id'];
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

    try {
      const nftContract = this.getContract(collection);
      this.logger.log(`burn job status: ${collection}, ${token_id}`);
      await nftContract.ownerOf(token_id);
    } catch (error) {
      // if there is exception which means we can't find the token
      // and we sent the burn tx (passed all checks before sending burn tx)
      // then the token is burned
      if (jobStatus == BurnJobResult.TxSent) {
        jobStatus = BurnJobResult.TokenBurned;
      }
    }

    return {
      job_id: job.id,
      collection: collection,
      token_id: token_id,
      beckett_id: beckett_id,
      processed: jobFinished,
      status: jobStatus,
    };
  }

  async updateTokenStatus(collection: string, tokenId: number, status: number) {
    // update token table for burned nft
    const token = await this.tokenRepo.findOne({
      collection: collection,
      id: tokenId,
    });
    if (token) {
      Object.assign(token, { status: status });
      await this.tokenRepo.save(token);
    }
  }

  async handleMintEvent(collection: string, tokenId: number, reason: any) {
    this.logger.log(`Event safeMint: ${collection}, ${tokenId}`);
    const minted = await this.nftMinted(collection, tokenId);
    if (minted) {
      await this.updateTokenStatus(collection, tokenId, TokenStatus.Minted);
    }
  }

  async handleBurnEvent(collection: string, tokenId: number, reason: any) {
    this.logger.log(`Event burn: ${collection}, params: ${tokenId}`);
    const burned = !(await this.nftMinted(collection, tokenId));
    if (burned) {
      await this.updateTokenStatus(collection, tokenId, TokenStatus.Burned);
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
