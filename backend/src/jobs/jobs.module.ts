import { Module } from '@nestjs/common';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';
import { PricingModule } from '../pricing/pricing.module';
import { MatchingModule } from '../matching/matching.module';
import { WebsocketModule } from '../websocket/websocket.module';
import { WarrantyModule } from '../warranty/warranty.module';

@Module({
  imports: [PricingModule, MatchingModule, WebsocketModule, WarrantyModule],
  controllers: [JobsController],
  providers: [JobsService],
})
export class JobsModule {}
