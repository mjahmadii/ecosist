'use client';
import { useState } from 'react';
import { Settings, Shield, Bell, Key, Save, RotateCcw, CheckCircle, Moon, Sun, Palette, ChevronRight } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import type { RiskPersona } from '@/types';
import ThemeToggle from '@/components/ui/ThemeToggle';
import ContextChat from '@/components/ui/ContextChat';

const personaConfig = {
  conservative: {
    label: 'محافظه‌کارانه',
    icon: '🛡️',
    description: 'حداکثر محافظت از سرمایه، ریسک‌پذیری بسیار پایین',
    color: '#22d3ee',
    thresholds: { maxDebtRatio: 50, minCurrentRatio: 1.5, minGovernanceScore: 70, minFinancialScore: 70, minESGScore: 65, maxBankruptcyProbability: 15 },
  },
  balanced: {
    label: 'متوازن',
    icon: '⚖️',
    description: 'تعادل بین رشد و کنترل ریسک — مناسب اکثر سرمایه‌گذاران',
    color: '#3d52ff',
    thresholds: { maxDebtRatio: 65, minCurrentRatio: 1.2, minGovernanceScore: 60, minFinancialScore: 60, minESGScore: 55, maxBankruptcyProbability: 30 },
  },
  aggressive: {
    label: 'تهاجمی',
    icon: '🚀',
    description: 'تمرکز بر رشد حداکثری، تحمل ریسک بالاتر',
    color: '#f59e0b',
    thresholds: { maxDebtRatio: 80, minCurrentRatio: 1.0, minGovernanceScore: 50, minFinancialScore: 50, minESGScore: 45, maxBankruptcyProbability: 45 },
  },
};

const thresholdConfig = [
  { key: 'maxDebtRatio', label: 'حداکثر نسبت بدهی', unit: '٪', min: 20, max: 90, color: '#f43f5e' },
  { key: 'minCurrentRatio', label: 'حداقل نسبت جاری', unit: 'x', min: 0.5, max: 3, step: 0.1, color: '#3d52ff' },
  { key: 'minGovernanceScore', label: 'حداقل امتیاز حاکمیتی', unit: '/۱۰۰', min: 30, max: 90, color: '#8b5cf6' },
  { key: 'minFinancialScore', label: 'حداقل امتیاز مالی', unit: '/۱۰۰', min: 30, max: 90, color: '#00c48c' },
  { key: 'minESGScore', label: 'حداقل امتیاز ESG', unit: '/۱۰۰', min: 30, max: 90, color: '#10b981' },
  { key: 'maxBankruptcyProbability', label: 'حداکثر احتمال ورشکستگی', unit: '٪', min: 5, max: 60, color: '#f59e0b' },
];

