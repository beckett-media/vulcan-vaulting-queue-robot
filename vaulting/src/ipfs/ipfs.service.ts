import { sha256 } from 'ethers/lib/utils';
import { createReadStream, unlinkSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import configuration, { RUNTIME_ENV } from '../config/configuration';

import { Injectable, Logger } from '@nestjs/common';
import pinataClient, * as Pinata from '@pinata/sdk';

import { serviceConfig } from './ipfs.service.config';
import { DetailedLogger } from '../logger/detailed.logger';

@Injectable()
export class IPFSService {
  private readonly logger = new DetailedLogger('IPFSService', {
    timestamp: true,
  });
  pinataClient: Pinata.PinataClient;

  getPinataClient() {
    if (this.pinataClient == undefined) {
      const pinataConfig =
        serviceConfig.Pinata[
          configuration()[process.env[RUNTIME_ENV]]['pinata']
        ];
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
    attributes: {},
  ) {
    var metadata = {
      name: name,
      description: description,
      beckett_id: beckett_id,
      attributes: attributes,
      image: `ipfs://${imageHash}`,
    };

    if (animationHash != null) {
      metadata['animation_url'] = `ipfs://${animationHash}`;
    }

    return metadata;
  }

  async sanityCheck(): Promise<[boolean, any]> {
    const pinataConfig =
      serviceConfig.Pinata[configuration()[process.env[RUNTIME_ENV]]['pinata']];
    const settings = {
      apiKey: pinataConfig['apiKey'].substr(0, 6) + '**************',
    };

    try {
      // pin a file with random content
      const result = await this.getPinataClient().testAuthentication();
      if (result.authenticated) {
        const randomString = Math.random().toString(36);
        const mediaBuffer = Buffer.from(randomString);
        const tmpFileName = `${tmpdir()}/${Buffer.from(
          sha256(mediaBuffer),
        ).toString('hex')}.sanitycheck}`;
        writeFileSync(tmpFileName, mediaBuffer);
        const mediaStream = createReadStream(tmpFileName);
        const mediaPin = await this.getPinataClient().pinFileToIPFS(
          mediaStream,
        );
        unlinkSync(tmpFileName);

        return [true, settings];
      }
      return [false, { error: 'Not authenticated', config: settings }];
    } catch (e) {
      return [false, { error: JSON.stringify(e), config: settings }];
    }
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
    const env = process.env[RUNTIME_ENV];
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
