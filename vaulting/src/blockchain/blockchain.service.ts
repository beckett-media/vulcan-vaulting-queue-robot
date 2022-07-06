import {
  DefenderRelayProvider,
  DefenderRelaySigner,
} from 'defender-relay-client/lib/ethers';
import { BigNumber, Contract, ethers, utils } from 'ethers';
import configuration from '../config/configuration';

import { Injectable, InternalServerErrorException } from '@nestjs/common';

import { serviceConfig } from './blockchain.service.config';
import { isString } from 'class-validator';
import {
  BurnJobResult,
  ExecJobResult,
  LockJobResult,
  TokenStatus,
} from '../config/enum';
import { DetailedLogger } from 'src/logger/detailed.logger';

const executeGas = 50000;

@Injectable()
export class BlockchainService {
  private readonly logger = new DetailedLogger('BlockchainService', {
    timestamp: true,
  });
  nftContracts: {
    [key: string]: Contract;
  };
  retrievalManagers: {
    [key: string]: Contract;
  };
  private minimalForwarder: Contract;
  private relaySigner: DefenderRelaySigner;
  private relayProvider: DefenderRelayProvider;

  constructor() {
    // TODO: move this to its own function
    if (this.minimalForwarder == undefined) {
      try {
        //TODO: move to burn relayer
        const relayConfig =
          serviceConfig.RelayConfig[
            configuration()[process.env['runtime']]['network_mint_relayer']
          ];
        const credentials = {
          apiKey: relayConfig['apiKey'],
          apiSecret: relayConfig['apiSecret'],
        };
        const provider = new DefenderRelayProvider(credentials);
        const signer = new DefenderRelaySigner(credentials, provider, {
          speed: 'fast',
        });
        this.minimalForwarder = new ethers.Contract(
          serviceConfig.MinimalForwarderAddress,
          serviceConfig.MinimalForwarderABI,
          signer,
        );
      } catch (error) {
        throw new InternalServerErrorException(error.toString());
      }
    }
  }

