import { Injectable, InternalServerErrorException } from '@nestjs/common';
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

const JobStatusEnum = {
  RequestReceived: 0,
  RequestInProcessing: 1,
  RequestProcessed: 2,
  RequestFailed: 3,
  TokenMinted: 4,
  TokenBurned: 5,
};

@Injectable()
export class VaultingMintingService {
  constructor(@InjectQueue('beckett_mint') private mintQueue: Queue) {}

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
    console.log(job);
    var status = JobStatusEnum.RequestReceived;
    if (job.processedOn > 0) {
      status = JobStatusEnum.RequestInProcessing;
    }
    if (job.finishedOn > 0) {
      status = JobStatusEnum.RequestProcessed;
      const tokenMinted = this.mintNFTStatus(job.data.collection, job.data.id);
      if (tokenMinted) {
        status = JobStatusEnum.TokenMinted;
      }
    }
    const jobStatus = {
      id: job.id,
      beckett_id: job.data.beckett_id,
      status: status,
    };
    return jobStatus;
  }

  async mintNFTStatus(collection: string, id: number) {
    const nftContract = this.getContract(collection);
    const owner = await nftContract.ownerOf(id);
    return isString(owner);
  }
}

@Injectable()
export class VaultingBurningService {
  constructor(@InjectQueue('beckett_burn') private burnQueue: Queue) {}
  async burnNFT(burn: BurnRequest) {
    const job = await this.burnQueue.add(burn);
  }
}
