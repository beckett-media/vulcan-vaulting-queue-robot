import { Token, Vaulting } from 'src/database/database.entity';
import { Repository, getManager } from 'typeorm';

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { isNumber } from 'class-validator';
import { MintJobResult, TokenStatus } from 'src/config/enum';
import configuration from 'src/config/configuration';

@Injectable()
export class DatabaseService {
  private readonly logger = new Logger('DatabaseService');

  constructor(
    @InjectRepository(Token) private tokenRepo: Repository<Token>,
    @InjectRepository(Vaulting) private vaultingRepo: Repository<Vaulting>,
  ) {}

  async createNewVaulting(
    beckett_id: string,
    collection: string,
    token_id: number,
  ) {
    var progress;
    await getManager().transaction(async (transactionalEntityManager) => {
      // step 2: save the beckket_id <=> token id mapping
      const vaulting = this.vaultingRepo.create({
        beckett_id,
        collection,
        token_id,
      });
      await this.vaultingRepo.save(vaulting);
      progress = MintJobResult.VaultingSaved;

      // step 3: save the token id used
      const token = this.tokenRepo.create({
        collection: collection,
        id: token_id,
        status: TokenStatus.NotMinted,
      });
      this.tokenRepo.save(token);
      progress = MintJobResult.TokenStatusSaved;
    });

    return progress;
  }

  async getVaultingById(beckett_id: string) {
    const vaulting = await this.vaultingRepo.findOne(beckett_id);
    return vaulting;
  }

  async getTokenStatus(collection: string, token_id: number) {
    const token = await this.tokenRepo.findOne({
      collection: collection,
      id: token_id,
    });
    // by default, return not minted
    if (token) {
      return token.status;
    } else {
      TokenStatus.NotMinted;
    }
  }

  async updateTokenStatus(
    collection: string,
    token_id: number,
    status: number,
  ) {
    // update token table for burned nft
    const token = await this.tokenRepo.findOne({
      collection: collection,
      id: token_id,
    });
    if (token) {
      Object.assign(token, { status: status });
      await this.tokenRepo.save(token);
    }
  }

  // TODO: switch to check blockchain directly
  async isVaultingDuplicated(beckett_id: string) {
    // if we can find existing db records and
    // the token status is either minted or burned,
    // then this is a duplication of vaulting
    // it's possible that token status is not up-to-date
    // immediately after previous transaction, but subsequent
    // mint will use the same token id. This tx will fail but
    // it avoids minting two tokens for the same beckett item.
    const vaulting = await this.vaultingRepo.findOne({
      beckett_id: beckett_id,
    });
    if (vaulting != undefined) {
      const token = await this.tokenRepo.findOne({
        collection: vaulting.collection,
        id: vaulting.token_id,
      });
      this.logger.log(`vaulting duplicate: ${JSON.stringify(vaulting)}`);
      this.logger.log(`token duplicate: ${JSON.stringify(token)}`);
      if (token != undefined) {
        if (
          token.status == TokenStatus.Minted ||
          token.status == TokenStatus.Burned
        ) {
          return true;
        }
      }
    }

    return false;
  }

  async createVaulting(
    beckett_id: string,
    collection: string,
    token_id: number,
  ) {
    const vaulting = this.vaultingRepo.create({
      beckett_id,
      collection,
      token_id,
    });
    await this.vaultingRepo.save(vaulting);
  }

  //TODO: better token id management
  //what if mint into a unknown collection, what's its max id
  async getTokenId(beckett_id: string, collection: string) {
    // if we have the beckett_id <=> token id mapping stored, return its token id
    // so that beckett_id will always map to the same token id
    const vaulting = await this.vaultingRepo.findOne({
      beckett_id: beckett_id,
    });
    if (vaulting != undefined && isNumber(vaulting.token_id)) {
      return vaulting.token_id;
    }

    // otherwise, this is the first time we see this beckett id
    // then issue a new token id
    const min_token_id =
      configuration()[process.env['runtime']]['min_token_id'];
    const result = await this.tokenRepo
      .createQueryBuilder('token')
      .select('MAX(id)', 'max')
      .where('collection = :collection', { collection: collection })
      .groupBy('collection')
      .getRawOne();
    if (result == undefined) {
      this.logger.log(`Max id: ${min_token_id}`);
      return min_token_id;
    } else {
      const max_id = result['max'] as number;
      this.logger.log(`Max id: ${max_id}`);
      return max_id + 1;
    }
  }
}