  getRelaySigner() {
    if (this.relaySigner == undefined || this.relayProvider == undefined) {
      const relayConfig =
        serviceConfig.RelayConfig[
          configuration()[process.env['runtime']]['network_mint_relayer']
        ];
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
    if (!serviceConfig.NftContractType[address]) {
      throw new InternalServerErrorException(
        `${address} is not a known contract address for ABI`,
      );
    }
    const nftContractType = serviceConfig.NftContractType[address];
    var abiType;
    switch (nftContractType) {
      case 'ERC721':
        abiType = serviceConfig.ERC721ABI;
        break;
      case 'ERC721Registry':
        abiType = serviceConfig.ERC721RegistryABI;
        break;
    }
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
          abiType,
          signer,
        );
      } catch (error) {
        throw new InternalServerErrorException(error.toString());
      }
      return this.nftContracts[address];
    }
  }

  async getRetrievalManager(collectionAddress: string): Promise<Contract> {
    // cache the contract obj in class variable
    if (this.retrievalManagers == undefined) {
      this.retrievalManagers = {};
    }
    // return cached contract obj if we already have it, otherwise create one
    if (this.retrievalManagers[collectionAddress] != undefined) {
      return this.retrievalManagers[collectionAddress];
    } else {
      try {
        const nftContract = this.getContract(collectionAddress);
        const retrievalManagerAddress = await nftContract.retrievalManager();
        const { signer } = this.getRelaySigner();
        this.retrievalManagers[collectionAddress] = new ethers.Contract(
          retrievalManagerAddress,
          serviceConfig.RetrievalManagerABI,
          signer,
        );
      } catch (error) {
        throw new InternalServerErrorException(error.toString());
      }
      return this.retrievalManagers[collectionAddress];
    }
  }

  async nftLocked(collection: string, id: number) {
    const nftContract = this.getContract(collection);
    const retrievalManager = await this.getRetrievalManager(collection);
    try {
      const owner = await nftContract.ownerOf(id);
      if (isString(owner) && owner == retrievalManager.address) {
        return true;
      }
    } catch (error) {
      return false;
    }

    return false;
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

  // on-chain token status only has 3 values: not minted, minted, locked
  async getTokenStatus(collection: string, token_id: number) {
    const isNFTMinted = await this.nftMinted(collection, token_id);
    if (isNFTMinted) {
      const isNFTLocked = await this.nftLocked(collection, token_id);
      this.logger.log(
        `token status: minted: ${isNFTMinted}, locked: ${isNFTLocked}`,
      );
      if (isNFTLocked) {
        return TokenStatus.Locked;
      } else {
        return TokenStatus.Minted;
      }
    }

    return TokenStatus.NotMinted;
  }

  async mintToken(
    collection: string,
    id: number,
    owner: string,
    tokenURI: string,
  ) {
    const nftContract = this.getContract(collection);
    this.logger.log(`Safe mint: ${owner}, ${id}, ${tokenURI}`);
    // update owner based on contract type
    const nftContractType = serviceConfig.NftContractType[collection];
    switch (nftContractType) {
      case 'ERC721':
        break;
      case 'ERC721Registry':
        owner = ethers.utils.id(owner);
        break;
    }
    const tx_config =
      configuration()[process.env['runtime']]['blockchain']['tx_config'];
    const mintTx = await nftContract.safeMint(owner, id, tokenURI, tx_config);
    return mintTx.hash;
  }

  async lockToken(collection: string, token_id: number, hash: string) {
    try {
      const nftContract = this.getContract(collection);
      const retrievalManager = await this.getRetrievalManager(collection);
      const tx_config =
        configuration()[process.env['runtime']]['blockchain']['tx_config'];
      var progress: number;

      // # 1: call retrieval manager's lock function
      const hashBytes32 = utils.arrayify(hash);
      const lockTx = await retrievalManager.lock(token_id, hashBytes32);
      progress = LockJobResult.LockTxSend;
      this.logger.log(`lock tx: ${lockTx.hash}`);

      return {
        tx_hash: lockTx.hash,
        error: null,
        status: progress,
      };
    } catch (error) {
      this.logger.error(`lock/tranferFrom error: ${error}`);
      return {
        tx_hash: null,
        error: error.toString(),
        status: progress,
      };
    }
  }

  async execute(forwardRequest, signature: Uint8Array) {
    var progress = ExecJobResult.JobReceived;
    try {
      // gas estimate is wrong for execute transaction
      // add extra gas to gas limit
      var tx_config =
        configuration()[process.env['runtime']]['blockchain']['tx_config'];
      if (tx_config == undefined) {
        tx_config = {};
      }
      const gasLimit =
        (forwardRequest['gas'] as BigNumber).toNumber() + executeGas;
      // if no forced gas limit is used
      if (tx_config['gasLimit'] == undefined) {
        tx_config['gasLimit'] = gasLimit;
      }
      const execTx = await this.minimalForwarder.execute(
        forwardRequest,
        signature,
        tx_config,
      );
      this.logger.log(`execute forward request tx: ${execTx.hash}`);
      progress = ExecJobResult.TxSent;
      return {
        tx_hash: execTx.hash,
        error: null,
        status: progress,
      };
    } catch (error) {
      this.logger.error(`execute forward request error: ${error}`);
      return {
        tx_hash: null,
        error: error.toString(),
        status: progress,
      };
    }
  }

  async burnToken(collection: string, token_id: number) {
    // TODO retrieval manager
    try {
      const tx_config =
        configuration()[process.env['runtime']]['blockchain']['tx_config'];
      var burnTx;
      // contract type by collection
      const nftContractType = serviceConfig.NftContractType[collection];
      // burn token based on contract type
      switch (nftContractType) {
        case 'ERC721':
          const retrievalManager = await this.getRetrievalManager(collection);
          burnTx = await retrievalManager.burn(token_id, tx_config);
          break;
        case 'ERC721Registry':
          const nftContract = this.getContract(collection);
          burnTx = await nftContract.burn(token_id, tx_config);
          break;
      }

      this.logger.log(`burn tx: ${burnTx.hash}`);
      return {
        tx_hash: burnTx.hash,
        error: null,
        status: BurnJobResult.TxSent,
      };
    } catch (error) {
      this.logger.error(`burn error: token not transfered yet? ${error}`);
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
}
