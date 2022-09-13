import { Injectable } from '@nestjs/common';
import got from 'got/dist/source';
import { VaultingStatus, VaultingStatusReadable } from 'src/config/enum';
import configuration, { RUNTIME_ENV } from '../config/configuration';
import { DetailedLogger } from '../logger/detailed.logger';
import { removeBase64 } from '../util/format';

@Injectable()
export class MarketplaceService {
  private readonly logger = new DetailedLogger('MarketplaceService');

  async sanitycheck(): Promise<[boolean, any]> {
    const env = process.env[RUNTIME_ENV];
    const config = configuration()[env];
    const settings = config['marketplace'];
    const url = settings['mint']['callback_url'];
    // replace 'marketplace' with 'marketplace-sanitycheck' in url using regular expression
    const healthUrl = url.replace(
      '/marketplace/vaulting',
      '/marketplace/health',
    );

    try {
      const response = await got.get(healthUrl).json();
      return [true, { response: response, config: settings }];
    } catch (error) {
      this.logger.error(`marketplace sanitycheck error: ${error}`);
      return [false, { error: error, config: settings }];
    }
  }

  async reportNftStatus(
    type: number,
    status: number,
    chain_id: number,
    item_uuid: string,
    mint_tx_hash: string,
    burn_tx_hash: string,
    collection: string,
    token_id: number,
  ) {
    const env = process.env[RUNTIME_ENV];
    const config = configuration()[env];
    const url = config['marketplace']['mint']['callback_url'];
    const headers = config['marketplace']['mint']['headers'];

    const payload = {
      type: type,
      chain_id: chain_id,
      item_uuid: item_uuid,
      mint_tx_hash: mint_tx_hash,
      burn_tx_hash: burn_tx_hash,
      collection: collection,
      token_id: token_id,
      status: status,
      burn_job_id: 0,
    };

    this.logger.log(
      `Report nft ${token_id} ${
        VaultingStatusReadable[status]
      } to marketplace: url => ${url}, header => ${JSON.stringify(
        headers,
      )}, payload => ${JSON.stringify(removeBase64(payload))}`,
    );

    try {
      const response = await got
        .put(url, { json: payload, headers: headers })
        .json();
      this.logger.log(
        `Report nft ${token_id} ${
          VaultingStatusReadable[status]
        } to marketplace, response => ${JSON.stringify(response)}`,
      );
    } catch (error) {
      this.logger.error(`Report nft minted to marketplace error: ${error}`);
    }
  }
}
