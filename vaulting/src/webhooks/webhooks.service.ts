import { Injectable, Logger } from '@nestjs/common';
import { BlockchainService } from 'src/blockchain/blockchain.service';
import { TokenStatus } from 'src/config/enum';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger('WebhookServer');

  constructor(
    private databaseService: DatabaseService,
    private blockchainService: BlockchainService,
  ) {}

  async handleMintEvent(collection: string, tokenId: number, reason: any) {
    this.logger.log(`Event safeMint: ${collection}, ${tokenId}`);
    const minted = await this.blockchainService.nftMinted(collection, tokenId);
    if (minted) {
      await this.databaseService.updateTokenStatus(
        collection,
        tokenId,
        TokenStatus.Minted,
      );
    }
  }

  async handleBurnEvent(collection: string, tokenId: number, reason: any) {
    this.logger.log(`Event burn: ${collection}, params: ${tokenId}`);
    const burned = !(await this.blockchainService.nftMinted(
      collection,
      tokenId,
    ));
    if (burned) {
      await this.databaseService.updateTokenStatus(
        collection,
        tokenId,
        TokenStatus.Burned,
      );
    }
  }

  async handleTransferEvent(collection: string, reason: any) {
    this.logger.log(
      `Event Transfer: ${collection}, params: ${JSON.stringify(
        reason['params'],
      )}`,
    );
  }

  async callbackHandler(notification: any) {
    const events = notification['events'];
    for (var i = 0; i < events.length; i++) {
      const event = events[i];
      const collection = event['matchedAddresses'][0].toLowerCase();
      for (var j = 0; j < event['matchReasons'].length; j++) {
        const reason = event['matchReasons'][j];
        this.logger.log(`Event received: ${JSON.stringify(reason)}`);
        if (reason['signature'].includes('Transfer')) {
          await this.handleTransferEvent(collection, reason);
        } else if (reason['signature'].includes('safeMint')) {
          const tokenId = Number(reason['params']['tokenId_']);
          await this.handleMintEvent(collection, tokenId, reason);
        } else if (reason['signature'].includes('burn')) {
          const tokenId = Number(reason['params']['tokenId_']);
          await this.handleBurnEvent(collection, tokenId, reason);
        }
      }
    }
  }
}
