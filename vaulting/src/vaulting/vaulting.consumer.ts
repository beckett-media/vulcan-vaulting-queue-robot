import { Job } from 'bull';
import configuration from '../config/configuration';

import { Process, Processor } from '@nestjs/bull';
import { InternalServerErrorException, Logger } from '@nestjs/common';
import { BlockchainService } from '../blockchain/blockchain.service';
import { DatabaseService } from '../database/database.service';
import { IPFSService } from '../ipfs/ipfs.service';
import { BurnJobResult, MintJobResult } from '../config/enum';
import { BigNumber } from 'ethers';

@Processor(configuration()[process.env['runtime']]['queue']['mint'])
export class MintNFTConsumer {
  private readonly logger = new Logger('MintNFTConsumer');
  constructor(
    private blockchainService: BlockchainService,
    private databaseService: DatabaseService,
    private ipfsService: IPFSService,
  ) {}

  @Process()
  async mintNFT(job: Job<unknown>) {
    //TODO: check if token id already minted
    this.logger.log(`Mint consumer: ${JSON.stringify(job.data)}`);
    const beckett_id = job.data['nft_record_uid'];
    const collection = job.data['collection'].toLowerCase();
    var progress = MintJobResult.JobReceived;
    var tx_hash: string;
    var token_id: number;
    try {
      // step 0: check if we already vaulted the item
      const vaultingDuplicated =
        await this.databaseService.isVaultingDuplicated(beckett_id);
      if (vaultingDuplicated == true) {
        progress = MintJobResult.VaultDuplicated;
        throw new InternalServerErrorException('beckett item already vaulted');
      }

      // TODO: given token id in job if it is previously reserved
      // step 1: determine token id
      // step 2: save the beckket_id <=> token id mapping
      // step 3: save the token id used
      const result = await this.databaseService.createNewVaulting(
        beckett_id,
        collection,
      );
      progress = result.progress;
      token_id = result.token_id;

      // step 4: pin image and media
      const imagePin = await this.ipfsService.pinMedia(
        job.data['image_format'],
        job.data['image'],
      );
      const imageHash = imagePin['IpfsHash'];
      const animationPin = await this.ipfsService.pinMedia(
        job.data['animation_format'],
        job.data['animation'],
      );
      var animationHash = null;
      if (animationPin != null) {
        animationHash = animationPin['IpfsHash'];
      }
      progress = MintJobResult.ImagePined;

      // step 5: pin metadata
      const metaData = this.ipfsService.getMetaData(
        job.data['name'],
        job.data['description'],
        imageHash,
        animationHash,
        beckett_id,
      );
      const metaDataPin = await this.ipfsService.pinMetadata(
        metaData,
        beckett_id,
      );
      progress = MintJobResult.MetadataPined;
      this.logger.log(`Meta data pin: ${JSON.stringify(metaDataPin)}`);

      // step 6: send mint transaction
      const tokenURI = `ipfs://${metaDataPin['IpfsHash']}`;
      const owner = job.data['owner'];
      tx_hash = await this.blockchainService.mintToken(
        collection,
        token_id,
        owner,
        tokenURI,
      );
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

  constructor(
    private blockchainService: BlockchainService,
    private databaseService: DatabaseService,
  ) {}

  @Process()
  async burnNFT(job: Job<unknown>) {
    this.logger.log('burn nft:', job.data);
    const collection = job.data['collection'].toLowerCase() as string;
    const token_id = job.data['token_id'] as number;
    const beckett_id = job.data['nft_record_uid'] as string;
    var progress = BurnJobResult.JobReceived;

    // check if nft is minted on chain
    const isNFTMinted = this.blockchainService.nftMinted(collection, token_id);
    if (!isNFTMinted) {
      return {
        tx_hash: null,
        error: `Could not find NFT token: ${collection}, ${token_id}`,
        status: progress,
      };
    }

    progress = BurnJobResult.NFTVerified;
    const entity = await this.databaseService.getVaultingById(beckett_id);
    this.logger.log(`db result ${token_id}, ${collection}`);
    this.logger.log(`db result ${entity.token_id}, ${entity.collection}`);

    // sanity check the database record match
    if (entity.token_id == token_id && entity.collection == collection) {
      progress = BurnJobResult.BeckettVerified;
      var result = await this.blockchainService.burnToken(collection, token_id);
      if (result.status == BurnJobResult.TxSent) {
        return result;
      } else {
        result['status'] = progress;
        return result;
      }
    } else {
      return {
        tx_hash: null,
        error: `Beckett sanity check error: ${beckett_id}, ${token_id}, ${collection}`,
        status: progress,
      };
    }
  }
}

@Processor(configuration()[process.env['runtime']]['queue']['lock'])
export class LockNFTConsumer {
  private readonly logger = new Logger('LockNFTConsumer');
  constructor(private blockchainService: BlockchainService) {}

  @Process()
  async lockNFT(job: Job<unknown>) {
    this.logger.log('lock nft:', job.data);
    const result = await this.blockchainService.lockToken(
      job.data['collection'],
      job.data['token_id'],
      job.data['hash'],
    );
    return result;
  }
}

@Processor(configuration()[process.env['runtime']]['queue']['exec'])
export class ExecConsumer {
  private readonly logger = new Logger('ExecConsumer');

  constructor(private blockchainService: BlockchainService) {}

  @Process()
  async execute(job: Job<unknown>) {
    this.logger.log('execute forward request:', job.data);
    const forwardRequest = {
      from: job.data['from'],
      to: job.data['to'],
      value: BigNumber.from(job.data['value']),
      gas: BigNumber.from(job.data['gas']),
      nonce: BigNumber.from(job.data['nonce']),
      data: job.data['data'],
    };
    const signature = job.data['signature'];
    this.logger.log(
      `call blockchain service /execute: ${JSON.stringify(
        forwardRequest,
      )}, ${signature}`,
    );
    const result = await this.blockchainService.execute(
      forwardRequest,
      signature,
    );
    return result;
  }
}
