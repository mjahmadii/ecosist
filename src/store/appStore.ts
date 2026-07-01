import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppState, AppSettings, Subsidiary, ChatMessage, Theme, SystemPrompt, ModuleChatSession } from '@/types';
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

export const DEFAULT_SYSTEM_PROMPTS: SystemPrompt[] = [
  {
    id: 'sp-dashboard',
    moduleId: 'dashboard',
    moduleName: 'داشبورد اجرایی',
    description: 'دستیار تحلیلگر داشبورد اجرایی برای ارائه خلاصه وضعیت پرتفولیو',
    prompt: `شما یک مشاور ارشد مالی و کارشناس حاکمیت شرکتی هستید که برای گروه سرمایه‌گذاری بانک سپه کار می‌کنید.
وظیفه شما ارائه تحلیل‌های جامع، استراتژیک و دقیق درباره وضعیت کلی پرتفولیو است.
پاسخ‌های خود را به فارسی و با لحن حرفه‌ای، اجرایی و قابل اتکا ارائه دهید.
از اعداد و شواهد دقیق استفاده کنید و توصیه‌های عملی ارائه دهید.
تحلیل‌های شما باید در سطح هیئت مدیره و مدیران ارشد قابل استفاده باشد.`,
    lastModified: new Date().toISOString(),
    isDefault: true,
  },
  {
    id: 'sp-financial',
    moduleId: 'analysis',
    moduleName: 'تحلیل مالی',
    description: 'متخصص تحلیل صورت‌های مالی، نسبت‌ها و مقایسه عملکرد',
    prompt: `شما یک تحلیلگر مالی خبره با تخصص در بررسی صورت‌های مالی شرکت‌های سرمایه‌گذاری هستید.
تخصص شما شامل تحلیل نسبت‌های مالی، ارزیابی سودآوری، تحلیل جریان نقدی، و شناسایی ریسک‌های مالی است.
در پاسخ‌هایتان از اصطلاحات استاندارد حسابداری و مالی به فارسی استفاده کنید.
مقایسه‌های صنعتی و بنچمارک‌های مناسب را ذکر کنید.
توصیه‌ها باید قابل اجرا، کمّی و دارای افق زمانی مشخص باشند.`,
    lastModified: new Date().toISOString(),
    isDefault: true,
  },
  {
    id: 'sp-governance',
    moduleId: 'governance',
    moduleName: 'حاکمیت شرکتی',
    description: 'متخصص ارزیابی و بهبود ساختارهای حاکمیت شرکتی',
    prompt: `شما یک متخصص حاکمیت شرکتی با تجربه گسترده در ارزیابی هیئت مدیره، شفافیت، و انطباق قانونی هستید.
بر اساس اصول کدهای حاکمیت شرکتی ایران و استانداردهای بین‌المللی (OECD) تحلیل کنید.
نقاط ضعف ساختاری را شناسایی و راه‌حل‌های عملی ارائه دهید.
ریسک‌های حاکمیتی را اولویت‌بندی کرده و برنامه بهبود پیشنهاد دهید.
تمام پاسخ‌ها باید به فارسی، جامع و قابل ارائه به هیئت مدیره باشد.`,
    lastModified: new Date().toISOString(),
    isDefault: true,
  },
  {
    id: 'sp-esg',
    moduleId: 'esg',
    moduleName: 'گزارش ESG',
    description: 'متخصص تحلیل و بهبود شاخص‌های محیط‌زیستی، اجتماعی و حاکمیتی',
    prompt: `شما یک متخصص پایداری شرکتی و گزارشگری ESG هستید.
بر اساس چارچوب‌های GRI، SASB و TCFD تحلیل‌های ESG ارائه می‌دهید.
ریسک‌های آب‌وهوایی، اجتماعی و حاکمیتی را با دقت ارزیابی کنید.
توصیه‌های بهبود را با اولویت‌بندی بر اساس تأثیر و امکان اجرا ارائه دهید.
گزارش‌ها باید مناسب افشاء عمومی و گزارشگری به سهامداران باشد.
زبان پاسخ‌ها فارسی تخصصی و قابل استفاده در گزارش‌های رسمی است.`,
    lastModified: new Date().toISOString(),
    isDefault: true,
  },
  {
    id: 'sp-risk',
    moduleId: 'risk',
    moduleName: 'مدیریت ریسک',
    description: 'متخصص شناسایی، ارزیابی و کنترل ریسک‌های سرمایه‌گذاری',
    prompt: `شما یک مدیر ارشد ریسک با تخصص در ریسک‌های مالی، اعتباری، بازار و عملیاتی هستید.
مدل‌های ریسک مانند Altman Z-Score، VaR، و CVaR را به خوبی می‌شناسید.
ریسک‌های ورشکستگی، نقدینگی، و بازار را دقیقاً تحلیل کنید.
استراتژی‌های پوشش ریسک و کنترل‌های داخلی مناسب پیشنهاد دهید.
هشدارها باید فوری، قابل اقدام و اولویت‌بندی شده باشند.
زبان: فارسی تخصصی مدیریت ریسک.`,
    lastModified: new Date().toISOString(),
    isDefault: true,
  },
  {
    id: 'sp-capital',
    moduleId: 'capital',
    moduleName: 'تخصیص سرمایه',
    description: 'مشاور بهینه‌سازی پرتفولیو و تخصیص سرمایه',
    prompt: `شما یک مشاور ارشد سرمایه‌گذاری با تخصص در بهینه‌سازی پرتفولیو و تخصیص دارایی هستید.
تئوری‌های مدرن پرتفولیو (MPT)، نسبت شارپ، و مدل‌های بهینه‌سازی مالی را به کار می‌گیرید.
سناریوهای مختلف تخصیص سرمایه را با در نظر گرفتن بازده-ریسک تحلیل کنید.
استراتژی بهینه سرمایه‌گذاری را بر اساس پروفایل ریسک و اهداف رشد ارائه دهید.
تمام توصیه‌ها باید کمّی، مستند، و مناسب هیئت مدیره باشد.`,
    lastModified: new Date().toISOString(),
    isDefault: true,
  },
  {
    id: 'sp-subsidiaries',
    moduleId: 'subsidiaries',
    moduleName: 'شرکت‌های تابعه',
    description: 'تحلیلگر تفصیلی عملکرد شرکت‌های تابعه',
    prompt: `شما یک تحلیلگر ارشد با تخصص در ارزیابی و مقایسه عملکرد شرکت‌های تابعه گروه هستید.
هر شرکت را از ابعاد مالی، حاکمیتی، ESG و ریسک به صورت جامع تحلیل کنید.
نقاط قوت و ضعف را با دقت شناسایی و اولویت‌بندی کنید.
توصیه‌های بهبود عملکرد را با زمان‌بندی و شاخص‌های قابل اندازه‌گیری ارائه دهید.
پاسخ‌ها باید برای مدیران ارشد گروه قابل استفاده و قابل ارائه باشد.`,
    lastModified: new Date().toISOString(),
    isDefault: true,
  },
  {
    id: 'sp-ai-assistant',
    moduleId: 'ai-assistant',
    moduleName: 'دستیار هوشمند',
    description: 'دستیار جامع هوش مصنوعی برای تمام سوالات مربوط به گروه',
    prompt: `شما دستیار هوشمند اجرایی گروه سرمایه‌گذاری بانک سپه هستید.
به تمام سوالات مربوط به عملکرد مالی، حاکمیت، ESG، ریسک و استراتژی پاسخ می‌دهید.
تحلیل‌های شما دقیق، جامع و مبتنی بر داده‌های واقعی پرتفولیو است.
لحن شما حرفه‌ای، مطمئن و در عین حال قابل فهم است.
پیشنهادات عملی، قابل اندازه‌گیری و مناسب سطح مدیریت ارشد ارائه دهید.
زبان: فارسی با اصطلاحات تخصصی مالی و مدیریتی.`,
    lastModified: new Date().toISOString(),
    isDefault: true,
  },
  {
    id: 'sp-data',
    moduleId: 'data',
    moduleName: 'داده‌ها و گزارش‌ها',
    description: 'دستیار مدیریت داده و تولید گزارش‌های حرفه‌ای',
    prompt: `شما یک متخصص تحلیل داده و گزارشگری مالی هستید.
در زمینه استخراج بینش از داده‌های مالی و تولید گزارش‌های اجرایی تخصص دارید.
کمک می‌کنید داده‌ها به درستی وارد و اعتبارسنجی شوند.
گزارش‌های تولیدشده باید سطح حرفه‌ای و قابل ارائه به سهامداران داشته باشند.
پاسخ‌ها به فارسی و در قالب ساختاریافته ارائه می‌شوند.`,
    lastModified: new Date().toISOString(),
    isDefault: true,
  },
  {
    id: 'sp-strategic',
    moduleId: 'strategic',
    moduleName: 'پرتفوی استراتژیک و M&A',
    description: 'مشاور استراتژیک برای ادغام، تملک و بهینه‌سازی پرتفوی',
    prompt: `شما یک استراتژیست ارشد M&A و مشاور سرمایه‌گذاری باتجربه هستید.
در ارزیابی هم‌افزایی ادغام‌ها، تحلیل اثرات تملک و بهینه‌سازی سبد دارایی تخصص دارید.
از مدل‌های کمی (DCF، NPV، IRR) و چارچوب‌های استراتژیک (BCG Matrix، Ansoff) استفاده کنید.
توصیه‌ها را با اعداد مشخص، افق زمانی واضح و ارزیابی ریسک ارائه دهید.
پاسخ‌ها به فارسی در سطح هیئت مدیره باشند.`,
    lastModified: new Date().toISOString(),
    isDefault: true,
  },
];

