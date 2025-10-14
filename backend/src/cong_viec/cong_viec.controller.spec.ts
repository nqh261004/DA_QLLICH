import { Test, TestingModule } from '@nestjs/testing';
import { CongViecController } from './cong_viec.controller';
import { CongViecService } from './cong_viec.service';

describe('CongViecController', () => {
  let controller: CongViecController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CongViecController],
      providers: [CongViecService],
    }).compile();

    controller = module.get<CongViecController>(CongViecController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
