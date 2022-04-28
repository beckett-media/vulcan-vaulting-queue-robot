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
    /**
     * {
  "nft_record_uid": "c19ce128-6cc8-4882-8e10-789e3701f953",
  "status": "MOCK_MINTED_YW",
  "nft_token_id": 1000006,
  "nft_collection_address": "0x17E95B844F8BDb32f0bcf57542F1E5CD79A2B342"
}
     */
    const payload2 = {
      nft_record_uid: 'c19ce128-6cc8-4882-8e10-789e3701f953',
      status: 'MOCK_MINTED_YW2',
      nft_token_id: 1000006,
      nft_collection_address: '0x17E95B844F8BDb32f0bcf57542F1E5CD79A2B342',
    };
    const response = await got
      .put(url, { json: payload2, headers: headers })
      .json();
    this.logger.log(
      `update token status: payload => ${JSON.stringify(
        payload,
      )}, response => ${JSON.stringify(response)}`,
    );
  }
}
