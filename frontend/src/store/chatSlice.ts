import type { ChatMessage } from '../types';  

export interface ChatState {
  messages: ChatMessage[];
  appendMessage: (msg: ChatMessage) => void;
  setMessages: (msgs: ChatMessage[]) => void;
  clearMessages: () => void;
}

export const createChatSlice = (set: (fn: (s: ChatState) => Partial<ChatState>) => void): ChatState => ({
  messages: [],
  appendMessage(msg) {
    set((s) => ({ messages: [...s.messages, msg] }));
  },
  setMessages(msgs) {
    set(() => ({ messages: msgs }));
  },
  clearMessages() {
    set(() => ({ messages: [] }));
  },
});
