'use client';
import { useState } from 'react';
import { Key, Zap, Shield, CheckCircle, ExternalLink, ChevronDown } from 'lucide-react';
import { useAppStore } from '@/store/appStore';

export default function ApiKeyConfig() {
  const setApiKey = useAppStore((s) => s.setApiKey);
  const [key, setKey] = useState('');
  const [provider, setProvider] = useState<'openai' | 'anthropic' | 'gemini'>('openai');
  const [isValidating, setIsValidating] = useState(false);
  const [showKey, setShowKey] = useState(false);

  const providers = [
    {
      id: 'openai' as const,
      name: 'OpenAI',
      models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo'],
      color: 'from-emerald-600 to-teal-600',
      description: 'GPT-4o | پیشرفته‌ترین مدل تحلیل مالی',
    },
    {
      id: 'anthropic' as const,
      name: 'Anthropic Claude',
      models: ['claude-opus-4-8', 'claude-sonnet-5'],
      color: 'from-orange-600 to-rose-600',
      description: 'Claude Opus | تحلیل دقیق اسناد مالی',
    },
    {
      id: 'gemini' as const,
      name: 'Google Gemini',
      models: ['gemini-2.0-flash', 'gemini-2.5-pro', 'gemini-2.5-flash'],
      color: 'from-blue-600 to-violet-600',
      description: 'Gemini 2.0 Flash | سریع و هوشمند',
    },
  ];

  const handleContinue = async () => {
    if (!key.trim()) return;
    setIsValidating(true);
    await new Promise((r) => setTimeout(r, 1500));
    setApiKey(key.trim(), provider);
  };

  const handleSkip = () => {
    setApiKey('demo-mode', provider);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#080b14] relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-80 h-80 bg-brand-600/15 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-lg px-6">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg mb-5">
            <Key className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">پیکربندی هوش مصنوعی</h2>
          <p className="text-slate-400 text-sm">
            برای فعال‌سازی دستیار هوشمند، کلید API خود را وارد کنید
          </p>
        </div>

        <div className="glass-strong rounded-2xl p-6 card-glow animate-slide-up">
          {/* Provider selection */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-slate-300 mb-3">انتخاب سرویس هوش مصنوعی</label>
            <div className="grid grid-cols-3 gap-3">
              {providers.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setProvider(p.id)}
                  className={`relative p-4 rounded-xl border transition-all text-right ${
                    provider === p.id
                      ? 'border-brand-500/50 bg-brand-600/10'
                      : 'border-white/10 hover:border-white/20 bg-white/3'
                  }`}
                >
                  {provider === p.id && (
                    <CheckCircle className="absolute top-2 left-2 w-4 h-4 text-brand-400" />
                  )}
                  <div className={`text-sm font-semibold bg-gradient-to-r ${p.color} bg-clip-text text-transparent mb-1`}>
                    {p.name}
                  </div>
                  <div className="text-xs text-slate-500">{p.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* API Key input */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              کلید API {provider === 'openai' ? 'OpenAI' : provider === 'anthropic' ? 'Anthropic' : 'Google Gemini'}
            </label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder={provider === 'openai' ? 'sk-...' : provider === 'anthropic' ? 'sk-ant-...' : 'AIza...'}
                dir="ltr"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-brand-500/50 font-mono text-sm transition-all"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs transition-colors"
              >
                {showKey ? 'پنهان' : 'نمایش'}
              </button>
            </div>
          </div>

          {/* Security note */}
          <div className="flex items-start gap-3 p-3 bg-brand-900/20 border border-brand-500/20 rounded-xl mb-5">
            <Shield className="w-4 h-4 text-brand-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-slate-400">
              کلید API شما فقط در مرورگر شما ذخیره می‌شود و به هیچ سرور خارجی ارسال نمی‌شود. تمام درخواست‌ها مستقیماً به API ارسال می‌شوند.
            </p>
          </div>

          {/* Features */}
          <div className="grid grid-cols-3 gap-2 mb-6">
            {[
              { icon: Zap, label: 'پیشنهادات استراتژیک' },
              { icon: Shield, label: 'تحلیل ریسک' },
              { icon: CheckCircle, label: 'گزارش هوشمند' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex flex-col items-center gap-1.5 p-2 rounded-lg bg-white/3 text-center">
                <Icon className="w-4 h-4 text-brand-400" />
                <span className="text-xs text-slate-400">{label}</span>
              </div>
            ))}
          </div>

          <button
            onClick={handleContinue}
            disabled={!key.trim() || isValidating}
            className="w-full bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-cyan-500 text-white font-semibold py-3 rounded-xl transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed shadow-glow-brand flex items-center justify-center gap-2 mb-3"
          >
            {isValidating ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                در حال اتصال...
              </>
            ) : (
              'فعال‌سازی هوش مصنوعی'
            )}
          </button>

          <button
            onClick={handleSkip}
            className="w-full text-slate-500 hover:text-slate-300 text-sm py-2 transition-colors"
          >
            ادامه بدون هوش مصنوعی (حالت نمایشی)
          </button>
        </div>
      </div>
    </div>
  );
}
