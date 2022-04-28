import { Web3Provider } from '@ethersproject/providers';
import { Injectable, Logger } from '@nestjs/common';
import got from 'got/dist/source';
import { TokenStatusReadable } from 'src/config/enum';
import { DatabaseService } from 'src/database/database.service';
import { deltaConfig } from './delta.service.config';

@Injectable()
export class DeltaService {
  private readonly logger = new Logger('DeltaService');

  constructor(private databaseService: DatabaseService) {}

  async updateTokenStatus(
    collection: string,
    token_id: number,
    status: number,
  ) {
    const url = deltaConfig.updateTokenStatusURL;
    const headers = deltaConfig.updateTokenStatusHeaders;
    const nft_record_uid = await this.databaseService.getVaultingUUID(
      collection,
      token_id,
    );
    const payload = {
      nft_record_uid: nft_record_uid,
      status: TokenStatusReadable[status],
      nft_token_id: token_id,
      nft_collection_address: collection,
    };
    this.logger.log(
      `update token status to Delta API: url => ${url}, header => ${JSON.stringify(
        headers,
      )} payload => ${JSON.stringify(payload)}`,
    );
    try {
      const response = await got
        .put(url, { json: payload, headers: headers })
        .json();
      this.logger.log(`update token status delta response => ${response}`);
    } catch (error) {
      this.logger.error(`update token status to Delta API error: ${error}`);
    }
  }
}
