import { Test, TestingModule } from '@nestjs/testing';
import { VaultingController } from './vaulting.controller';

describe('VaultingController', () => {
  let controller: VaultingController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VaultingController],
    }).compile();

    controller = module.get<VaultingController>(VaultingController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
