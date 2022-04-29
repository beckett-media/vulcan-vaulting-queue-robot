import { sha256 } from 'ethers/lib/utils';
import { createReadStream, unlinkSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import configuration from 'src/config/configuration';

import { Injectable, Logger } from '@nestjs/common';
import pinataClient, * as Pinata from '@pinata/sdk';

import { serviceConfig } from './ipfs.service.config';
import { DetailedLogger } from 'src/logger/detailed.logger';

@Injectable()
export class IPFSService {
  private readonly logger = new DetailedLogger('IPFSService', {
    timestamp: true,
  });
  pinataClient: Pinata.PinataClient;

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
}
