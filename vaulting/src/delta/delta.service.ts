import { Web3Provider } from '@ethersproject/providers';
import { Injectable, Logger } from '@nestjs/common';
import { TokenStatusReadable } from 'src/config/enum';
import { DatabaseService } from 'src/database/database.service';
import { deltaConfig } from './delta.service.config';

@Injectable()
export class DeltaService {
  private readonly logger = new Logger('DeltaService');

  constructor() {}

  async updateTokenStatus(
    collection: string,
    token_id: number,
    status: number,
  ) {
    const url = deltaConfig.updateTokenStatusURL;
    const headers = deltaConfig.updateTokenStatusHeaders;
    /*const nft_record_uid = await this.databaseService.getVaultingUUID(
      collection,
      token_id,
    );*/
    const payload = {
      //nft_record_uid: nft_record_uid,
      status: TokenStatusReadable[status],
      nft_token_id: token_id,
      nft_collection_address: collection,
    };
    /*
    const response = got.put(url, { json: payload, headers: headers }).json();
    this.logger.log(
      `update token status: payload => ${payload}, response => ${response}`,
    );*/
  }
}
