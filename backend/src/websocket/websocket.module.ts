import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { JobsGateway } from './jobs.gateway';
import { ChatGateway } from './chat.gateway';

@Module({
  imports: [JwtModule.register({})],
  providers: [JobsGateway, ChatGateway],
  exports: [JobsGateway, ChatGateway],
})
export class WebsocketModule {}
