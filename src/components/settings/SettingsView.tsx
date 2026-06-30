'use client';
import { useState } from 'react';
import { Settings, Shield, Bell, Key, Save, RotateCcw, CheckCircle } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import type { RiskPersona } from '@/types';

const personaConfig = {
  conservative: {
    label: 'محافظه‌کارانه',
    description: 'حداکثر محافظت از سرمایه، ریسک‌پذیری بسیار پایین',
    color: 'from-blue-600/30 to-blue-800/20 border-blue-500/30',
    icon: '🛡️',
    thresholds: { maxDebtRatio: 50, minCurrentRatio: 1.5, minGovernanceScore: 70, minFinancialScore: 70, minESGScore: 65, maxBankruptcyProbability: 15 },
  },
  balanced: {
    label: 'متوازن',
    description: 'تعادل میان رشد و محافظت، ریسک‌پذیری متوسط',
    color: 'from-brand-600/30 to-brand-800/20 border-brand-500/30',
    icon: '⚖️',
    thresholds: { maxDebtRatio: 65, minCurrentRatio: 1.2, minGovernanceScore: 60, minFinancialScore: 60, minESGScore: 55, maxBankruptcyProbability: 30 },
  },
  aggressive: {
    label: 'تهاجمی',
    description: 'تمرکز بر رشد و بازده بالا، پذیرش ریسک بیشتر',
    color: 'from-rose-600/30 to-orange-800/20 border-rose-500/30',
    icon: '🚀',
    thresholds: { maxDebtRatio: 75, minCurrentRatio: 1.0, minGovernanceScore: 50, minFinancialScore: 50, minESGScore: 45, maxBankruptcyProbability: 45 },
  },
};

