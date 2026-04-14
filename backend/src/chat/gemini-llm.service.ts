import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { LLMService } from './interfaces/llm.interface';

@Injectable()
export class GeminiLLMService implements LLMService {
  private readonly logger = new Logger(GeminiLLMService.name);
  private readonly genAI: GoogleGenerativeAI;

  constructor(private config: ConfigService) {
    const apiKey = this.config.get<string>('GEMINI_API_KEY')!;
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async generateResponse(jobId: string, userMessage: string): Promise<string | null> {
    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      const prompt = `You are a helpful assistant for a handyman service platform. A user sent the following message in the context of job ${jobId}:\n\n"${userMessage}"\n\nProvide a brief, helpful reply (2-3 sentences max).`;
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      return text || null;
    } catch (err) {
      this.logger.error('Gemini LLM error', err);
      return null;
    }
  }
}
