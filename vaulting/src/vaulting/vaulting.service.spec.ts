import { Test } from '@nestjs/testing';

import { VaultingService } from './vaulting.service';

it('can enqueue a new job', async () => {
  const fakeVaultingService = {
    getContract: () => Promise.resolve(),
  };
  const module = await Test.createTestingModule({
    providers: [VaultingService],
  }).compile();
});