export default function SettingsView() {
  const { settings, updateSettings, apiKey, aiProvider, setApiKey } = useAppStore();
  const [saved, setSaved] = useState(false);
  const [newApiKey, setNewApiKey] = useState('');
  const [selectedPersona, setSelectedPersona] = useState<RiskPersona>(settings.riskPersona);
  const [thresholds, setThresholds] = useState(settings.thresholds);

  const applyPersona = (persona: RiskPersona) => {
    setSelectedPersona(persona);
    setThresholds(personaConfig[persona].thresholds);
  };

  const saveSettings = () => {
    updateSettings({ riskPersona: selectedPersona, thresholds });
    if (newApiKey.trim()) setApiKey(newApiKey.trim(), aiProvider);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="p-6 max-w-4xl animate-fade-in space-y-6">
      {/* Risk Persona */}
      <div className="glass rounded-2xl p-6 card-glow">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-5 h-5 text-brand-400" />
          <h3 className="text-base font-semibold text-white">پرسونای ریسک</h3>
        </div>
        <p className="text-xs text-slate-400 mb-4">پرسونای ریسک بر نحوه امتیازدهی و توصیه‌های هوش مصنوعی تأثیر می‌گذارد</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {(Object.entries(personaConfig) as [RiskPersona, typeof personaConfig.balanced][]).map(([key, cfg]) => (
            <button
              key={key}
              onClick={() => applyPersona(key)}
              className={`relative p-4 rounded-xl border text-right transition-all bg-gradient-to-br ${cfg.color} ${
                selectedPersona === key ? 'ring-2 ring-white/20 shadow-lg' : 'hover:opacity-90'
              }`}
            >
              {selectedPersona === key && (
                <CheckCircle className="absolute top-3 left-3 w-4 h-4 text-white" />
              )}
              <div className="text-2xl mb-2">{cfg.icon}</div>
              <p className="text-sm font-bold text-white mb-1">{cfg.label}</p>
              <p className="text-xs text-white/70">{cfg.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Thresholds */}
      <div className="glass rounded-2xl p-6 card-glow">
        <div className="flex items-center gap-2 mb-4">
          <Settings className="w-5 h-5 text-amber-400" />
          <h3 className="text-base font-semibold text-white">آستانه‌های هشدار</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {[
            { key: 'maxDebtRatio', label: 'حداکثر نسبت بدهی', unit: '٪', min: 30, max: 90, step: 1 },
            { key: 'minCurrentRatio', label: 'حداقل نسبت جاری', unit: '', min: 0.5, max: 3, step: 0.1 },
            { key: 'minGovernanceScore', label: 'حداقل امتیاز حاکمیتی', unit: '', min: 30, max: 90, step: 1 },
            { key: 'minFinancialScore', label: 'حداقل امتیاز مالی', unit: '', min: 30, max: 90, step: 1 },
            { key: 'minESGScore', label: 'حداقل امتیاز ESG', unit: '', min: 20, max: 90, step: 1 },
            { key: 'maxBankruptcyProbability', label: 'حداکثر احتمال ورشکستگی', unit: '٪', min: 5, max: 60, step: 1 },
          ].map(({ key, label, unit, min, max, step }) => {
            const val = (thresholds as Record<string, number>)[key];
            const pct = ((val - min) / (max - min)) * 100;
            return (
              <div key={key}>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm text-slate-300">{label}</label>
                  <span className="text-sm font-mono font-bold text-brand-300">{val}{unit}</span>
                </div>
                <input
                  type="range"
                  min={min}
                  max={max}
                  step={step}
                  value={val}
                  onChange={(e) => setThresholds((t) => ({ ...t, [key]: parseFloat(e.target.value) }))}
                  className="w-full h-1 rounded-full appearance-none cursor-pointer"
                  style={{ background: `linear-gradient(to left, rgba(255,255,255,0.1) ${100 - pct}%, #3d52ff ${100 - pct}%)` }}
                />
                <div className="flex justify-between text-xs text-slate-600 mt-1">
                  <span>{min}{unit}</span>
                  <span>{max}{unit}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* API Key */}
      <div className="glass rounded-2xl p-6 card-glow">
        <div className="flex items-center gap-2 mb-4">
          <Key className="w-5 h-5 text-emerald-400" />
          <h3 className="text-base font-semibold text-white">تنظیمات هوش مصنوعی</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-slate-300 mb-2 block">سرویس فعلی</label>
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-sm text-slate-300">
              {aiProvider === 'openai' ? '🤖 OpenAI GPT' : '🧠 Anthropic Claude'}
            </div>
          </div>
          <div>
            <label className="text-sm text-slate-300 mb-2 block">کلید API جدید (اختیاری)</label>
            <input
              type="password"
              value={newApiKey}
              onChange={(e) => setNewApiKey(e.target.value)}
              placeholder="کلید جدید..."
              dir="ltr"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-brand-500/50 font-mono transition-all"
            />
          </div>
        </div>
        <div className="mt-3 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
          <p className="text-xs text-emerald-400">✓ کلید API محرمانه — فقط در مرورگر شما ذخیره می‌شود و به هیچ سروری ارسال نمی‌شود</p>
        </div>
      </div>

      {/* Notifications */}
      <div className="glass rounded-2xl p-6 card-glow">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="w-5 h-5 text-violet-400" />
          <h3 className="text-base font-semibold text-white">اعلان‌ها</h3>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-xl bg-white/3 border border-white/5">
            <div>
              <p className="text-sm text-white">اعلان ایمیل</p>
              <p className="text-xs text-slate-500 mt-0.5">دریافت خلاصه هفتگی از وضعیت پرتفولیو</p>
            </div>
            <button
              onClick={() => updateSettings({ notifications: { ...settings.notifications, email: !settings.notifications.email } })}
              className={`w-11 h-6 rounded-full transition-all relative ${settings.notifications.email ? 'bg-brand-600' : 'bg-white/10'}`}
            >
              <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${settings.notifications.email ? 'left-5' : 'left-0.5'}`} />
            </button>
          </div>
          <div className="flex items-center justify-between p-3 rounded-xl bg-white/3 border border-white/5">
            <div>
              <p className="text-sm text-white">آستانه هشدار</p>
              <p className="text-xs text-slate-500 mt-0.5">حداقل سطح نمایش اعلان</p>
            </div>
            <select
              value={settings.notifications.alertThreshold}
              onChange={(e) => updateSettings({ notifications: { ...settings.notifications, alertThreshold: e.target.value as 'critical' | 'warning' | 'info' } })}
              className="bg-white/10 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-slate-300 focus:outline-none"
            >
              <option value="critical">فقط بحرانی</option>
              <option value="warning">هشدار و بالاتر</option>
              <option value="info">همه موارد</option>
            </select>
          </div>
        </div>
      </div>

      {/* Save */}
      <div className="flex items-center gap-3">
        <button
          onClick={saveSettings}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-cyan-500 text-white font-semibold text-sm transition-all shadow-glow-brand"
        >
          {saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saved ? 'ذخیره شد!' : 'ذخیره تنظیمات'}
        </button>
        <button
          onClick={() => { setSelectedPersona(settings.riskPersona); setThresholds(settings.thresholds); }}
          className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-slate-200 text-sm transition-all"
        >
          <RotateCcw className="w-4 h-4" />
          بازگردانی
        </button>
      </div>
    </div>
  );
}
