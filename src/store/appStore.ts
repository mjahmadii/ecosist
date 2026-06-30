import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppState, AppSettings, Subsidiary, ChatMessage } from '@/types';
import { mockHoldingData, mockRecommendations, mockMarketAnomalies, mockCapitalScenarios } from '@/data/mockData';

const defaultSettings: AppSettings = {
  riskPersona: 'balanced',
  thresholds: {
    maxDebtRatio: 65,
    minCurrentRatio: 1.2,
    minGovernanceScore: 60,
    minFinancialScore: 60,
    minESGScore: 55,
    maxBankruptcyProbability: 30,
  },
  notifications: {
    email: true,
    alertThreshold: 'warning',
  },
  displayCurrency: 'IRR',
  language: 'fa',
  aiModel: 'gpt-4o',
};

interface AppStore extends AppState {
  login: (username: string, password: string) => boolean;
  logout: () => void;
  setApiKey: (key: string, provider: 'openai' | 'anthropic') => void;
  setActiveView: (view: string) => void;
  setSelectedSubsidiary: (sub: Subsidiary | null) => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  addChatMessage: (message: ChatMessage) => void;
  updateLastMessage: (content: string, done?: boolean) => void;
  acknowledgeAlert: (subsidiaryId: string, alertId: string) => void;
  setIsLoading: (loading: boolean) => void;
  addAIRecommendation: (rec: AppState['recommendations'][0]) => void;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      apiKeyConfigured: false,
      apiKey: '',
      aiProvider: 'openai',
      holdingData: mockHoldingData,
      settings: defaultSettings,
      recommendations: mockRecommendations,
      marketAnomalies: mockMarketAnomalies,
      capitalScenarios: mockCapitalScenarios,
      activeView: 'dashboard',
      selectedSubsidiary: null,
      isLoading: false,
      chatMessages: [],

      login: (username, password) => {
        if (username === 'ehsan' && password === 'ehsan@26') {
          set({ isAuthenticated: true });
          return true;
        }
        return false;
      },

      logout: () => set({
        isAuthenticated: false,
        apiKeyConfigured: false,
        apiKey: '',
        chatMessages: [],
        activeView: 'dashboard',
      }),

      setApiKey: (key, provider) => set({
        apiKey: key,
        aiProvider: provider,
        apiKeyConfigured: true,
      }),

      setActiveView: (view) => set({ activeView: view, selectedSubsidiary: null }),

      setSelectedSubsidiary: (sub) => set({ selectedSubsidiary: sub }),

      updateSettings: (newSettings) => set((state) => ({
        settings: { ...state.settings, ...newSettings },
      })),

      addChatMessage: (message) => set((state) => ({
        chatMessages: [...state.chatMessages, message],
      })),

      updateLastMessage: (content, done = false) => set((state) => {
        const msgs = [...state.chatMessages];
        const last = msgs[msgs.length - 1];
        if (last && last.role === 'assistant') {
          msgs[msgs.length - 1] = { ...last, content, isStreaming: !done };
        }
        return { chatMessages: msgs };
      }),

      acknowledgeAlert: (subsidiaryId, alertId) => set((state) => {
        if (!state.holdingData) return state;
        const subs = state.holdingData.subsidiaries.map((s) => {
          if (s.id !== subsidiaryId) return s;
          return {
            ...s,
            alerts: s.alerts.map((a) =>
              a.id === alertId ? { ...a, acknowledged: true } : a
            ),
          };
        });
        return { holdingData: { ...state.holdingData, subsidiaries: subs } };
      }),

      setIsLoading: (loading) => set({ isLoading: loading }),

      addAIRecommendation: (rec) => set((state) => ({
        recommendations: [rec, ...state.recommendations],
      })),
    }),
    {
      name: 'cga-storage',
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        apiKeyConfigured: state.apiKeyConfigured,
        apiKey: state.apiKey,
        aiProvider: state.aiProvider,
        settings: state.settings,
      }),
    }
  )
);
