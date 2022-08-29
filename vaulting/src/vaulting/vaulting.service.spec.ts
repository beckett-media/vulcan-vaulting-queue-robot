import { BullModule } from '@nestjs/bull';
import { Test } from '@nestjs/testing';
import { MintJobResult } from '../config/enum';
import { BlockchainService } from '../blockchain/blockchain.service';
import { DatabaseService } from '../database/database.service';
import { MintJobStatus, MintRequest } from './dtos/vaulting.dto';
import { VaultingService } from './vaulting.service';
import { Token, Vaulting } from '../database/database.entity';
import { clearDB } from '../util/testing';
import { RUNTIME_ENV } from '../config/configuration';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GetDBConnection } from '../database/database.module';

describe('VaultingService', () => {
  let service: VaultingService;
  let fake_service_BullQueue_beckett_mint_dev;
  let fake_database_service: Partial<DatabaseService>;
  let fake_blockchain_service: Partial<BlockchainService>;

  beforeEach(async () => {
    // set runtime env to test
    process.env[RUNTIME_ENV] = 'test';

    fake_service_BullQueue_beckett_mint_dev = {
      add: (request: MintRequest) => Promise.resolve({ data: request }),
    };
    fake_blockchain_service = {};
    const fake_service_BullQueue_beckett_burn_dev = {};

    const module = await Test.createTestingModule({
      providers: [
        VaultingService,
        DatabaseService,
        { provide: BlockchainService, useValue: fake_blockchain_service },
        {
          provide: 'BullQueue_beckett_mint_dev',
          useValue: fake_service_BullQueue_beckett_mint_dev,
        },
        {
          provide: 'BullQueue_beckett_burn_dev',
          useValue: fake_service_BullQueue_beckett_burn_dev,
        },
      ],
      imports: [
        TypeOrmModule.forRoot(GetDBConnection()),
        TypeOrmModule.forFeature([Vaulting, Token]),
      ],
    }).compile();

    service = module.get(VaultingService);

    // clear database
    await clearDB();
  });

  it('collection in job should be lowercase', async () => {
    const collection = '0x123456789ABCDEF';
    const request = {
      collection: collection,
    } as MintRequest;

    const job = await service.mintNFT(request);
    expect(job.data['collection'] == collection);
  });

  it('mint job status: job not finished', async () => {
    // setup mock
    fake_service_BullQueue_beckett_mint_dev.getJob = (id: number) =>
      Promise.resolve({
        returnvalue: {
          tx_hash: '0x1234567890abcdef',
          error: '',
          status: MintJobResult.JobReceived,
        },
        finishedOn: 100,
        data: {
          id: 1,
          collection: '0xcccccccccccccccc',
          nft_record_id: '1234-5678-abcd',
        },
      });
    fake_database_service.getVaultingById = (id: string) =>
      Promise.resolve({ token_id: 1 } as Vaulting);
    fake_database_service.updateTokenStatus = (
      collection: string,
      token_id: number,
      status: number,
    ) => Promise.resolve();
    fake_blockchain_service.nftMinted = (collection: string, id: number) =>
      Promise.resolve(false);

    const jobStatus = await service.mintJobStatus(1);
  });
});
