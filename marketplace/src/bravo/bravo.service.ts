import { Injectable } from '@nestjs/common';
import got from 'got/dist/source';
import configuration from 'src/config/configuration';
import { DetailedLogger } from 'src/logger/detailed.logger';

@Injectable()
export class BravoService {
    private readonly logger = new DetailedLogger('BravoService');

    async mintNFT(
        username: string,
        title: number,
        itemId: number,
        description: number,
        imageformat: string,
        imagebase64: string,
      ) {
        const env = process.env['runtime'];
        const config = configuration()[env];
        const url = config["bravo"]["mint"]["url"];
        const headers = config["bravo"]["mint"]["headers"];
        const collection = config["bravo"]["mint"]["collection"];
        const payload = {
                "collection": collection,
                "owner": username,
                "nft_record_uid": itemId,
                "name": title,
                "description": description,
                "image_format": imageformat,
                "image": imagebase64,
                "animation_format": "",
                "animation": ""
        };
        this.logger.log(
          `Mint new nft token by Bravo API: url => ${url}, header => ${JSON.stringify(
            headers,
          )} payload => ${JSON.stringify(payload)}`,
        );
        try {
          const response = await got
            .post(url, { json: payload, headers: headers })
            .json();
          this.logger.log(
            `update token status delta response => ${JSON.stringify(response)}`,
          );
        } catch (error) {
          this.logger.error(`update token status to Delta API error: ${error}`);
        }
      }
}
