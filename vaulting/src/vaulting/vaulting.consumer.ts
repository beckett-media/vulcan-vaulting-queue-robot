import {
  DefenderRelaySigner,
  DefenderRelayProvider,
} from 'defender-relay-client/lib/ethers';
import { Contract, ethers } from 'ethers';
import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { serviceConfig } from './vaulting.service.config';
import { InternalServerErrorException, Logger } from '@nestjs/common';
import { createReadStream, readFileSync, unlinkSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import pinataClient, * as Pinata from '@pinata/sdk';
import { sha256 } from 'ethers/lib/utils';

@Processor('beckett_mint')
export class MintNFTConsumer {
  private readonly logger = new Logger('MintNFTConsumer');

  nftContracts: {
    [key: string]: Contract;
  };
  pinataClient: Pinata.PinataClient;

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

  getPinataClient() {
    if (this.pinataClient == undefined) {
      const pinataConfig = serviceConfig.Pinata['vaulting_test'];
      this.pinataClient = pinataClient(
        pinataConfig['apiKey'],
        pinataConfig['apiSecret'],
      );
    }
    return this.pinataClient;
  }

  getMetaData(name: string, description: string, image: string) {
    return {
      name: name,
      description: description,
      image: image,
    };
  }

  async pinImage(image_format: string, image: string) {
    const imageBuffer = Buffer.from(image, 'base64');
    const tmpFileName = `${tmpdir()}/${Buffer.from(
      sha256(imageBuffer),
    ).toString('hex')}.${image_format}`;
    this.logger.log(tmpFileName);
    writeFileSync(tmpFileName, imageBuffer);
    const imageStream = createReadStream(tmpFileName);
    const imagePin = await this.getPinataClient().pinFileToIPFS(imageStream);
    unlinkSync(tmpFileName);
    return imagePin;
  }

  async pinMetadata(metaData: {}, beckett_id: number) {
    const options = {
      pinataMetadata: {
        name: `metadata_${beckett_id}`,
      },
    };
    const metadataPin = await this.getPinataClient().pinJSONToIPFS(
      metaData,
      options,
    );
    return metadataPin;
  }

  getTokenId() {
    const floor = 1000000;
    const max = 1000000;
    return floor + Math.floor(Math.random() * max);
  }

  async mintToken(collection: string, owner: string, tokenURI: string) {
    const nftContract = this.getContract(collection);
    const id = this.getTokenId();
    this.logger.log(owner, id, tokenURI);
    const mintTx = await nftContract.safeMint(owner, id, tokenURI);
  }

  @Process()
  async mintNFT(job: Job<unknown>) {
    this.logger.log('mint consumer:', job.data);
    try {
      // step 1: pin image
      const imagePin = await this.pinImage(
        job.data['image_format'],
        job.data['image'],
      );
      // step 2: pin metadata
      const metaData = {
        name: job.data['name'],
        description: job.data['description'],
        image: `ipfs://${imagePin['IpfsHash']}`,
      };
      const metaDataPin = await this.pinMetadata(
        metaData,
        job.data['beckett_id'],
      );
      // step 3: mint the nft token
      this.logger.log(metaDataPin);
      const tokenURI = `ipfs://${metaDataPin['IpfsHash']}`;
      await this.mintToken(job.data['collection'], job.data['owner'], tokenURI);
    } catch (error) {
      this.logger.log(error);
    }
  }
}

@Processor('beckett_burn')
export class BurnNFTConsumer {
  @Process()
  async burnNFT(job: Job<unknown>) {
    console.log('burn nft:', job.data);
    return {};
  }
}
