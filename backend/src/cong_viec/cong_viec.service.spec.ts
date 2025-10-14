import { Test, TestingModule } from '@nestjs/testing';
import { CongViecService } from './cong_viec.service';

describe('CongViecService', () => {
  let service: CongViecService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CongViecService],
    }).compile();

    service = module.get<CongViecService>(CongViecService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
