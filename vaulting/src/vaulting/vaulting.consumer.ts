import {
  DefenderRelaySigner,
  DefenderRelayProvider,
} from 'defender-relay-client/lib/ethers';
import { Contract, ethers } from 'ethers';
import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { serviceConfig } from './vaulting.service.config';
import {
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { createReadStream, readFileSync, unlinkSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import pinataClient, * as Pinata from '@pinata/sdk';
import { sha256 } from 'ethers/lib/utils';
import configuration from './config/configuration';
import { getManager, Repository } from 'typeorm';
import { Token, Vaulting } from './vaulting.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { MintStatus } from './dtos/vaulting.dto';
import { isNumber } from 'class-validator';

export enum MintJobResult {
  JobReceived = 0,
  VaultDuplicated = 1,
  TokenIdSet = 2,
  VaultingSaved = 3,
  TokenStatusSaved = 4,
  ImagePined = 5,
  MetadataPined = 6,
  TxSent = 7,
  TokenMinted = 8,
}

export enum BurnJobResult {
  JobReceived = 0,
  NFTVerified = 1,
  BeckettVerified = 2,
  TxSent = 3,
  TokenBurned = 4,
}

export enum TokenStatus {
  NotMinted = 0,
  Minted = 1,
  Burned = 2,
}

export const MintJobResultReadable = {
  0: 'JobReceived',
  1: 'VaultDuplicated',
  2: 'TokenIdSet',
  3: 'VaultingSaved',
  4: 'TokenStatusSaved',
  5: 'ImagePined',
  6: 'MetadataPined',
  7: 'TxSent',
  8: 'TokenMinted',
};

export const BurnJobResultReadable = {
  0: 'JobReceived',
  1: 'NFTExists',
  2: 'BeckettVaultingRecordExists',
  3: 'TxSend',
  4: 'TokenBurned',
};

export const TokenStatusReadable = {
  0: 'NotMinted',
  1: 'Minted',
  2: 'Burned',
};

const min_token_id = 100;

@Processor(configuration()[process.env['runtime']]['queue']['mint'])
export class MintNFTConsumer {
  private readonly logger = new Logger('MintNFTConsumer');

  nftContracts: {
    [key: string]: Contract;
  };
  pinataClient: Pinata.PinataClient;

  constructor(
    @InjectRepository(Vaulting) private vaultingRepo: Repository<Vaulting>,
    @InjectRepository(Token) private tokenRepo: Repository<Token>,
  ) {}

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

  getPinataClient() {
    if (this.pinataClient == undefined) {
      const pinataConfig =
        serviceConfig.Pinata[configuration()[process.env['runtime']]['pinata']];
      this.pinataClient = pinataClient(
        pinataConfig['apiKey'],
        pinataConfig['apiSecret'],
      );
    }
    return this.pinataClient;
  }

  getMetaData(
    name: string,
    description: string,
    imageHash: string,
    animationHash: string,
    beckett_id: string,
  ) {
    var metadata = {
      name: name,
      description: description,
      beckett_id: beckett_id,
      image: `ipfs://${imageHash}`,
    };

    if (animationHash != null) {
      metadata['animation_url'] = `ipfs://${animationHash}`;
    }

    return metadata;
  }

  async pinMedia(media_format: string, media: string) {
    if (media_format == '' || media == '') {
      return null;
    }
    const mediaBuffer = Buffer.from(media, 'base64');
    const tmpFileName = `${tmpdir()}/${Buffer.from(
      sha256(mediaBuffer),
    ).toString('hex')}.${media_format}`;
    this.logger.log(`Tmp file name: ${tmpFileName}`);
    writeFileSync(tmpFileName, mediaBuffer);
    const mediaStream = createReadStream(tmpFileName);
    const mediaPin = await this.getPinataClient().pinFileToIPFS(mediaStream);
    unlinkSync(tmpFileName);
    return mediaPin;
  }

  async pinMetadata(metaData: {}, beckett_id: number) {
    const env = process.env['runtime'];
    const options = {
      pinataMetadata: {
        name: `metadata_${beckett_id}_${env}`,
      },
    };
    const metadataPin = await this.getPinataClient().pinJSONToIPFS(
      metaData,
      options,
    );
    return metadataPin;
  }

  //TODO: better token id management
  //what if mint into a unknown collection, what's its max id
  async getTokenId(beckett_id: string, collection: string) {
    // if we have the beckett_id <=> token id mapping stored, return its token id
    // so that beckett_id will always map to the same token id
    const vaulting = await this.vaultingRepo.findOne({
      beckett_id: beckett_id,
    });
    if (vaulting != undefined && isNumber(vaulting.token_id)) {
      return vaulting.token_id;
    }

    // otherwise, this is the first time we see this beckett id
    // then issue a new token id
    const result = await this.tokenRepo
      .createQueryBuilder('token')
      .select('MAX(id)', 'max')
      .where('collection = :collection', { collection: collection })
      .groupBy('collection')
      .getRawOne();
    if (result == undefined) {
      this.logger.log(`Max id: ${min_token_id}`);
      return min_token_id;
    } else {
      const max_id = result['max'] as number;
      this.logger.log(`Max id: ${max_id}`);
      return max_id + 1;
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
    const mintTx = await nftContract.safeMint(owner, id, tokenURI);
    return mintTx.hash;
  }

  async createVaulting(
    beckett_id: string,
    collection: string,
    token_id: number,
  ) {
    const vaulting = this.vaultingRepo.create({
      beckett_id,
      collection,
      token_id,
    });
    await this.vaultingRepo.save(vaulting);
  }

  // TODO: switch to check blockchain directly
  async isVaultingDuplicated(beckett_id: string) {
    const vaulting = await this.vaultingRepo.findOne({
      beckett_id: beckett_id,
    });
    if (vaulting != undefined) {
      const token = await this.tokenRepo.findOne({
        collection: vaulting.collection,
        id: vaulting.token_id,
      });
      this.logger.log(`vaulting duplicate: ${JSON.stringify(vaulting)}`);
      this.logger.log(`token duplicate: ${JSON.stringify(token)}`);
      if (token != undefined) {
        if (
          token.status == TokenStatus.Minted ||
          token.status == TokenStatus.Burned
        ) {
          return true;
        }
      }
    }

    return false;
  }

  @Process()
  async mintNFT(job: Job<unknown>) {
    //TODO: check if token id already minted
    this.logger.log(`Mint consumer: ${JSON.stringify(job.data)}`);
    const beckett_id = job.data['beckett_id'];
    const collection = job.data['collection'];
    var progress = MintJobResult.JobReceived;
    var tx_hash: string;
    try {
      // step 0: check if we already vaulted the item
      const vaultingDuplicated = await this.isVaultingDuplicated(beckett_id);
      if (vaultingDuplicated == true) {
        progress = MintJobResult.VaultDuplicated;
        throw new Error('beckett item already vaulted');
      }

      // step 1: determine token id
      // TODO: given token id in job
      const token_id = await this.getTokenId(beckett_id, collection);
      this.logger.log(`token id: ${token_id}`);
      progress = MintJobResult.TokenIdSet;

      // Step 2 & 3 in one db transaction
      await getManager().transaction(async (transactionalEntityManager) => {
        // step 2: save the beckket_id <=> token id mapping
        const vaulting = this.vaultingRepo.create({
          beckett_id,
          collection,
          token_id,
        });
        await this.vaultingRepo.save(vaulting);
        progress = MintJobResult.VaultingSaved;

        // step 3: save the token id used
        const token = this.tokenRepo.create({
          collection: collection,
          id: token_id,
          status: TokenStatus.NotMinted,
        });
        this.tokenRepo.save(token);
        progress = MintJobResult.TokenStatusSaved;
      });

      // step 4: pin image and media
      const imagePin = await this.pinMedia(
        job.data['image_format'],
        job.data['image'],
      );
      const imageHash = imagePin['IpfsHash'];
      const animationPin = await this.pinMedia(
        job.data['animation_format'],
        job.data['animation'],
      );
      var animationHash = null;
      if (animationPin != null) {
        animationHash = animationPin['IpfsHash'];
      }
      progress = MintJobResult.ImagePined;

      // step 5: pin metadata
      const metaData = this.getMetaData(
        job.data['name'],
        job.data['description'],
        imageHash,
        animationHash,
        beckett_id,
      );
      const metaDataPin = await this.pinMetadata(metaData, beckett_id);
      progress = MintJobResult.MetadataPined;
      this.logger.log(`Meta data pin: ${JSON.stringify(metaDataPin)}`);

      // step 6: send mint transaction
      const tokenURI = `ipfs://${metaDataPin['IpfsHash']}`;
      const owner = job.data['owner'];
      tx_hash = await this.mintToken(collection, token_id, owner, tokenURI);
      progress = MintJobResult.TxSent;
      this.logger.log(
        `End of job: collection: ${collection}, token id: ${token_id}, owner: ${owner}, uri: ${tokenURI}`,
      );
      return {
        tx_hash: tx_hash,
        error: null,
        status: progress,
      };
    } catch (error) {
      this.logger.log(`MintNFT Error: ${error}`);
      return {
        tx_hash: tx_hash,
        error: error.toString(),
        status: progress,
      };
    }
  }
}

@Processor(configuration()[process.env['runtime']]['queue']['burn'])
export class BurnNFTConsumer {
  private readonly logger = new Logger('BurnNFTConsumer');
  nftContracts: {
    [key: string]: Contract;
  };
  private retrievalManager: Contract;

  constructor(
    @InjectRepository(Vaulting) private vaultingRepo: Repository<Vaulting>,
    @InjectRepository(Token) private tokenRepo: Repository<Token>,
  ) {
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

  @Process()
  async burnNFT(job: Job<unknown>) {
    console.log('burn nft:', job.data);
    const collection = job.data['collection'] as string;
    const token_id = job.data['token_id'] as Number;
    const beckett_id = job.data['beckett_id'] as string;
    var nftContract: Contract;
    var owner: string;
    var progress = BurnJobResult.JobReceived;

    try {
      nftContract = this.getContract(collection);
    } catch (error) {
      return {
        tx_hash: null,
        error: error.toString(),
        status: progress,
      };
    }
    this.logger.log(`get contract: ${collection}`);
    try {
      owner = await nftContract.ownerOf(token_id);
    } catch (error) {
      return {
        tx_hash: null,
        error: error.toString(),
        status: progress,
      };
    }
    progress = BurnJobResult.NFTVerified;
    this.logger.log(`owner: ${owner}`);
    const entity = await this.vaultingRepo.findOne(beckett_id);
    this.logger.log(`db result ${token_id}, ${collection}`);
    this.logger.log(`db result ${entity.token_id}, ${entity.collection}`);

    if (entity.token_id == token_id && entity.collection == collection) {
      progress = BurnJobResult.BeckettVerified;
      try {
        const burnTx = await this.retrievalManager.burn(token_id);
        this.logger.log(`burn tx: ${burnTx.hash}`);
        progress = BurnJobResult.TxSent;
        return {
          tx_hash: burnTx.hash,
          error: null,
          status: progress,
        };
      } catch (error) {
        this.logger.log(`burn error: token not transfered yet? ${error}`);
        return {
          tx_hash: null,
          error: null,
          status: progress,
        };
      }
    }

    return {
      tx_hash: null,
      error: `Beckett sanity check error: ${beckett_id}, ${token_id}, ${collection}`,
      status: progress,
    };
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
}
