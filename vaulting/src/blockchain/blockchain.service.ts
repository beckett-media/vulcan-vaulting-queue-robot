import {
  DefenderRelayProvider,
  DefenderRelaySigner,
} from 'defender-relay-client/lib/ethers';
import { BigNumber, Contract, ethers, utils } from 'ethers';
import configuration, { RUNTIME_ENV } from '../config/configuration';

import { Injectable, InternalServerErrorException } from '@nestjs/common';

import { serviceConfig } from './blockchain.service.config';
import { isString } from 'class-validator';
import {
  BurnJobResult,
  ContractType,
  ExecJobResult,
  LockJobResult,
  RelayerType,
  TokenStatus,
} from '../config/enum';
import { DetailedLogger } from '../logger/detailed.logger';

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
  private relaySigners: any;
  private relayProviders: any;

  constructor() {
    this.relayProviders = {};
    this.relaySigners = {};
    // TODO: move this to its own function
    // if minimal forwarder is not set, set it
    if (this.minimalForwarder == undefined) {
      try {
        //TODO: move to burn relayer
        const relayConfig =
          serviceConfig.RelayConfig[
            configuration()[process.env[RUNTIME_ENV]]['blockchain'][
              'mint_relayer'
            ]
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

  getRelaySigner(relayerType: number) {
    if (
      this.relaySigners[relayerType] == undefined ||
      this.relayProviders[relayerType] == undefined
    ) {
      var relayConfig: any;
      switch (relayerType) {
        case RelayerType.Readonly:
          relayConfig =
            serviceConfig.RelayConfig[
              configuration()[process.env[RUNTIME_ENV]]['blockchain'][
                'readonly_relayer'
              ]
            ];
          break;
        case RelayerType.Mint:
          relayConfig =
            serviceConfig.RelayConfig[
              configuration()[process.env[RUNTIME_ENV]]['blockchain'][
                'mint_relayer'
              ]
            ];
          break;
        case RelayerType.Burn:
          relayConfig =
            serviceConfig.RelayConfig[
              configuration()[process.env[RUNTIME_ENV]]['blockchain'][
                'burn_relayer'
              ]
            ];
          break;
        case RelayerType.Lock:
          relayConfig =
            serviceConfig.RelayConfig[
              configuration()[process.env[RUNTIME_ENV]]['blockchain'][
                'lock_relayer'
              ]
            ];
          break;
        default:
          throw new InternalServerErrorException('invalid relayer type');
      }

      const credentials = {
        apiKey: relayConfig['apiKey'],
        apiSecret: relayConfig['apiSecret'],
      };
      this.relayProviders[relayerType] = new DefenderRelayProvider(credentials);
      this.relaySigners[relayerType] = new DefenderRelaySigner(
        credentials,
        this.relayProviders[relayerType],
        {
          speed: 'fast',
        },
      );
    }

    return {
      provider: this.relayProviders[relayerType],
      signer: this.relaySigners[relayerType],
    };
  }

  // TODO: make get contract a service
  getContract(address: string, relayerType: number): Contract {
    if (!serviceConfig.NftContractABISelector[address]) {
      throw new InternalServerErrorException(
        `${address} is not a known contract address for ABI`,
      );
    }
    const nftContractABI = serviceConfig.NftContractABISelector[address];
    var abiType;
    switch (nftContractABI) {
      case ContractType.ERC721:
        abiType = serviceConfig.ERC721ABI;
        break;
      case ContractType.ERC721Registry:
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
        const { signer } = this.getRelaySigner(relayerType);
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

  async getRetrievalManager(
    collectionAddress: string,
    relayerType: number,
  ): Promise<Contract> {
    // cache the contract obj in class variable
    if (this.retrievalManagers == undefined) {
      this.retrievalManagers = {};
    }
    // return cached contract obj if we already have it, otherwise create one
    if (this.retrievalManagers[collectionAddress] != undefined) {
      return this.retrievalManagers[collectionAddress];
    } else {
      try {
        const nftContract = this.getContract(collectionAddress, relayerType);
        const retrievalManagerAddress = await nftContract.retrievalManager();
        const { signer } = this.getRelaySigner(relayerType);
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
    const nftContract = this.getContract(collection, RelayerType.Readonly);
    const retrievalManager = await this.getRetrievalManager(
      collection,
      RelayerType.Readonly,
    );
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
    const nftContract = this.getContract(collection, RelayerType.Readonly);
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

  async getChainid(): Promise<number> {
    const { provider } = this.getRelaySigner(RelayerType.Readonly);
    const network = await provider.getNetwork();
    return network.chainId;
  }

  async sanityCheck(): Promise<[boolean, any]> {
    try {
      const chainid = await this.getChainid();
      const readonlyRelayer =
        configuration()[process.env[RUNTIME_ENV]]['blockchain'][
          'readonly_relayer'
        ];
      const readonlyRelayerConfig = serviceConfig.RelayConfig[readonlyRelayer];
      const mintRelayer =
        configuration()[process.env[RUNTIME_ENV]]['blockchain']['mint_relayer'];
      const mintRelayerConfig = serviceConfig.RelayConfig[mintRelayer];
      const burnRelayer =
        configuration()[process.env[RUNTIME_ENV]]['blockchain']['burn_relayer'];
      const burnRelayerConfig = serviceConfig.RelayConfig[burnRelayer];
      const lockRelayer =
        configuration()[process.env[RUNTIME_ENV]]['blockchain']['lock_relayer'];
      const lockRelayerConfig = serviceConfig.RelayConfig[lockRelayer];
      return [
        true,
        {
          chainid: chainid,
          contracts: serviceConfig.NftContractABISelector,
          relayConfig: {
            readonly_relayer: `${readonlyRelayer}:${
              readonlyRelayerConfig['address']
            }:${readonlyRelayerConfig['apiKey'].substr(0, 8)}******`,
            mint_relayer: `${mintRelayer}:${
              mintRelayerConfig['address']
            }:${mintRelayerConfig['apiKey'].substr(0, 8)}******`,
            burn_relayer: `${burnRelayer}:${
              burnRelayerConfig['address']
            }:${burnRelayerConfig['apiKey'].substr(0, 8)}******`,
            lock_relayer: `${lockRelayer}:${
              lockRelayerConfig['address']
            }:${lockRelayerConfig['apiKey'].substr(0, 8)}******`,
          },
        },
      ];
    } catch (error) {
      console.log(error);
      return [false, { error: JSON.stringify(error) }];
    }
  }

  async mintToken(
    collection: string,
    id: number,
    owner: string,
    tokenURI: string,
  ) {
    const nftContract = this.getContract(collection, RelayerType.Mint);
    this.logger.log(`Safe mint: ${owner}, ${id}, ${tokenURI}`);
    // update owner based on contract type
    const nftContractType = serviceConfig.NftContractABISelector[collection];
    switch (nftContractType) {
      case ContractType.ERC721:
        break;
      case ContractType.ERC721Registry:
        owner = ethers.utils.id(owner);
        break;
    }
    const tx_config =
      configuration()[process.env[RUNTIME_ENV]]['blockchain']['tx_config'];
    const mintTx = await nftContract.safeMint(owner, id, tokenURI, tx_config);
    return mintTx.hash;
  }

  async lockToken(collection: string, token_id: number, hash: string) {
    try {
      const nftContract = this.getContract(collection, RelayerType.Lock);
      const retrievalManager = await this.getRetrievalManager(
        collection,
        RelayerType.Lock,
      );
      const tx_config =
        configuration()[process.env[RUNTIME_ENV]]['blockchain']['tx_config'];
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
        configuration()[process.env[RUNTIME_ENV]]['blockchain']['tx_config'];
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
        configuration()[process.env[RUNTIME_ENV]]['blockchain']['tx_config'];
      var burnTx;
      // contract type by collection
      const nftContractABI = serviceConfig.NftContractABISelector[collection];
      // burn token based on contract type
      switch (nftContractABI) {
        case ContractType.ERC721:
          const retrievalManager = await this.getRetrievalManager(
            collection,
            RelayerType.Burn,
          );
          burnTx = await retrievalManager.burn(token_id, tx_config);
          break;
        case ContractType.ERC721Registry:
          const nftContract = this.getContract(collection, RelayerType.Burn);
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
    const { provider } = this.getRelaySigner(RelayerType.Readonly);
    const receipt = await provider.getTransactionReceipt(tx_hash);
    return receipt;
  }
}
