import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { LLMServiceStub } from './stubs/llm.stub';
import { GeminiLLMService } from './gemini-llm.service';
import { LLM_SERVICE } from './interfaces/llm.interface';
import { WebsocketModule } from '../websocket/websocket.module';

@Module({
  imports: [WebsocketModule, ConfigModule],
  controllers: [ChatController],
  providers: [
    ChatService,
    {
      provide: LLM_SERVICE,
      useFactory: (config: ConfigService) => {
        const key = config.get<string>('GEMINI_API_KEY');
        if (key) {
          return new GeminiLLMService(config);
        }
        return new LLMServiceStub();
      },
      inject: [ConfigService],
    },
  ],
})
export class ChatModule {}
