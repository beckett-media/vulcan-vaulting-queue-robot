import {
  DefenderRelayProvider,
  DefenderRelaySigner,
} from 'defender-relay-client/lib/ethers';
import { Contract, ethers } from 'ethers';
import configuration from 'src/config/configuration';

import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';

import { serviceConfig } from './blockchain.service.config';
import { isString } from 'class-validator';
import { BurnJobStatus } from 'src/vaulting/dtos/vaulting.dto';
import { BurnJobResult } from 'src/config/enum';

@Injectable()
export class BlockchainService {
  private readonly logger = new Logger('BlockchainService');
  nftContracts: {
    [key: string]: Contract;
  };
  private retrievalManager: Contract;
  private relaySigner: DefenderRelaySigner;
  private relayProvider: DefenderRelayProvider;

  constructor() {
    // TODO: move this to its own function
    if (this.retrievalManager == undefined) {
      try {
        //TODO: move to burn relayer
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
        this.retrievalManager = new ethers.Contract(
          serviceConfig.RetrievalManagerAddress,
          serviceConfig.RetrievalManagerABI,
          signer,
        );
      } catch (error) {
        throw new InternalServerErrorException(error.toString());
      }
    }
  }

  async nftMinted(collection: string, id: Number) {
    const nftContract = this.getContract(collection);
    try {
      const owner = await nftContract.ownerOf(id);
      return isString(owner);
    } catch (error) {
      return false;
    }
  }

  async mintToken(
    collection: string,
    id: number,
    owner: string,
    tokenURI: string,
  ) {
    const nftContract = this.getContract(collection);
    this.logger.log(`Safe mint: ${owner}, ${id}, ${tokenURI}`);
    const tx_config =
      configuration()[process.env['runtime']]['blockchain']['tx_config'];
    const mintTx = await nftContract.safeMint(owner, id, tokenURI, tx_config);
    return mintTx.hash;
  }

  async burnToken(token_id: number) {
    // TODO retrieval manager
    try {
      const tx_config =
        configuration()[process.env['runtime']]['blockchain']['tx_config'];
      const burnTx = await this.retrievalManager.burn(token_id, tx_config);
      this.logger.log(`burn tx: ${burnTx.hash}`);
      return {
        tx_hash: burnTx.hash,
        error: null,
        status: BurnJobResult.TxSent,
      };
    } catch (error) {
      this.logger.log(`burn error: token not transfered yet? ${error}`);
      return {
        tx_hash: null,
        error: error.toString(),
        status: null,
      };
    }
  }

  async getTransactionReceipt(tx_hash: string) {
    const { provider } = this.getRelaySigner();
    const receipt = await provider.getTransactionReceipt(tx_hash);
    return receipt;
  }

  getRelaySigner() {
    if (this.relaySigner == undefined || this.relayProvider == undefined) {
      const relayConfig =
        serviceConfig.RelayConfig[
          configuration()[process.env['runtime']]['network_mint_relayer']
        ];
      this.logger.log(`relay config: ${JSON.stringify(relayConfig)}`);
      const credentials = {
        apiKey: relayConfig['apiKey'],
        apiSecret: relayConfig['apiSecret'],
      };
      this.relayProvider = new DefenderRelayProvider(credentials);
      this.relaySigner = new DefenderRelaySigner(
        credentials,
        this.relayProvider,
        {
          speed: 'fast',
        },
      );
    }

    return { provider: this.relayProvider, signer: this.relaySigner };
  }

  // TODO: make get contract a service
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
        const { signer } = this.getRelaySigner();
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
}
