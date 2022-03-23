import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { BurnRequest, MintRequest } from './dtos/vaulting.dto';
import { Contract, ethers } from 'ethers';
import { serviceConfig } from './vaulting.service.config';
import {
  DefenderRelayProvider,
  DefenderRelaySigner,
} from 'defender-relay-client/lib/ethers';
import { isString } from 'class-validator';
import configuration from './config/configuration';
import {
  JobResult,
  JobResultReadable,
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
        const relayConfig = serviceConfig.RelayConfig['mumbai'];
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
      status = JobResult.JobReceived;
    } else {
      error = job.returnvalue['error'];
      tx_hash = job.returnvalue['tx_hash'];
      status = job.returnvalue['status'];
    }
    var token_status = TokenStatus.NotMinted;
    var token_id: number;
    if (job.finishedOn > 0) {
      const vaulting = await this.vaultingRepo.findOne(job.data.beckett_id);
      token_id = vaulting.token_id;

      // check if it's minted
      var tokenMinted: boolean;
      if (vaulting != undefined) {
        tokenMinted = await this.mintNFTStatus(
          job.data.collection,
          vaulting.token_id,
        );
      }
      // There is difference between job status and token status
      // update token status to 'minted' if job status is minted as well
      if (tokenMinted == true) {
        token_status = TokenStatus.Minted;
        const token = await this.tokenRepo.findOne({
          collection: job.data.collection,
          id: vaulting.token_id,
        });
        if (token) {
          Object.assign(token, { status: TokenStatus.Minted });
          await this.tokenRepo.save(token);
        }
      }
    }
    const jobStatus = {
      job_id: job.id,
      beckett_id: job.data.beckett_id,
      collection: job.data.collection,
      token_id: token_id,
      token_status: token_status,
      token_status_desc: TokenStatusReadable[token_status],
      job_status: status,
      job_status_desc: JobResultReadable[status],
      tx_hash: tx_hash,
      error: error,
    };
    return jobStatus;
  }

  async mintNFTStatus(collection: string, id: number) {
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
}
