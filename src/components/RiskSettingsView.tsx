import React, { useState } from 'react';
import { RiskPersona, RiskThresholds } from '../types';
import { ShieldAlert, Shield, Sliders, Info, CheckCircle2, RefreshCw, Key } from 'lucide-react';

interface RiskSettingsViewProps {
  activePersona: RiskPersona;
  thresholds: RiskThresholds;
  onChangePersona: (persona: RiskPersona) => void;
  onChangeThresholds: (thresholds: RiskThresholds) => void;
  apiKey: string | null;
  onUpdateApiKey: (key: string) => void;
}

export default function RiskSettingsView({
  activePersona,
  thresholds,
  onChangePersona,
  onChangeThresholds,
  apiKey,
  onUpdateApiKey
}: RiskSettingsViewProps) {
  const [keyInput, setKeyInput] = useState(() => {
    if (!apiKey || apiKey === 'default-system-key' || apiKey === 'legacy-key') {
      return '';
    }
    return apiKey;
  });
  const [showSavedToast, setShowSavedToast] = useState(false);

  const handleSaveKey = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateApiKey(keyInput.trim() || 'default-system-key');
    setShowSavedToast(true);
    setTimeout(() => setShowSavedToast(false), 3000);
  };

  const handleUseDefault = () => {
    setKeyInput('');
    onUpdateApiKey('default-system-key');
    setShowSavedToast(true);
    setTimeout(() => setShowSavedToast(false), 3000);
  };
  
  // Risk Persona Presets Handlers
  const handlePersonaClick = (persona: RiskPersona) => {
    let presetThresholds: RiskThresholds = { ...thresholds };

    if (persona === 'CONSERVATIVE') {
      presetThresholds = {
        maxDebtToEquity: 1.0, // Strict leverage limit
        minCurrentRatio: 1.5,  // Safe liquidity cover
        minTransparencyScore: 80, // High compliance required
        minAttendanceRate: 0.92,
        minEsgScore: 75
      };
    } else if (persona === 'BALANCED') {
      presetThresholds = {
        maxDebtToEquity: 1.8,
        minCurrentRatio: 1.1,
        minTransparencyScore: 65,
        minAttendanceRate: 0.85,
        minEsgScore: 60
      };
    } else if (persona === 'AGGRESSIVE') {
      presetThresholds = {
        maxDebtToEquity: 3.0, // High leverage tolerated for expansion
        minCurrentRatio: 0.7,  // Lean liquidity accepted
        minTransparencyScore: 50,
        minAttendanceRate: 0.75,
        minEsgScore: 40
      };
    }

    onChangePersona(persona);
    onChangeThresholds(presetThresholds);
  };

  const handleSliderChange = (key: keyof RiskThresholds, val: number) => {
    const updated = {
      ...thresholds,
      [key]: val
    };
    onChangeThresholds(updated);
  };

  return (
    <div className="space-y-6 text-neutral-200 font-sans" id="risk-management-tab">
      
      {/* Overview */}
      <div className="bg-[#16161a] border border-white/10 p-5 rounded-xl shadow-lg flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="text-right order-2 md:order-1">
          <h3 className="text-sm font-bold text-neutral-100 flex items-center justify-end gap-2" dir="rtl">
            تنظیمات حاکمیتی و پیکربندی اشتهای ریسک هلدینگ
            <span className="p-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded">
              <ShieldAlert size={14} />
            </span>
          </h3>
          <p className="text-xs text-neutral-400 mt-1" dir="rtl">
            تعیین استراتژی نظارتی هلدینگ بانک سپه بر اساس اشتهای ریسک مدیران و تنظیم آستانه‌های نظارتی صورت‌های مالی شرکت‌های فرعی.
          </p>
        </div>
        <span className="p-3 bg-[#0a0a0b] border border-white/10 text-blue-400 rounded-xl order-1 md:order-2">
          <ShieldAlert size={24} />
        </span>
      </div>

      {/* API Key Configuration Panel */}
      <div className="bg-[#16161a] border border-white/10 p-5 rounded-xl shadow-lg space-y-4" dir="rtl">
        <div className="flex justify-between items-center border-b border-white/5 pb-3">
          <span className="text-[10px] text-neutral-500 font-mono font-bold">DECISION ENGINE KEY</span>
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <Key size={15} className="text-blue-400" />
            اتصال هوشمند هسته تصمیم‌یار مالی سپه
          </h4>
        </div>

        <form onSubmit={handleSaveKey} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          <div className="md:col-span-8 space-y-1.5 text-right">
            <label className="text-[11px] text-neutral-400 font-bold block">کلید دسترسی هوش مصنوعی (API Key):</label>
            <input
              type="password"
              placeholder="کلید ارتباطی خود را در این بخش وارد کنید..."
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              className="w-full bg-[#0a0a0b] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
            />
          </div>
          
          <div className="md:col-span-4 flex gap-2">
            <button
              type="submit"
              id="save-api-key"
              className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs active:translate-y-px transition-all cursor-pointer"
            >
              به‌روزرسانی کلید
            </button>
            <button
              type="button"
              onClick={handleUseDefault}
              className="flex-1 py-2.5 bg-[#0a0a0b] hover:bg-white/5 border border-white/10 text-neutral-300 hover:text-white font-bold rounded-xl text-[11px] transition-all cursor-pointer"
            >
              استفاده از کلید عمومی
            </button>
          </div>
        </form>

        {showSavedToast && (
          <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-[10px] font-bold text-center animate-fade-in flex items-center justify-center gap-1.5">
            <CheckCircle2 size={12} />
            <span>کلید با موفقیت در مرورگر شما ثبت و فعال گردید!</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Persona Selection */}
        <div className="bg-[#16161a] border border-white/10 p-5 rounded-xl shadow-lg space-y-4">
          <div className="pb-3 border-b border-white/10">
            <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider font-mono">Risk Persona Profile</h4>
            <p className="text-[10px] text-neutral-500 mt-0.5" dir="rtl">تغییر استراتژی و رویکرد کلی حاکمیتی</p>
          </div>

          <div className="space-y-3">
            {/* Conservative */}
            <div 
              onClick={() => handlePersonaClick('CONSERVATIVE')}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                activePersona === 'CONSERVATIVE'
                  ? 'bg-emerald-950/20 border-emerald-500/40 shadow-md'
                  : 'bg-[#0a0a0b] border-white/5 hover:border-white/20'
              }`}
              dir="rtl"
            >
              <div className="flex items-center gap-2 mb-1.5 justify-between">
                <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${activePersona === 'CONSERVATIVE' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-[#16161a] text-neutral-500'}`}>
                  بسیار محافظه‌کار
                </span>
                <h5 className="font-bold text-xs text-neutral-200">Highly Conservative</h5>
              </div>
              <p className="text-[10px] text-neutral-400 leading-relaxed">
                اولویت اول بر ثبات، صیانت از اصل دارایی‌ها و پیشگیری ۱۰۰٪ از ریسک ورشکستگی است. آستانه‌های مالی بسیار سخت‌گیرانه‌ای اعمال می‌شود.
              </p>
            </div>

            {/* Balanced */}
            <div 
              onClick={() => handlePersonaClick('BALANCED')}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                activePersona === 'BALANCED'
                  ? 'bg-blue-950/20 border-blue-500/40 shadow-md'
                  : 'bg-[#0a0a0b] border-white/5 hover:border-white/20'
              }`}
              dir="rtl"
            >
              <div className="flex items-center gap-2 mb-1.5 justify-between">
                <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${activePersona === 'BALANCED' ? 'bg-blue-500/15 text-blue-400' : 'bg-[#16161a] text-neutral-500'}`}>
                  متعادل / متوازن
                </span>
                <h5 className="font-bold text-xs text-neutral-200">Balanced Strategy</h5>
              </div>
              <p className="text-[10px] text-neutral-400 leading-relaxed">
                ایجاد تعادل منطقی میان اهرم بدهی و حاشیه سود. این گزینه پیش‌فرض و استاندارد صنعت سرمایه‌گذاری برای سودآوری پایدار است.
              </p>
            </div>

            {/* Aggressive */}
            <div 
              onClick={() => handlePersonaClick('AGGRESSIVE')}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                activePersona === 'AGGRESSIVE'
                  ? 'bg-blue-950/10 border-blue-400/30 shadow-md'
                  : 'bg-[#0a0a0b] border-white/5 hover:border-white/20'
              }`}
              dir="rtl"
            >
              <div className="flex items-center gap-2 mb-1.5 justify-between">
                <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${activePersona === 'AGGRESSIVE' ? 'bg-blue-500/15 text-blue-400' : 'bg-[#16161a] text-neutral-500'}`}>
                  تهاجمی / مقتدر
                </span>
                <h5 className="font-bold text-xs text-neutral-200">Aggressive Expansion</h5>
              </div>
              <p className="text-[10px] text-neutral-400 leading-relaxed">
                تمرکز بر رشد شتابان، تصاحب سهم بازار بیشتر و پذیرش اهرم‌های بدهی سنگین‌تر. ایده‌آل برای صنایع فناورانه با رشد بالا.
              </p>
            </div>
          </div>
        </div>

        {/* Right Side: Interactive Sliders */}
        <div className="bg-[#16161a] border border-white/10 p-5 rounded-xl shadow-lg lg:col-span-2 space-y-6">
          <div className="pb-3 border-b border-white/10 flex justify-between items-center">
            <span className="text-xs font-mono text-neutral-500 font-semibold">CUSTOM TUNING PANEL</span>
            <h4 className="text-sm font-bold text-neutral-300" dir="rtl">تنظیم آستانه‌های انضباطی</h4>
          </div>

          <div className="space-y-5 text-xs">
            {/* Slider 1 */}
            <div className="space-y-2 bg-[#0a0a0b]/50 p-3.5 rounded-lg border border-white/5">
              <div className="flex justify-between items-center">
                <span className="font-mono text-blue-400 font-bold">{thresholds.maxDebtToEquity.toFixed(1)}x</span>
                <span className="text-neutral-300 font-semibold" dir="rtl">حداکثر نسبت بدهی به حقوق صاحبان سهام (Debt-to-Equity Limit):</span>
              </div>
              <input 
                type="range" 
                min="0.5" 
                max="4.0" 
                step="0.1"
                value={thresholds.maxDebtToEquity} 
                onChange={(e) => handleSliderChange('maxDebtToEquity', parseFloat(e.target.value))}
                className="w-full accent-blue-500 cursor-pointer" 
              />
              <p className="text-[10px] text-neutral-500 text-right" dir="rtl">سقف مجاز نسبت کل بدهی به سرمایه شرکت تابعه قبل از صدور آلارم ریسک.</p>
            </div>

            {/* Slider 2 */}
            <div className="space-y-2 bg-[#0a0a0b]/50 p-3.5 rounded-lg border border-white/5">
              <div className="flex justify-between items-center">
                <span className="font-mono text-emerald-400 font-bold">{thresholds.minCurrentRatio.toFixed(1)}x</span>
                <span className="text-neutral-300 font-semibold" dir="rtl">کف نسبت جاری نقدینگی (Minimum Current Ratio):</span>
              </div>
              <input 
                type="range" 
                min="0.5" 
                max="2.5" 
                step="0.1"
                value={thresholds.minCurrentRatio} 
                onChange={(e) => handleSliderChange('minCurrentRatio', parseFloat(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer" 
              />
              <p className="text-[10px] text-neutral-500 text-right" dir="rtl">حداقل نسبت نقدینگی کوتاه مدت (دارایی‌های جاری تقسیم بر بدهی‌های جاری) تابعه.</p>
            </div>

            {/* Slider 3 */}
            <div className="space-y-2 bg-[#0a0a0b]/50 p-3.5 rounded-lg border border-white/5">
              <div className="flex justify-between items-center">
                <span className="font-mono text-blue-400 font-bold">{thresholds.minTransparencyScore}%</span>
                <span className="text-neutral-300 font-semibold" dir="rtl">حداقل نمره شفافیت مجامع (Min Transparency Score):</span>
              </div>
              <input 
                type="range" 
                min="40" 
                max="95" 
                step="5"
                value={thresholds.minTransparencyScore} 
                onChange={(e) => handleSliderChange('minTransparencyScore', parseInt(e.target.value))}
                className="w-full accent-blue-500 cursor-pointer" 
              />
              <p className="text-[10px] text-neutral-500 text-right" dir="rtl">حداقل امتیاز کسب شده در کمیته افشای حاکمیتی هلدینگ.</p>
            </div>

            {/* Slider 4 */}
            <div className="space-y-2 bg-[#0a0a0b]/50 p-3.5 rounded-lg border border-white/5">
              <div className="flex justify-between items-center">
                <span className="font-mono text-indigo-400 font-bold">{Math.round(thresholds.minAttendanceRate * 100)}%</span>
                <span className="text-neutral-300 font-semibold" dir="rtl">کف مشارکت اعضای هیئت مدیره (Min Board Attendance):</span>
              </div>
              <input 
                type="range" 
                min="0.70" 
                max="0.98" 
                step="0.02"
                value={thresholds.minAttendanceRate} 
                onChange={(e) => handleSliderChange('minAttendanceRate', parseFloat(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer" 
              />
              <p className="text-[10px] text-neutral-500 text-right" dir="rtl">حداقل نرخ کل حضور اعضا در مجمع جلسات هیئت مدیره تابعه.</p>
            </div>
          </div>

          <div className="bg-[#0a0a0b] border border-white/10 p-4 rounded-xl text-xs space-y-2 leading-relaxed text-neutral-400" dir="rtl">
            <span className="text-blue-400 font-bold flex items-center gap-1">
              <Info size={14} />
              <span>سیستم پویا و محاسبات زنده:</span>
            </span>
            <p>
              با تغییر هر یک از اسلایدرهای بالا، فرمول‌های ارزیابی سلامت مالی و حاکمیت شرکتی در کل سامانه به طور خودکار بازمحاسبه خواهند شد. بدین ترتیب رده‌بندی شرکت‌ها و هشدارهای حاشیه ترازنامه فوراً به‌روز می‌شوند.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
