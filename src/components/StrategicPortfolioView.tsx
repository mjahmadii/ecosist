import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Subsidiary, RiskThresholds } from '../types';
import { askGeminiAssistant } from '../lib/geminiClient';
import MarkdownRenderer from './MarkdownRenderer';
import { 
  TrendingUp, Wallet2, Sliders, Play, RefreshCw, BarChart2, 
  HelpCircle, Sparkles, Check, ArrowUpRight, ArrowDownRight, Cpu 
} from 'lucide-react';

interface StrategicPortfolioViewProps {
  subsidiaries: Subsidiary[];
  thresholds: RiskThresholds;
  apiKey: string | null;
}

interface AllocationSim {
  id: string;
  name: string;
  ticker: string;
  netProfit: number;
  payoutRatio: number; // 0 to 100
  reinvestRatio: number; // 0 to 100
}

export default function StrategicPortfolioView({
  subsidiaries,
  thresholds,
  apiKey
}: StrategicPortfolioViewProps) {
  // Setup initial allocation states for all subsidiaries
  const [simulations, setSimulations] = useState<AllocationSim[]>(() => 
    subsidiaries.map(sub => ({
      id: sub.id,
      name: sub.name,
      ticker: sub.ticker,
      netProfit: sub.financialData.netProfit,
      payoutRatio: 50, // default 50% dividend payout
      reinvestRatio: 50 // default 50% reinvestment
    }))
  );

  const [isGeneratingRecommendation, setIsGeneratingRecommendation] = useState(false);
  const [aiRecommendation, setAiRecommendation] = useState<string | null>(null);

  const handleRatioChange = (id: string, field: 'payoutRatio' | 'reinvestRatio', value: number) => {
    setSimulations(prev => 
      prev.map(sim => {
        if (sim.id === id) {
          const updatedSim = { ...sim, [field]: value };
          // Ensure payout + reinvest = 100%
          if (field === 'payoutRatio') {
            updatedSim.reinvestRatio = 100 - value;
          } else {
            updatedSim.payoutRatio = 100 - value;
          }
          return updatedSim;
        }
        return sim;
      })
    );
  };

  const handleResetSims = () => {
    setSimulations(
      subsidiaries.map(sub => ({
        id: sub.id,
        name: sub.name,
        ticker: sub.ticker,
        netProfit: sub.financialData.netProfit,
        payoutRatio: 50,
        reinvestRatio: 50
      }))
    );
    setAiRecommendation(null);
  };

  // Calculate total simulated cash flowing to Bank Sepah Parent
  const totalFlowToParent = simulations.reduce((acc, sim) => {
    const cash = sim.netProfit * (sim.payoutRatio / 100);
    return acc + cash;
  }, 0);

  // Calculate simulated group average reinvestment pool
  const totalReinvestmentPool = simulations.reduce((acc, sim) => {
    const cash = sim.netProfit * (sim.reinvestRatio / 100);
    return acc + cash;
  }, 0);

  // Simulated Group Debt reduction (based on payout ratio from high-leverage subsidiaries)
  const simulatedDebtReduction = simulations.reduce((acc, sim) => {
    const sub = subsidiaries.find(s => s.id === sim.id);
    if (!sub) return acc;
    // High debt companies (D/E > thresholds.maxDebtToEquity) that retain earnings (reinvest) will reduce their debt
    if (sub.riskMetrics.debtToEquity > thresholds.maxDebtToEquity) {
      const retained = sim.netProfit * (sim.reinvestRatio / 100);
      return acc + (retained * 0.6); // Assume 60% of retained earnings directly reduces leverage
    }
    return acc;
  }, 0);

  const handleGenerateAiOptimized = async () => {
    if (isGeneratingRecommendation) return;
    setIsGeneratingRecommendation(true);
    setAiRecommendation(null);

    const companyDataPrompt = simulations.map(sim => {
      const sub = subsidiaries.find(s => s.id === sim.id);
      return `- نام: ${sim.name} | نماد: ${sim.ticker} | سود خالص فعلی: ${sim.netProfit} میلیارد تومان | نسبت بدهی به حقوق صاحبان سهام: ${sub?.riskMetrics.debtToEquity.toFixed(2)}`;
    }).join('\n');

    const promptText = `به عنوان مشاور ارشد برنامه‌ریزی استراتژیک پرتفوی بانک سپه، بر اساس اطلاعات سود دهی و ترازنامه شرکت‌های تابعه زیر:
    ${companyDataPrompt}
    آستانه بدهی مجاز هلدینگ: ${thresholds.maxDebtToEquity}
    
    یک سناریوی بهینه‌سازی توزیع سود نقدی (Dividend Payout) و مجدد (Reinvestment) پیشنهاد بده که:
    ۱. جریان نقدی بازگشتی به شرکت مادر (بانک سپه) حداکثر شود.
    ۲. شرکت‌های بحرانی سیمانی و پتروشیمی که نسبت بدهی بالا دارند، بخش اعظمی از سود خود را انباشته و صرف تصفیه بدهی بانکی کنند.
    ۳. یک جدول توزیع پیشنهادی درصد سود برای هر کدام از ۵ شرکت در قالب پاسخ بنویس.
    پاسخ را به زبان فارسی بسیار فنی و دقیق و در قالب کادربندی‌های تمیز ارائه کن. از نام بردن از جمینای خودداری کن.`;

    try {
      const response = await askGeminiAssistant(
        promptText,
        apiKey,
        null,
        'BALANCED',
        thresholds,
        'analytical',
        'comprehensive',
        'balanced'
      );
      setAiRecommendation(response);
    } catch (err: any) {
      setAiRecommendation(`خطا در پردازش توسط هسته هوشمند سپه: ${err.message || 'خطای اتصال شبکه'}`);
    } finally {
      setIsGeneratingRecommendation(false);
    }
  };

  return (
    <div className="space-y-6 text-neutral-200 animate-fade-in" id="strategic-portfolio-view">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#4f46e5]/10 via-[#06b6d4]/5 to-transparent border border-[#4f46e5]/20 p-6 rounded-2xl relative overflow-hidden" dir="rtl">
        <div className="relative z-10 max-w-4xl space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-bold rounded-full">
            <TrendingUp size={12} />
            <span>ابزار پیشرفته شبیه‌سازی جریان نقدی هلدینگ و هدایت نقدینگی</span>
          </div>
          <h1 className="text-xl md:text-2xl font-black text-white tracking-tight">
            طرح‌ریزی پورتفوی و بهینه‌سازی جریان نقدی مجمع
          </h1>
          <p className="text-xs text-neutral-400 leading-relaxed max-w-2xl">
            شبیه‌سازی اثر نسبت‌های تقسیم سود نقدی در مجمع عمومی فوق‌العاده بر نقدینگی بانک سپه و کاهش بهای تمام‌شده پول و بدهی‌های کلان تابعه‌ها.
          </p>
        </div>
      </div>

      {/* KPI Metrics overview of simulation */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4" dir="rtl">
        <div className="bg-[#16161a] border border-white/10 rounded-xl p-4.5 text-right space-y-1">
          <span className="text-[10px] text-neutral-500 font-bold block">مجموع سود نقدی سرازیر شده به بانک سپه</span>
          <span className="text-lg font-black text-emerald-400 block">
            {totalFlowToParent.toLocaleString('fa-IR')} <span className="text-xs text-neutral-500 font-normal">میلیارد تومان</span>
          </span>
          <p className="text-[9px] text-neutral-600 flex items-center gap-1">
            <ArrowUpRight size={10} className="text-emerald-500" />
            جریان نقدی آزاد حاکمیتی جهت سرمایه‌گذاری‌های زیرساختی بانک
          </p>
        </div>

        <div className="bg-[#16161a] border border-white/10 rounded-xl p-4.5 text-right space-y-1">
          <span className="text-[10px] text-neutral-500 font-bold block">مجموع صندوق انباشته تابعه‌ها جهت طرح توسعه</span>
          <span className="text-lg font-black text-blue-400 block">
            {totalReinvestmentPool.toLocaleString('fa-IR')} <span className="text-xs text-neutral-500 font-normal">میلیارد تومان</span>
          </span>
          <p className="text-[9px] text-neutral-600 flex items-center gap-1">
            <Check size={10} className="text-blue-500" />
            حفظ سرمایه در گردش و پیشگیری از هزینه‌های بالای استقراض
          </p>
        </div>

        <div className="bg-[#16161a] border border-white/10 rounded-xl p-4.5 text-right space-y-1">
          <span className="text-[10px] text-neutral-500 font-bold block">تسهیل و کاهش بدهی‌های تابعه‌ها (شبیه‌سازی شده)</span>
          <span className="text-lg font-black text-indigo-400 block">
            {simulatedDebtReduction.toLocaleString('fa-IR')} <span className="text-xs text-neutral-500 font-normal">میلیارد تومان</span>
          </span>
          <p className="text-[9px] text-neutral-600 flex items-center gap-1">
            <ArrowDownRight size={10} className="text-indigo-400" />
            حذف تدریجی ریسک‌های بحرانی مدل آلتمن (ورشکستگی)
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" dir="rtl">
        {/* Left: Dynamic controls */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-[#16161a] border border-white/10 rounded-2xl p-6 space-y-5">
            <div className="flex justify-between items-center border-b border-white/5 pb-4">
              <div className="text-right">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sliders size={16} className="text-indigo-400" />
                  تنظیم اهرم تقسیم سود مجمع شرکت‌های تابعه
                </h3>
                <p className="text-[10px] text-neutral-500 mt-0.5">اسلایدر چپ تقسیم سود و اسلایدر راست انباشت سود است</p>
              </div>
              <button
                onClick={handleResetSims}
                title="بازنشانی شبیه‌ساز"
                className="p-1.5 bg-[#0a0a0b] hover:bg-white/5 border border-white/10 rounded-lg text-neutral-400 hover:text-white transition-all cursor-pointer"
              >
                <RefreshCw size={13} />
              </button>
            </div>

            {/* Sub Sliders List */}
            <div className="space-y-5">
              {simulations.map(sim => {
                const associatedSub = subsidiaries.find(s => s.id === sim.id);
                const isHighDebt = associatedSub ? associatedSub.riskMetrics.debtToEquity > thresholds.maxDebtToEquity : false;

                return (
                  <div key={sim.id} className="p-4 bg-[#0a0a0b] border border-white/5 rounded-xl space-y-3">
                    <div className="flex justify-between items-center">
                      <div className="text-right">
                        <span className="text-xs font-bold text-white block">
                          {sim.name} ({sim.ticker})
                        </span>
                        <span className="text-[9px] text-neutral-500 font-mono block">
                          سود کل برای توزیع: {sim.netProfit.toLocaleString('fa-IR')} میلیارد تومان
                        </span>
                      </div>
                      {isHighDebt && (
                        <span className="px-2 py-0.5 bg-red-500/10 border border-red-500/20 text-red-400 text-[9px] font-bold rounded-full">
                          ⚠️ ریسک بدهی بالا
                        </span>
                      )}
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] text-neutral-400 font-mono">
                        <span>تقسیم سود نقدی مجمع: {sim.payoutRatio}٪</span>
                        <span>انباشت در شرکت تابعه: {sim.reinvestRatio}٪</span>
                      </div>
                      
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="5"
                        value={sim.payoutRatio}
                        onChange={(e) => handleRatioChange(sim.id, 'payoutRatio', parseInt(e.target.value))}
                        className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-indigo-500 focus:outline-none"
                      />
                    </div>

                    <div className="flex justify-between items-center text-[10px] border-t border-white/5 pt-2">
                      <span className="text-neutral-500">جریان بازگشتی به بانک:</span>
                      <span className="font-bold text-emerald-400">
                        {Math.round(sim.netProfit * (sim.payoutRatio / 100)).toLocaleString('fa-IR')} میلیارد تومان
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: AI Portfolio optimization advisor */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-[#16161a] border border-white/10 rounded-2xl p-6 space-y-5">
            <div className="text-right">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Cpu size={16} className="text-cyan-400" />
                هسته هوش تصمیم‌یار هدایت نقدینگی
              </h3>
              <p className="text-[10px] text-neutral-500 mt-0.5">محاسبه علمی حاشیه امن سود و کاهش بهای تمام شده پول</p>
            </div>

            <p className="text-[11px] text-neutral-400 leading-relaxed text-right">
              با استفاده از الگوریتم‌های مالی هلدینگ سپه، می‌توانید بهترین سناریوی بهینه‌سازی توزیع نقدینگی را که مانع از بروز ریسک ورشکستگی شرکت‌های با اهرم بالا می‌شود، استخراج نمایید.
            </p>

            <button
              onClick={handleGenerateAiOptimized}
              disabled={isGeneratingRecommendation}
              className="w-full py-3 bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 text-white font-bold rounded-xl shadow-lg active:translate-y-px transition-all flex items-center justify-center gap-2 cursor-pointer disabled:from-white/5 disabled:to-white/5 disabled:text-neutral-500"
            >
              {isGeneratingRecommendation ? (
                <>
                  <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  <span>درحال استخراج فرمول بهینه‌سازی...</span>
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  <span>محاسبه هوشمند بهینه‌ترین پرتفوی سود مجمع</span>
                </>
              )}
            </button>

            <AnimatePresence>
              {aiRecommendation && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="bg-[#0a0a0b] border border-white/10 rounded-xl p-4.5 space-y-4 text-xs leading-relaxed"
                >
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <span className="text-cyan-400 font-bold flex items-center gap-1">
                      <BarChart2 size={14} />
                      راهبرد پیشنهادی هدایت نقدینگی هلدینگ
                    </span>
                    <span className="text-[9px] text-neutral-500 font-mono">MODEL: SEPAH-ALLOCATOR</span>
                  </div>
                  <div className="text-neutral-300 font-sans" dir="rtl">
                    <MarkdownRenderer content={aiRecommendation} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
