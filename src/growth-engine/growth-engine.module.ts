import { Module } from '@nestjs/common';
import { GrowthEngineController } from './growth-engine.controller';
import { GrowthEngineService } from './growth-engine.service';

@Module({
  controllers: [GrowthEngineController],
  providers: [GrowthEngineService],
  exports: [GrowthEngineService],
})
export class GrowthEngineModule {}
