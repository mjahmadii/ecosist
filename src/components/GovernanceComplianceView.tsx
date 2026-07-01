import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Subsidiary, RiskThresholds } from '../types';
import { askGeminiAssistant } from '../lib/geminiClient';
import MarkdownRenderer from './MarkdownRenderer';
import { 
  ShieldCheck, Award, Users, Scale, CheckCircle2, AlertTriangle, 
  Sparkles, ChevronRight, HelpCircle, FileText, Check, Cpu 
} from 'lucide-react';

interface GovernanceComplianceViewProps {
  subsidiaries: Subsidiary[];
  thresholds: RiskThresholds;
  apiKey: string | null;
}

export default function GovernanceComplianceView({
  subsidiaries,
  thresholds,
  apiKey
}: GovernanceComplianceViewProps) {
  const [selectedSubId, setSelectedSubId] = useState(subsidiaries[0]?.id || '');
  const [activeChecklist, setActiveChecklist] = useState<'board' | 'transparency' | 'audit' | 'disputes'>('board');
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditReport, setAuditReport] = useState<string | null>(null);

  const activeSub = subsidiaries.find(s => s.id === selectedSubId) || subsidiaries[0];

  const handleRunAudit = async () => {
    if (isAuditing) return;
    setIsAuditing(true);
    setAuditReport(null);

    const promptText = `فرمت خروجی یک ممیزی جامع حاکمیت شرکتی برای شرکت ${activeSub.name} با نماد ${activeSub.ticker} در صنعت ${activeSub.sector} به زبان فارسی باشد.
    معیارها:
    - نسبت مدیران مستقل: ${Math.round(activeSub.governanceData.independentDirectorsRatio * 100)}٪ (آستانه هدف: ۴۰٪)
    - حضور اعضا در جلسات: ${Math.round(activeSub.governanceData.attendanceRate * 100)}٪ (آستانه هدف: ${Math.round(thresholds.minAttendanceRate * 100)}٪)
    - امتیاز شفافیت کدال: ${activeSub.governanceData.transparencyScore} از ۱۰۰ (آستانه هدف: ${thresholds.minTransparencyScore})
    - رتبه حسابرس بورس: رتبه ${activeSub.governanceData.auditQualityRating}
    - تعداد اختلافات حقوقی سهامداران: ${activeSub.governanceData.shareholderDisputesCount} مورد
    
    یک گزارش ممیزی رسمی و محترمانه از طرف هسته هوش تصمیم‌یار حاکمیتی صادر کن شامل:
    ۱. تحلیل انطباق با دستورالعمل حاکمیت شرکتی سازمان بورس ایران.
    ۲. مغایرت‌های کلیدی با اهداف آستانه هلدینگ سپه.
    ۳. ۳ دستورالعمل اصلاحی فوری برای مجمع عمومی عادی سالیانه آتی.`;

    try {
      const response = await askGeminiAssistant(
        promptText,
        apiKey,
        activeSub,
        'CONSERVATIVE',
        thresholds,
        'analytical',
        'comprehensive',
        'precise'
      );
      setAuditReport(response);
    } catch (err: any) {
      setAuditReport(`بروز خطا در برقراری ارتباط با هسته هوشمند: ${err.message || 'خطای اتصال شبکه'}`);
    } finally {
      setIsAuditing(false);
    }
  };

  return (
    <div className="space-y-6 text-neutral-200 animate-fade-in" id="governance-compliance-view">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#2563eb]/10 via-[#4f46e5]/5 to-transparent border border-[#2563eb]/20 p-6 rounded-2xl relative overflow-hidden" dir="rtl">
        <div className="relative z-10 max-w-4xl space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold rounded-full">
            <ShieldCheck size={12} />
            <span>ماژول هوشمند پایش حاکمیت شرکتی و انطباق ضوابط سازمان بورس</span>
          </div>
          <h1 className="text-xl md:text-2xl font-black text-white tracking-tight">
            ممیزی عالیه و انطباق حاکمیت شرکتی تابعه‌ها
          </h1>
          <p className="text-xs text-neutral-400 leading-relaxed max-w-2xl">
            کنترل یکپارچه ساختار هیئت مدیره، رتبه‌بندی کیفی حسابرسی، پیشگیری از اختلافات حقوقی، ارتقای رتبه شفافیت کدال و استخراج خودکار آیین‌نامه‌ها با کمک هسته هوش تصمیم‌یار سپه.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" dir="rtl">
        {/* Left Side: Audit Actions & AI generation */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-[#16161a] border border-white/10 rounded-2xl p-6 space-y-5">
            <div className="flex justify-between items-center border-b border-white/5 pb-4">
              <div className="text-right">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Cpu size={16} className="text-blue-400" />
                  ممیزی حاکمیتی هوشمند (آفلاین / برخط)
                </h3>
                <p className="text-[10px] text-neutral-500 mt-0.5">بررسی تطبیقی ترازنامه‌ها و ضوابط نظارتی بورس</p>
              </div>
              
              {/* Subsidiary Selector */}
              <select
                value={selectedSubId}
                onChange={(e) => {
                  setSelectedSubId(e.target.value);
                  setAuditReport(null);
                }}
                className="bg-[#0a0a0b] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500 font-sans cursor-pointer"
              >
                {subsidiaries.map(sub => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name} ({sub.ticker})
                  </option>
                ))}
              </select>
            </div>

            {/* Sub Stats Cards Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3.5 bg-[#0a0a0b] border border-white/5 rounded-xl space-y-1">
                <span className="text-[10px] text-neutral-500 block">مدیران مستقل</span>
                <span className={`text-sm font-bold block ${activeSub.governanceData.independentDirectorsRatio >= 0.4 ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {Math.round(activeSub.governanceData.independentDirectorsRatio * 100)}٪
                </span>
                <span className="text-[9px] text-neutral-600 block">هدف: ≥ ۴۰٪</span>
              </div>

              <div className="p-3.5 bg-[#0a0a0b] border border-white/5 rounded-xl space-y-1">
                <span className="text-[10px] text-neutral-500 block">امتیاز شفافیت کدال</span>
                <span className={`text-sm font-bold block ${activeSub.governanceData.transparencyScore >= thresholds.minTransparencyScore ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {activeSub.governanceData.transparencyScore} <span className="text-[10px] text-neutral-500 font-normal">/ ۱۰۰</span>
                </span>
                <span className="text-[9px] text-neutral-600 block">حد مجاز: {thresholds.minTransparencyScore}</span>
              </div>

              <div className="p-3.5 bg-[#0a0a0b] border border-white/5 rounded-xl space-y-1">
                <span className="text-[10px] text-neutral-500 block">کیفیت حسابرس رسمی</span>
                <span className={`text-sm font-bold block ${activeSub.governanceData.auditQualityRating === 'A' ? 'text-emerald-400' : activeSub.governanceData.auditQualityRating === 'B' ? 'text-blue-400' : 'text-amber-400'}`}>
                  رتبه {activeSub.governanceData.auditQualityRating}
                </span>
                <span className="text-[9px] text-neutral-600 block">هدف: رتبه الف بورسی</span>
              </div>

              <div className="p-3.5 bg-[#0a0a0b] border border-white/5 rounded-xl space-y-1">
                <span className="text-[10px] text-neutral-500 block">دعاوی حقوقی سهامداران</span>
                <span className={`text-sm font-bold block ${activeSub.governanceData.shareholderDisputesCount === 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {activeSub.governanceData.shareholderDisputesCount.toLocaleString('fa-IR')} مورد
                </span>
                <span className="text-[9px] text-neutral-600 block">هدف: به حداقل رساندن</span>
              </div>
            </div>

            {/* Run Audit CTA */}
            <div className="flex flex-col gap-3">
              <button
                onClick={handleRunAudit}
                disabled={isAuditing}
                className="w-full py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold rounded-xl shadow-lg active:translate-y-px transition-all flex items-center justify-center gap-2 cursor-pointer disabled:from-white/5 disabled:to-white/5 disabled:text-neutral-500"
              >
                {isAuditing ? (
                  <>
                    <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    <span>در حال ارزیابی ترازنامه‌ها و انطباق با ضوابط...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    <span>صدور گزارش رسمی ممیزی و آیین‌نامه انطباق بورس</span>
                  </>
                )}
              </button>
            </div>

            {/* Audit Output Box */}
            <AnimatePresence>
              {auditReport && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="bg-[#0a0a0b] border border-white/10 rounded-xl p-4 space-y-4 font-sans text-xs leading-relaxed"
                >
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <span className="text-blue-400 font-bold flex items-center gap-1">
                      <FileText size={14} />
                      گزارش رسمی هسته هوشمند تصمیم‌یار حاکمیت شرکتی
                    </span>
                    <span className="text-[9px] text-neutral-500 font-mono">STATUS: EMITTED</span>
                  </div>
                  <div className="text-neutral-300 font-sans" dir="rtl">
                    <MarkdownRenderer content={auditReport} />
                  </div>
                  <div className="text-[9px] text-neutral-600 bg-white/5 p-2 rounded-lg text-center" dir="rtl">
                    این ممیزی جنبه توصیه‌ای داشته و باید پیش از اجرا در مجامع به تایید نهایی معاونت حقوقی بانک سپه برسد.
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right Side: Interactive Checklist & Holding Average Score */}
        <div className="lg:col-span-5 space-y-6">
          {/* Compliance Checklist Cards */}
          <div className="bg-[#16161a] border border-white/10 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Award size={16} className="text-indigo-400" />
              ضوابط نظارتی و چک‌لیست پایش کدال
            </h3>
            <p className="text-[10px] text-neutral-500">جهت افزایش شفافیت و جلب اعتماد بازار سرمایه</p>

            {/* Checklist Tabs */}
            <div className="grid grid-cols-4 gap-1 bg-[#0a0a0b] p-1 rounded-lg border border-white/5">
              {[
                { key: 'board', label: 'اعضای هیئت' },
                { key: 'transparency', label: 'کدال' },
                { key: 'audit', label: 'حسابرس' },
                { key: 'disputes', label: 'دعاوی' }
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveChecklist(tab.key as any)}
                  className={`py-2 px-1 rounded-md text-[10px] font-bold transition-all cursor-pointer text-center block ${activeChecklist === tab.key ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'text-neutral-400 hover:text-white'}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Checklist Detailed Status */}
            <div className="bg-[#0a0a0b] border border-white/5 rounded-xl p-4 min-h-[160px] flex flex-col justify-between">
              {activeChecklist === 'board' && (
                <div className="space-y-3 text-xs">
                  <div className="flex items-start gap-2.5">
                    <Users size={14} className="text-blue-400 mt-0.5" />
                    <div>
                      <span className="font-bold text-neutral-200 block">کنترل مدیران غیرموظف و مستقل:</span>
                      <p className="text-[10px] text-neutral-500 leading-normal mt-1">
                        دستورالعمل سازمان بورس الزام می‌کند حداقل ۲۰٪ و ترجیحاً دو عضو از هیئت مدیره شرکت‌های تابعه باید «عضو مستقل» با شرایط خاص صلاحیت باشند.
                      </p>
                    </div>
                  </div>
                  <div className="border-t border-white/5 pt-2 flex items-center justify-between text-[10px]">
                    <span className="text-neutral-500">انطباق شرکت {activeSub.name}:</span>
                    <span className={`font-bold ${activeSub.governanceData.independentDirectorsRatio >= 0.4 ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {activeSub.governanceData.independentDirectorsRatio >= 0.4 ? '✅ منطبق (۴۰٪ مدیر مستقل)' : '⚠️ در آستانه هشدار'}
                    </span>
                  </div>
                </div>
              )}

              {activeChecklist === 'transparency' && (
                <div className="space-y-3 text-xs">
                  <div className="flex items-start gap-2.5">
                    <Scale size={14} className="text-emerald-400 mt-0.5" />
                    <div>
                      <span className="font-bold text-neutral-200 block">امتیاز افشای داوطلبانه و به موقع:</span>
                      <p className="text-[10px] text-neutral-500 leading-normal mt-1">
                        ارسال به موقع صورت‌های مالی میان‌دوره و سالانه، انتشار دعوت‌نامه‌ها، مصوبات مجامع و افشای فوری اطلاعات الف و ب در سامانه کدال بورس.
                      </p>
                    </div>
                  </div>
                  <div className="border-t border-white/5 pt-2 flex items-center justify-between text-[10px]">
                    <span className="text-neutral-500">امتیاز شفافیت کدال {activeSub.name}:</span>
                    <span className={`font-bold ${activeSub.governanceData.transparencyScore >= thresholds.minTransparencyScore ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {activeSub.governanceData.transparencyScore >= thresholds.minTransparencyScore ? `✅ مطلوب (${activeSub.governanceData.transparencyScore} امتیاز)` : '⚠️ شفافیت ناکافی'}
                    </span>
                  </div>
                </div>
              )}

              {activeChecklist === 'audit' && (
                <div className="space-y-3 text-xs">
                  <div className="flex items-start gap-2.5">
                    <ShieldCheck size={14} className="text-indigo-400 mt-0.5" />
                    <div>
                      <span className="font-bold text-neutral-200 block">رتبه‌بندی کیفی بازرس معتمد بورس:</span>
                      <p className="text-[10px] text-neutral-500 leading-normal mt-1">
                        شرکت‌های تابعه هلدینگ موظف به انعقاد قرارداد حسابرسی تنها با موسسات عضو جامعه حسابداران رسمی ایران با رتبه «الف» یا «ب» مورد تایید سازمان بورس هستند.
                      </p>
                    </div>
                  </div>
                  <div className="border-t border-white/5 pt-2 flex items-center justify-between text-[10px]">
                    <span className="text-neutral-500">رتبه حسابرسی {activeSub.name}:</span>
                    <span className={`font-bold ${activeSub.governanceData.auditQualityRating === 'A' ? 'text-emerald-400' : 'text-blue-400'}`}>
                      {activeSub.governanceData.auditQualityRating === 'A' ? '✅ رتبه الف بورسی' : '⚠️ رتبه ب - تلاش برای ارتقا به الف'}
                    </span>
                  </div>
                </div>
              )}

              {activeChecklist === 'disputes' && (
                <div className="space-y-3 text-xs">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle size={14} className="text-rose-400 mt-0.5" />
                    <div>
                      <span className="font-bold text-neutral-200 block">دعاوی و اعتراضات سهامداران اقلیت:</span>
                      <p className="text-[10px] text-neutral-500 leading-normal mt-1">
                        صیانت کامل از حقوق سهامداران خرد در توزیع سود نقدی، پاسخگویی مستمر به مکاتبات بورس و عدم تضییع حقوق ذینفعان غیر حاکمیتی.
                      </p>
                    </div>
                  </div>
                  <div className="border-t border-white/5 pt-2 flex items-center justify-between text-[10px]">
                    <span className="text-neutral-500">پرونده فعال سهامداران {activeSub.name}:</span>
                    <span className={`font-bold ${activeSub.governanceData.shareholderDisputesCount === 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {activeSub.governanceData.shareholderDisputesCount === 0 ? '✅ بدون اختلاف حقوقی فعال' : `⚠️ دارای ${activeSub.governanceData.shareholderDisputesCount} پرونده باز`}
                    </span>
                  </div>
                </div>
              )}

              <div className="mt-3 bg-white/5 p-2 rounded-lg flex items-center gap-2">
                <Check size={12} className="text-indigo-400" />
                <span className="text-[9px] text-neutral-400">آخرین انطباق‌سنجی: تیر ۱۴۰۵ با ضوابط جدید مجمع</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
