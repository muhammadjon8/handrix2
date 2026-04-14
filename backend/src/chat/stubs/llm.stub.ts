import { Injectable } from '@nestjs/common';
import { LLMService } from '../interfaces/llm.interface';

@Injectable()
export class LLMServiceStub implements LLMService {
  async generateResponse(): Promise<string | null> {
    // Stub: no-op until LLM provider is configured
    return null;
  }
}
