import { Module } from '@nestjs/common';
import { MatchingService } from './matching.service';
import { WebsocketModule } from '../websocket/websocket.module';

@Module({
  imports: [WebsocketModule],
  providers: [MatchingService],
  exports: [MatchingService],
})
export class MatchingModule {}
