import { Injectable, InternalServerErrorException } from '@nestjs/common';
import got from 'got/dist/source';
import configuration from 'src/config/configuration';
import { DetailedLogger } from 'src/logger/detailed.logger';
import { removeBase64 } from 'src/util/format';

@Injectable()
export class BravoService {
  private readonly logger = new DetailedLogger('BravoService');

  async mintNFT(
    owner: string,
    itemUUID: string,
    title: string,
    description: string,
    imageFormat: string,
    imagebase64: string,
  ): Promise<number> {
    const env = process.env['runtime'];
    const config = configuration()[env];
    const url = config['bravo']['mint']['url'];
    const headers = config['bravo']['mint']['headers'];
    const collection = config['bravo']['mint']['collection'];
    const payload = {
      collection: collection,
      owner: owner,
      nft_record_uid: itemUUID,
      name: title,
      description: description,
      image_format: imageFormat,
      image: imagebase64,
      animation_format: '',
      animation: '',
    };
    this.logger.log(
      `Mint new nft token by Bravo API: url => ${url}, header => ${JSON.stringify(
        headers,
      )} payload => ${JSON.stringify(removeBase64(payload))}`,
    );

    try {
      const response = await got
        .post(url, { json: payload, headers: headers })
        .json();
      this.logger.log(
        `mint new nft token to Bravo API response => ${JSON.stringify(
          response,
        )}`,
      );
      return response['job_id'];
    } catch (error) {
      this.logger.error(`mint new nft token to Bravo API error: ${error}`);
      throw new InternalServerErrorException(
        `Mint new nft token failed: ${error}`,
      );
    }
  }

  async burnNFT(
    itemUUID: string,
    collection: string,
    tokenId: number,
  ): Promise<number> {
    const env = process.env['runtime'];
    const config = configuration()[env];
    const url = config['bravo']['burn']['url'];
    const headers = config['bravo']['burn']['headers'];
    const payload = {
      collection: collection,
      nft_record_uid: itemUUID,
      token_id: tokenId,
    };
    this.logger.log(
      `Burn nft token by Bravo API: url => ${url}, header => ${JSON.stringify(
        headers,
      )} payload => ${JSON.stringify(removeBase64(payload))}`,
    );

    try {
      const response = await got
        .post(url, { json: payload, headers: headers })
        .json();
      this.logger.log(
        `Burn nft token to Bravo API response => ${JSON.stringify(response)}`,
      );
      return response['job_id'];
    } catch (error) {
      this.logger.error(`Burn nft token to Bravo API error: ${error}`);
      throw new InternalServerErrorException(`Burn nft token failed: ${error}`);
    }
  }
}
