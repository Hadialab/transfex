import { create } from 'zustand';
import { api, ApiError } from '../lib/apiClient';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AiStore {
  messages: ChatMessage[];
  loading: boolean;
  error: string | null;
  send: (text: string) => Promise<void>;
  clear: () => void;
}

export const useAiStore = create<AiStore>((set, get) => ({
  messages: [],
  loading: false,
  error: null,

  send: async (text) => {
    const trimmed = text.trim();
    if (!trimmed || get().loading) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: trimmed,
      timestamp: new Date(),
    };
    set((state) => ({ messages: [...state.messages, userMessage], loading: true, error: null }));

    // Last 10 turns as history, matching what the old client sent. The
    // backend also caps this server-side, so a modified client can't bypass it.
    const history = get()
      .messages.slice(-10)
      .map((m) => ({ role: m.role, content: m.content }));

    try {
      const data = await api.post<{ reply: string }>('/api/ai/chat', {
        message: trimmed,
        history,
      });
      set((state) => ({
        messages: [
          ...state.messages,
          {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: data.reply,
            timestamp: new Date(),
          },
        ],
        loading: false,
      }));
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Something went wrong.';
      set({ loading: false, error: message });
    }
  },

  clear: () => set({ messages: [], error: null }),
}));