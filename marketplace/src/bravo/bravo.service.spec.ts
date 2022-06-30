import { Test, TestingModule } from '@nestjs/testing';
import { BravoService } from './bravo.service';

describe('BravoService', () => {
  let service: BravoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BravoService],
    }).compile();

    service = module.get<BravoService>(BravoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
