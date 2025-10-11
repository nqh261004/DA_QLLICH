import { Test, TestingModule } from '@nestjs/testing';
import { DuAnService } from './du_an.service';

describe('DuAnService', () => {
  let service: DuAnService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DuAnService],
    }).compile();

    service = module.get<DuAnService>(DuAnService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
