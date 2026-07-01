import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Key, Eye, EyeOff, CheckCircle2, Play, Sparkles, X } from 'lucide-react';

interface ApiKeyConfigProps {
  onConfigComplete: (key: string) => void;
}

export default function ApiKeyConfig({ onConfigComplete }: ApiKeyConfigProps) {
  const [apiKey, setApiKey] = useState(() => {
    const saved = localStorage.getItem('ehsan_api_key');
    if (!saved || saved === 'default-system-key' || saved === 'legacy-key') {
      return '';
    }
    return saved;
  });
  const [showKey, setShowKey] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = (keyToSave: string) => {
    const finalKey = keyToSave.trim() || 'default-system-key';
    setIsSaved(true);
    setTimeout(() => {
      onConfigComplete(finalKey);
    }, 600);
  };

  const handleUseDefault = () => {
    setApiKey('');
    handleSave('default-system-key');
  };

  return (
    <div id="api-config-container" className="min-h-screen bg-[#0a0a0b] flex flex-col items-center justify-center relative overflow-hidden px-4 font-sans">
      <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/10 blur-[120px]" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-500/10 blur-[120px]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', damping: 25 }}
        className="w-full max-w-xl bg-[#16161a] border border-white/10 backdrop-blur-md p-5 sm:p-8 rounded-2xl shadow-2xl relative z-10"
      >
        {/* Exit Button (X) */}
        <button
          onClick={() => onConfigComplete(localStorage.getItem('ehsan_api_key') || 'default-system-key')}
          className="absolute top-4 left-4 text-neutral-400 hover:text-white bg-white/5 hover:bg-white/10 p-1.5 rounded-full transition-all cursor-pointer"
          title="انصراف و خروج"
        >
          <X size={16} />
        </button>

        <div className="text-center mb-6">
          <div className="inline-flex p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl mb-3 text-blue-400">
            <Key size={24} />
          </div>
          <h2 className="text-base sm:text-2xl font-bold text-white tracking-tight" dir="rtl">
            تنظیمات کلید اتصال هوش مصنوعی
          </h2>
          <p className="text-[11px] sm:text-sm text-neutral-400 mt-1 font-mono">
            AI Service Configuration Portal
          </p>
        </div>

        <div className="space-y-6 text-neutral-300 text-sm leading-relaxed" dir="rtl">
          <p className="text-center text-neutral-400">
            برای راه‌اندازی فرآیندهای تحلیل هوشمند صورت‌های مالی، ارزیابی حاکمیتی و شبیه‌ساز مجمع هلدینگ بانک سپه، از کلید اختصاصی استفاده کنید.
          </p>

          <div className="bg-[#0a0a0b] border border-white/10 rounded-xl p-4 text-xs space-y-2">
            <span className="text-blue-400 font-semibold block">🔒 حریم خصوصی و امنیت اطلاعات مالی:</span>
            <p className="text-neutral-400 leading-relaxed">
              این برنامه کاملاً سرورلس بوده و کلید وارد شده صرفاً در حافظه داخلی مرورگر شما (<code className="text-emerald-400 font-mono">localStorage</code>) ذخیره شده و هیچ اطلاعاتی به سرور دیگری ارسال نمی‌شود. این رویکرد انطباق ۱۰۰ درصدی با هاست استاتیک نظیر گیت‌هاب را تضمین می‌سازد.
            </p>
          </div>

          <div className="space-y-3">
            <label className="block text-xs font-mono text-neutral-400 uppercase tracking-wider text-left">
              کلید ارتباط با موتور تصمیم‌یار هوشمند (API Key)
            </label>
            <div className="relative">
              <input
                id="api-key-input"
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full pl-4 pr-12 py-3 bg-[#0a0a0b] border border-white/10 rounded-lg text-white placeholder-neutral-700 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 font-mono text-sm transition-all text-left"
                placeholder="کلید اتصال به موتور تصمیم‌ساز را وارد نمایید..."
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-neutral-500 hover:text-neutral-300 transition-colors"
              >
                {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <button
              id="save-api-key"
              onClick={() => handleSave(apiKey)}
              disabled={!apiKey.trim() || isSaved}
              className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-white/5 disabled:to-white/5 disabled:text-neutral-600 text-white font-semibold rounded-lg shadow-lg active:translate-y-px transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSaved ? (
                <>
                  <CheckCircle2 size={18} />
                  <span>در حال اتصال ...</span>
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  <span>ذخیره و ورود به سامانه هوشمند</span>
                </>
              )}
            </button>

            <button
              id="bypass-api-key"
              onClick={handleUseDefault}
              className="flex-1 py-3 bg-[#0a0a0b] hover:bg-white/[0.05] text-neutral-200 font-semibold border border-white/10 rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Play size={18} />
              <span>استفاده از کلید پیش‌فرض سامانه</span>
            </button>
          </div>
        </div>

        <div className="mt-8 text-center text-[10px] text-neutral-500 font-mono">
          SUPPORTED PROTOCOLS: SEPAH-AI-CORE-v2.5 &bull; BANK SEPAH DECISION ENGINE
        </div>
      </motion.div>
    </div>
  );
}
