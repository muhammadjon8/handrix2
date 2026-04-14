import { api } from './api';
import type { ChatMessage } from '../types';

export const chatService = {
  getMessages: (jobId: string) =>
    api.get<{ messages: ChatMessage[] }>(`/chat/${jobId}/messages`).then((r) => r.data),

  sendMessage: (jobId: string, content: string) =>
    api.post<{ id : string; senderId: string; content: string; isAI: boolean; createdAt: string }>(`/chat/${jobId}/messages`, { content }).then((r) => r.data),
};
