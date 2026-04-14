import { Module } from '@nestjs/common';
import { HandymenController } from './handymen.controller';
import { HandymenService } from './handymen.service';
import { WebsocketModule } from '../websocket/websocket.module';

@Module({
  imports: [WebsocketModule],
  controllers: [HandymenController],
  providers: [HandymenService],
})
export class HandymenModule {}
