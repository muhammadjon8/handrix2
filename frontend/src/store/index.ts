import { create } from 'zustand';
import { createAuthSlice, type AuthState } from './authSlice';
import { createActiveJobSlice, type ActiveJobState } from './activeJobSlice';
import { createChatSlice, type ChatState } from './chatSlice';
import { createNotificationsSlice, type NotificationsState } from './notificationsSlice';

type StoreState = AuthState & ActiveJobState & ChatState & NotificationsState;

export const useStore = create<StoreState>()((set) => ({
  ...createAuthSlice(set as Parameters<typeof createAuthSlice>[0]),
  ...createActiveJobSlice(set as Parameters<typeof createActiveJobSlice>[0]),
  ...createChatSlice(set as Parameters<typeof createChatSlice>[0]),
  ...createNotificationsSlice(set as Parameters<typeof createNotificationsSlice>[0]),
}));
