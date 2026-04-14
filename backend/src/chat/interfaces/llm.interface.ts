export interface LLMService {
  generateResponse(jobId: string, userMessage: string): Promise<string | null>;
}

export const LLM_SERVICE = 'LLM_SERVICE';
