import { Test, TestingModule } from '@nestjs/testing';
import { DuAnController } from './du_an.controller';

describe('DuAnController', () => {
  let controller: DuAnController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DuAnController],
    }).compile();

    controller = module.get<DuAnController>(DuAnController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