export default function SettingsView() {
  const { settings, updateSettings, setApiKey, apiKey, aiProvider, theme, toggleTheme, setActiveView } = useAppStore();
  const [newApiKey, setNewApiKey] = useState('');
  const [saved, setSaved] = useState(false);
  const [activeSection, setActiveSection] = useState<'persona' | 'thresholds' | 'api' | 'appearance' | 'notifications'>('persona');

  const handleSave = () => {
    if (newApiKey.trim()) setApiKey(newApiKey.trim(), aiProvider);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handlePersonaSelect = (p: RiskPersona) => {
    updateSettings({ riskPersona: p, thresholds: personaConfig[p].thresholds });
  };

  const sections = [
    { id: 'persona' as const, label: 'پروفایل ریسک', icon: '⚖️' },
    { id: 'thresholds' as const, label: 'آستانه‌های هشدار', icon: '🎯' },
    { id: 'api' as const, label: 'تنظیمات AI', icon: '🤖' },
    { id: 'appearance' as const, label: 'ظاهر', icon: '🎨' },
    { id: 'notifications' as const, label: 'اعلان‌ها', icon: '🔔' },
  ];

  return (
    <div className="p-5 animate-fade-in max-w-5xl">
      <div className="mb-6">
        <h2 className="section-title">تنظیمات سیستم</h2>
        <p className="section-subtitle">پیکربندی رفتار سیستم، آستانه‌های هشدار و ترجیحات شخصی</p>
      </div>

      <div className="flex gap-5">
        {/* Sidebar nav */}
        <div className="w-52 flex-shrink-0 space-y-1">
          {sections.map(({ id, label, icon }) => (
            <button key={id} onClick={() => setActiveSection(id)}
              className={`sidebar-link w-full ${activeSection === id ? 'active' : ''}`}>
              <span>{icon}</span>
              <span className="flex-1">{label}</span>
              {activeSection === id && <ChevronRight className="w-3.5 h-3.5" />}
            </button>
          ))}

          <div className="pt-3 mt-3" style={{ borderTop: '1px solid var(--border)' }}>
            <button onClick={() => setActiveView('prompt-manager')}
              className="sidebar-link w-full">
              <span>✍️</span>
              <span className="flex-1">مدیریت پرامپت‌ها</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Persona */}
          {activeSection === 'persona' && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="section-title">پروفایل ریسک سرمایه‌گذاری</h3>
              <p className="section-subtitle mb-4">انتخاب پروفایل ریسک، آستانه‌های هشدار را به‌صورت خودکار تنظیم می‌کند</p>
              <div className="grid grid-cols-1 gap-3">
                {(Object.entries(personaConfig) as [RiskPersona, typeof personaConfig.balanced][]).map(([key, cfg]) => {
                  const isActive = settings.riskPersona === key;
                  return (
                    <button key={key} onClick={() => handlePersonaSelect(key)}
                      className="card p-5 text-right transition-all"
                      style={isActive ? { borderColor: cfg.color, background: `${cfg.color}08` } : {}}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{cfg.icon}</span>
                          <div>
                            <p className="font-semibold" style={{ color: isActive ? cfg.color : 'var(--text-1)' }}>{cfg.label}</p>
                            <p className="text-xs mt-0.5" style={{ color: 'var(--text-2)' }}>{cfg.description}</p>
                          </div>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0`}
                          style={{ borderColor: isActive ? cfg.color : 'var(--border-2)' }}>
                          {isActive && <div className="w-2.5 h-2.5 rounded-full" style={{ background: cfg.color }} />}
                        </div>
                      </div>
                      {isActive && (
                        <div className="mt-3 grid grid-cols-3 gap-2">
                          {Object.entries(cfg.thresholds).slice(0, 3).map(([k, v]) => {
                            const tCfg = thresholdConfig.find((t) => t.key === k);
                            return tCfg ? (
                              <div key={k} className="p-2 rounded-lg text-center" style={{ background: `${cfg.color}0f` }}>
                                <div className="text-sm font-bold" style={{ color: cfg.color }}>{v}{tCfg.unit}</div>
                                <div className="text-[10px] mt-0.5" style={{ color: 'var(--text-3)' }}>{tCfg.label}</div>
                              </div>
                            ) : null;
                          })}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Thresholds */}
          {activeSection === 'thresholds' && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="section-title">آستانه‌های هشدار سفارشی</h3>
              <p className="section-subtitle mb-4">مقادیر آستانه برای تریگر کردن هشدارهای سیستم</p>
              <div className="card p-5 space-y-5">
                {thresholdConfig.map(({ key, label, unit, min, max, color, step = 1 }) => {
                  const val = settings.thresholds[key as keyof typeof settings.thresholds];
                  return (
                    <div key={key}>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium" style={{ color: 'var(--text-1)' }}>{label}</label>
                        <div className="flex items-center gap-1 px-3 py-1 rounded-full text-sm font-bold"
                          style={{ background: `${color}12`, color, border: `1px solid ${color}22` }}>
                          {val}{unit}
                        </div>
                      </div>
                      <input
                        type="range"
                        min={min} max={max} step={step}
                        value={val}
                        onChange={(e) => updateSettings({ thresholds: { ...settings.thresholds, [key]: parseFloat(e.target.value) } })}
                        style={{ accentColor: color }}
                      />
                      <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--text-3)' }}>
                        <span>{min}{unit}</span>
                        <span>{max}{unit}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* API Settings */}
          {activeSection === 'api' && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="section-title">تنظیمات هوش مصنوعی</h3>
              <div className="card p-5 space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block" style={{ color: 'var(--text-1)' }}>ارائه‌دهنده AI</label>
                  <div className="grid grid-cols-3 gap-3">
                    {([
                      { id: 'openai', label: '🤖 OpenAI', model: 'gpt-4o' },
                      { id: 'anthropic', label: '🧠 Anthropic', model: 'claude-opus-4-8' },
                      { id: 'gemini', label: '✨ Gemini', model: 'gemini-2.0-flash' },
                    ] as const).map((p) => (
                      <button key={p.id} onClick={() => { setApiKey(apiKey, p.id); updateSettings({ aiModel: p.model }); }}
                        className="p-3 rounded-xl text-sm font-medium transition-all"
                        style={aiProvider === p.id
                          ? { background: 'rgba(61,82,255,0.12)', border: '1px solid rgba(61,82,255,0.3)', color: '#6479ff' }
                          : { background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-2)' }}>
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block" style={{ color: 'var(--text-1)' }}>
                    کلید API {apiKey ? '(تنظیم شده ✓)' : '(تنظیم نشده)'}
                  </label>
                  <input
                    type="password"
                    value={newApiKey}
                    onChange={(e) => setNewApiKey(e.target.value)}
                    placeholder={apiKey ? 'برای تغییر، کلید جدید را وارد کنید...' : 'کلید API را وارد کنید...'}
                    className="inp"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block" style={{ color: 'var(--text-1)' }}>مدل AI</label>
                  <select value={settings.aiModel}
                    onChange={(e) => updateSettings({ aiModel: e.target.value })}
                    className="inp">
                    <optgroup label="OpenAI">
                      <option value="gpt-4o">GPT-4o (پیشنهادی)</option>
                      <option value="gpt-4o-mini">GPT-4o Mini (اقتصادی)</option>
                      <option value="gpt-4-turbo">GPT-4 Turbo</option>
                    </optgroup>
                    <optgroup label="Anthropic">
                      <option value="claude-opus-4-8">Claude Opus 4.8</option>
                      <option value="claude-sonnet-5">Claude Sonnet 5</option>
                      <option value="claude-haiku-4-5-20251001">Claude Haiku 4.5</option>
                    </optgroup>
                    <optgroup label="Google Gemini">
                      <option value="gemini-2.0-flash">Gemini 2.0 Flash (پیشنهادی)</option>
                      <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
                      <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                    </optgroup>
                  </select>
                </div>
                <div className="p-3 rounded-xl text-sm" style={{ background: 'rgba(61,82,255,0.06)', border: '1px solid rgba(61,82,255,0.15)', color: 'var(--text-2)' }}>
                  💡 برای مدیریت پرامپت‌های سیستمی هر ماژول، به بخش{' '}
                  <button onClick={() => setActiveView('prompt-manager')} className="text-brand-400 underline">مدیریت پرامپت‌ها</button> مراجعه کنید.
                </div>
              </div>
            </div>
          )}

          {/* Appearance */}
          {activeSection === 'appearance' && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="section-title">تنظیمات ظاهری</h3>
              <div className="card p-5 space-y-5">
                <div>
                  <label className="text-sm font-semibold mb-3 block" style={{ color: 'var(--text-1)' }}>تم رابط کاربری</label>
                  <div className="grid grid-cols-2 gap-4">
                    {(['dark', 'light'] as const).map((t) => (
                      <button key={t} onClick={() => toggleTheme()}
                        className="p-4 rounded-xl text-right transition-all"
                        style={theme === t
                          ? { borderColor: 'rgba(61,82,255,0.35)', background: 'rgba(61,82,255,0.08)', border: '1px solid rgba(61,82,255,0.35)' }
                          : { background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                        <div className="flex items-center gap-2 mb-2">
                          {t === 'dark' ? <Moon className="w-4 h-4 text-brand-400" /> : <Sun className="w-4 h-4 text-amber-400" />}
                          <span className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>
                            {t === 'dark' ? 'تیره (پیش‌فرض)' : 'روشن'}
                          </span>
                          {theme === t && <CheckCircle className="w-3.5 h-3.5 text-emerald-400 mr-auto" />}
                        </div>
                        <p className="text-xs" style={{ color: 'var(--text-3)' }}>
                          {t === 'dark' ? 'مناسب برای محیط‌های کم‌نور و استفاده طولانی' : 'مناسب برای محیط‌های روشن و ارائه‌ها'}
                        </p>
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-3 mt-4">
                    <span className="text-sm" style={{ color: 'var(--text-2)' }}>تغییر سریع:</span>
                    <ThemeToggle />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-semibold mb-3 block" style={{ color: 'var(--text-1)' }}>ارز نمایشی</label>
                  <div className="grid grid-cols-3 gap-3">
                    {(['IRR', 'USD', 'EUR'] as const).map((c) => (
                      <button key={c} onClick={() => updateSettings({ displayCurrency: c })}
                        className="p-2.5 rounded-lg text-sm font-medium transition-all"
                        style={settings.displayCurrency === c
                          ? { background: 'rgba(61,82,255,0.12)', color: '#6479ff', border: '1px solid rgba(61,82,255,0.25)' }
                          : { background: 'var(--surface-2)', color: 'var(--text-2)', border: '1px solid var(--border)' }}>
                        {c === 'IRR' ? '🇮🇷 تومان' : c === 'USD' ? '🇺🇸 دلار' : '🇪🇺 یورو'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notifications */}
          {activeSection === 'notifications' && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="section-title">تنظیمات اعلان‌ها</h3>
              <div className="card p-5 space-y-4">
                {[
                  { key: 'email', label: 'اعلان ایمیل', desc: 'ارسال هشدارها به ایمیل' },
                ].map(({ key, label, desc }) => (
                  <div key={key} className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                    <div>
                      <p className="text-sm font-medium" style={{ color: 'var(--text-1)' }}>{label}</p>
                      <p className="text-xs" style={{ color: 'var(--text-3)' }}>{desc}</p>
                    </div>
                    <button
                      onClick={() => updateSettings({ notifications: { ...settings.notifications, [key]: !settings.notifications[key as keyof typeof settings.notifications] } })}
                      className="relative w-11 h-6 rounded-full transition-all"
                      style={{ background: settings.notifications[key as keyof typeof settings.notifications] ? '#3d52ff' : 'var(--surface-3)' }}>
                      <div className="absolute w-4 h-4 bg-white rounded-full top-1 transition-all"
                        style={{ right: settings.notifications[key as keyof typeof settings.notifications] ? 6 : undefined, left: settings.notifications[key as keyof typeof settings.notifications] ? undefined : 4 }} />
                    </button>
                  </div>
                ))}

                <div>
                  <label className="text-sm font-medium mb-2 block" style={{ color: 'var(--text-1)' }}>آستانه اعلان</label>
                  <select value={settings.notifications.alertThreshold}
                    onChange={(e) => updateSettings({ notifications: { ...settings.notifications, alertThreshold: e.target.value as 'critical' | 'warning' | 'info' } })}
                    className="inp">
                    <option value="critical">فقط بحرانی</option>
                    <option value="warning">هشدار و بالاتر</option>
                    <option value="info">همه اعلان‌ها</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Save button */}
          <div className="flex justify-end mt-5">
            <button onClick={handleSave} className="btn btn-primary">
              {saved ? <><CheckCircle className="w-4 h-4" />ذخیره شد</> : <><Save className="w-4 h-4" />ذخیره تنظیمات</>}
            </button>
          </div>
        </div>
      </div>

      <ContextChat moduleId="settings" title="دستیار تنظیمات" />
    </div>
  );
}