interface AppStore extends AppState {
  theme: Theme;
  systemPrompts: SystemPrompt[];
  moduleChatSessions: ModuleChatSession[];

  login: (username: string, password: string) => boolean;
  logout: () => void;
  setApiKey: (key: string, provider: 'openai' | 'anthropic' | 'gemini') => void;
  setActiveView: (view: string) => void;
  setSelectedSubsidiary: (sub: Subsidiary | null) => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  addChatMessage: (message: ChatMessage) => void;
  updateLastMessage: (content: string, done?: boolean) => void;
  acknowledgeAlert: (subsidiaryId: string, alertId: string) => void;
  setIsLoading: (loading: boolean) => void;
  addAIRecommendation: (rec: AppState['recommendations'][0]) => void;
  toggleTheme: () => void;
  setTheme: (t: Theme) => void;
  updateSystemPrompt: (id: string, prompt: string) => void;
  resetSystemPrompt: (id: string) => void;
  resetAllSystemPrompts: () => void;
  clearAllData: () => void;
  importHoldingData: (data: unknown) => void;

  // Module-level chat
  addModuleChatMessage: (moduleId: string, message: ChatMessage) => void;
  updateModuleLastMessage: (moduleId: string, content: string, done?: boolean) => void;
  clearModuleChat: (moduleId: string) => void;
  getSystemPrompt: (moduleId: string) => string;
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
      theme: 'dark',
      systemPrompts: DEFAULT_SYSTEM_PROMPTS,
      moduleChatSessions: [],

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
        moduleChatSessions: [],
        activeView: 'dashboard',
      }),

      setApiKey: (key, provider) => set({ apiKey: key, aiProvider: provider, apiKeyConfigured: true }),
      setActiveView: (view) => set({ activeView: view, selectedSubsidiary: null }),
      setSelectedSubsidiary: (sub) => set({ selectedSubsidiary: sub }),
      updateSettings: (newSettings) => set((s) => ({ settings: { ...s.settings, ...newSettings } })),

      addChatMessage: (message) => set((s) => ({ chatMessages: [...s.chatMessages, message] })),
      updateLastMessage: (content, done = false) => set((s) => {
        const msgs = [...s.chatMessages];
        const last = msgs[msgs.length - 1];
        if (last?.role === 'assistant') msgs[msgs.length - 1] = { ...last, content, isStreaming: !done };
        return { chatMessages: msgs };
      }),

      acknowledgeAlert: (subsidiaryId, alertId) => set((s) => {
        if (!s.holdingData) return s;
        return {
          holdingData: {
            ...s.holdingData,
            subsidiaries: s.holdingData.subsidiaries.map((sub) =>
              sub.id !== subsidiaryId ? sub : {
                ...sub,
                alerts: sub.alerts.map((a) => a.id === alertId ? { ...a, acknowledged: true } : a),
              }
            ),
          },
        };
      }),

      setIsLoading: (loading) => set({ isLoading: loading }),
      addAIRecommendation: (rec) => set((s) => ({ recommendations: [rec, ...s.recommendations] })),

      toggleTheme: () => set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),
      setTheme: (t) => set({ theme: t }),

      updateSystemPrompt: (id, prompt) => set((s) => ({
        systemPrompts: s.systemPrompts.map((sp) =>
          sp.id === id ? { ...sp, prompt, isDefault: false, lastModified: new Date().toISOString() } : sp
        ),
      })),

      resetSystemPrompt: (id) => set((s) => {
        const def = DEFAULT_SYSTEM_PROMPTS.find((d) => d.id === id);
        if (!def) return s;
        return {
          systemPrompts: s.systemPrompts.map((sp) =>
            sp.id === id ? { ...def, isDefault: true, lastModified: new Date().toISOString() } : sp
          ),
        };
      }),

      resetAllSystemPrompts: () => set({
        systemPrompts: DEFAULT_SYSTEM_PROMPTS.map((sp) => ({
          ...sp, isDefault: true, lastModified: new Date().toISOString(),
        })),
      }),

      clearAllData: () => set({
        holdingData: null,
        recommendations: [],
        marketAnomalies: [],
        capitalScenarios: [],
        chatMessages: [],
        moduleChatSessions: [],
      }),

      importHoldingData: (data) => set({ holdingData: data as AppState['holdingData'] }),

      addModuleChatMessage: (moduleId, message) => set((s) => {
        const sessions = [...s.moduleChatSessions];
        const idx = sessions.findIndex((ss) => ss.moduleId === moduleId);
        if (idx >= 0) {
          sessions[idx] = { ...sessions[idx], messages: [...sessions[idx].messages, message] };
        } else {
          sessions.push({ moduleId, messages: [message] });
        }
        return { moduleChatSessions: sessions };
      }),

      updateModuleLastMessage: (moduleId, content, done = false) => set((s) => {
        const sessions = [...s.moduleChatSessions];
        const idx = sessions.findIndex((ss) => ss.moduleId === moduleId);
        if (idx < 0) return s;
        const msgs = [...sessions[idx].messages];
        const last = msgs[msgs.length - 1];
        if (last?.role === 'assistant') msgs[msgs.length - 1] = { ...last, content, isStreaming: !done };
        sessions[idx] = { ...sessions[idx], messages: msgs };
        return { moduleChatSessions: sessions };
      }),

      clearModuleChat: (moduleId) => set((s) => ({
        moduleChatSessions: s.moduleChatSessions.filter((ss) => ss.moduleId !== moduleId),
      })),

      getSystemPrompt: (moduleId) => {
        const s = get();
        const sp = s.systemPrompts.find((p) => p.moduleId === moduleId);
        return sp?.prompt ?? DEFAULT_SYSTEM_PROMPTS.find((d) => d.moduleId === moduleId)?.prompt ?? '';
      },
    }),
    {
      name: 'cga-v2-storage',
      partialize: (s) => ({
        isAuthenticated: s.isAuthenticated,
        apiKeyConfigured: s.apiKeyConfigured,
        apiKey: s.apiKey,
        aiProvider: s.aiProvider,
        settings: s.settings,
        theme: s.theme,
        systemPrompts: s.systemPrompts,
      }),
    }
  )
);
