import {
  DefenderRelayProvider,
  DefenderRelaySigner,
} from 'defender-relay-client/lib/ethers';
import { Contract, ethers, utils } from 'ethers';
import configuration from '../config/configuration';

import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';

import { serviceConfig } from './blockchain.service.config';
import { isString } from 'class-validator';
import {
  BurnJobResult,
  ExecJobResult,
  LockJobResult,
  TokenStatus,
} from '../config/enum';

@Injectable()
export class BlockchainService {
  private readonly logger = new Logger('BlockchainService');
  nftContracts: {
    [key: string]: Contract;
  };
  private retrievalManager: Contract;
  private minimalForwarder: Contract;
  private relaySigner: DefenderRelaySigner;
  private relayProvider: DefenderRelayProvider;

  constructor() {
    // TODO: move this to its own function
    if (
      this.retrievalManager == undefined ||
      this.minimalForwarder == undefined
    ) {
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

  async nftLocked(collection: string, id: number) {
    const nftContract = this.getContract(collection);
    try {
      const owner = await nftContract.ownerOf(id);
      if (isString(owner) && owner == this.retrievalManager.address) {
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
    const tx_config =
      configuration()[process.env['runtime']]['blockchain']['tx_config'];
    const mintTx = await nftContract.safeMint(owner, id, tokenURI, tx_config);
    return mintTx.hash;
  }

  async lockToken(collection: string, token_id: number, hash: string) {
    try {
      const nftContract = this.getContract(collection);
      const tx_config =
        configuration()[process.env['runtime']]['blockchain']['tx_config'];
      var progress: number;

      // # 1: call retrieval manager's lock function
      const hashBytes32 = utils.arrayify(hash);
      const lockTx = await this.retrievalManager.lock(token_id, hashBytes32);
      progress = LockJobResult.HashStoreTxSend;
      const lockReceipt = await lockTx.wait(1);
      this.logger.log(
        `lock tx: ${lockTx.hash}, receipt status: ${lockReceipt.status}`,
      );

      // # 2: call nft contract's transferFrom to actually transfer the token
      const from = nftContract.signer.getAddress();
      const transferTx = await nftContract.transferFrom(
        from,
        this.retrievalManager.address,
        token_id,
        tx_config,
      );
      this.logger.log(`transferFrom tx: ${transferTx.hash}`);
      progress = LockJobResult.TransferTxSend;

      return {
        tx_hash: transferTx.hash,
        error: null,
        status: progress,
      };
    } catch (error) {
      this.logger.log(`lock/tranferFrom error: ${error}`);
      return {
        tx_hash: null,
        error: error.toString(),
        status: progress,
      };
    }
  }

  async execute(forwardRequest, signature: Uint8Array) {
    try {
      const tx_config =
        configuration()[process.env['runtime']]['blockchain']['tx_config'];
      const execTx = await this.minimalForwarder.execute(
        forwardRequest,
        signature,
        tx_config,
      );
      this.logger.log(`execute forward request tx: ${execTx.hash}`);
      return {
        tx_hash: execTx.hash,
        error: null,
        status: ExecJobResult.TxSent,
      };
    } catch (error) {
      this.logger.log(`execute forward request error: ${error}`);
      return {
        tx_hash: null,
        error: error.toString(),
        status: null,
      };
    }
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
