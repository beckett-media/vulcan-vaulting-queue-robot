import { Test, TestingModule } from '@nestjs/testing';
import { BravoController } from './bravo.controller';

describe('BravoController', () => {
  let controller: BravoController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BravoController],
    }).compile();

    controller = module.get<BravoController>(BravoController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
