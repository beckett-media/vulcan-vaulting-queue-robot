import { Job } from 'bull';
import { Contract } from 'ethers';
import configuration from 'src/config/configuration';

import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { BlockchainService } from 'src/blockchain/blockchain.service';
import { DatabaseService } from 'src/database/database.service';
import { IPFSService } from 'src/ipfs/ipfs.service';
import { BurnJobResult, MintJobResult } from 'src/config/enum';
import { isString } from 'class-validator';

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
    const beckett_id = job.data['beckett_id'];
    const collection = job.data['collection'].toLowerCase();
    var progress = MintJobResult.JobReceived;
    var tx_hash: string;
    try {
      // step 0: check if we already vaulted the item
      const vaultingDuplicated =
        await this.databaseService.isVaultingDuplicated(beckett_id);
      if (vaultingDuplicated == true) {
        progress = MintJobResult.VaultDuplicated;
        throw new Error('beckett item already vaulted');
      }

      // step 1: determine token id
      // TODO: given token id in job
      const token_id = await this.databaseService.getTokenId(
        beckett_id,
        collection,
      );
      this.logger.log(`token id: ${token_id}`);
      progress = MintJobResult.TokenIdSet;

      // Step 2 & 3 in one db transaction
      // step 2: save the beckket_id <=> token id mapping
      // step 3: save the token id used
      progress = await this.databaseService.createNewVaulting(
        beckett_id,
        collection,
        token_id,
      );

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
    private ipfsService: IPFSService,
  ) {}

  @Process()
  async burnNFT(job: Job<unknown>) {
    console.log('burn nft:', job.data);
    const collection = job.data['collection'].toLowerCase() as string;
    const token_id = job.data['token_id'] as number;
    const beckett_id = job.data['beckett_id'] as string;
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

    if (entity.token_id == token_id && entity.collection == collection) {
      progress = BurnJobResult.BeckettVerified;
      var result = await this.blockchainService.burnToken(token_id);
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
