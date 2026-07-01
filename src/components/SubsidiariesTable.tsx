import React, { useState } from 'react';
import { Subsidiary } from '../types';
import { 
  Search, 
  SlidersHorizontal, 
  ArrowUpDown, 
  ChevronRight, 
  AlertTriangle, 
  Bot, 
  Sparkles, 
  Brain, 
  TrendingUp, 
  BarChart2, 
  ShieldAlert, 
  DollarSign, 
  Check, 
  RefreshCw,
  Award
} from 'lucide-react';
import { askGeminiAssistant } from '../lib/geminiClient';
import MarkdownRenderer from './MarkdownRenderer';

interface SubsidiariesTableProps {
  subsidiaries: Subsidiary[];
  onSelectCompany: (id: string) => void;
  apiKey?: string | null;
  theme?: string;
  riskPersona?: 'CONSERVATIVE' | 'BALANCED' | 'AGGRESSIVE';
  riskThresholds?: any;
}

type SortField = 'name' | 'healthScore' | 'governanceScore' | 'revenue' | 'netProfit' | 'zScore' | 'totalEsg';

export default function SubsidiariesTable({ 
  subsidiaries, 
  onSelectCompany,
  apiKey,
  theme = 'dark',
  riskPersona = 'BALANCED',
  riskThresholds
}: SubsidiariesTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sectorFilter, setSectorFilter] = useState('ALL');
  const [sortField, setSortField] = useState<SortField>('healthScore');
  const [sortAsc, setSortAsc] = useState(false);

  // AI Assistant State
  const [selectedAiCompanyId, setSelectedAiCompanyId] = useState<string>('all');
  const [aiReport, setAiReport] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisType, setAnalysisType] = useState<string>('');

  // Multi-Company Selection & Comparison State
  const [selectedCompanyIds, setSelectedCompanyIds] = useState<string[]>([]);
  const [compareAiReport, setCompareAiReport] = useState<string>('');
  const [isComparingAi, setIsComparingAi] = useState(false);

  // Sector list helper
  const sectors = ['ALL', ...Array.from(new Set(subsidiaries.map(sub => sub.sector)))];

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const filteredSubsidiaries = subsidiaries
    .filter(sub => {
      const matchesSearch = 
        sub.name.includes(searchQuery) || 
        sub.ticker.includes(searchQuery) ||
        sub.englishName.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesSector = sectorFilter === 'ALL' || sub.sector === sectorFilter;
      
      return matchesSearch && matchesSector;
    })
    .sort((a, b) => {
      let valA: any = 0;
      let valB: any = 0;

      if (sortField === 'name') {
        valA = a.name;
        valB = b.name;
      } else if (sortField === 'healthScore') {
        valA = a.healthScore;
        valB = b.healthScore;
      } else if (sortField === 'governanceScore') {
        valA = a.governanceScore;
        valB = b.governanceScore;
      } else if (sortField === 'revenue') {
        valA = a.financialData.revenue;
        valB = b.financialData.revenue;
      } else if (sortField === 'netProfit') {
        valA = a.financialData.netProfit;
        valB = b.financialData.netProfit;
      } else if (sortField === 'zScore') {
        valA = a.riskMetrics.altmanZScore;
        valB = b.riskMetrics.altmanZScore;
      } else if (sortField === 'totalEsg') {
        valA = a.esgData.totalEsgScore;
        valB = b.esgData.totalEsgScore;
      }

      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });

  // Score Badge Generator
  const renderScoreBadge = (score: number) => {
    let color = '';
    let pulse = '';
    if (score >= 80) {
      color = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      pulse = 'bg-emerald-400';
    } else if (score >= 60) {
      color = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      pulse = 'bg-amber-400';
    } else {
      color = 'bg-red-500/10 text-red-400 border-red-500/20';
      pulse = 'bg-red-400';
    }
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg border font-mono ${color}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${pulse}`} />
        {score}%
      </span>
    );
  };

  const renderBankruptcyBadge = (risk: string) => {
    let color = 'bg-slate-800 text-slate-300';
    if (risk === 'Very Low' || risk === 'Low') {
      color = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/15';
    } else if (risk === 'Moderate') {
      color = 'bg-amber-500/10 text-amber-400 border-amber-500/15';
    } else {
      color = 'bg-red-500/10 text-red-400 border-red-500/15 animate-pulse';
    }
    return (
      <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-md border ${color}`}>
        {risk}
      </span>
    );
  };

  // Dynamic AI Subsidiary Analysis Trigger
  const handleAiAnalysis = async (type: string) => {
    setIsAnalyzing(true);
    setAnalysisType(type);
    setAiReport('');

    const targetComp = selectedAiCompanyId === 'all' 
      ? null 
      : subsidiaries.find(s => s.id === selectedAiCompanyId);

    const personaText = riskPersona === 'CONSERVATIVE' ? 'بسیار محافظه‌کارانه و حفاظتی' : riskPersona === 'BALANCED' ? 'متعادل، نظارتی و پویا' : 'تهاجمی و توسعه‌گرا';

    let promptText = '';
    if (!targetComp) {
      // Portfolio analysis
      promptText = `شما تحلیل‌گر ارشد و دستیار هوشمند مدیریت ریسک هلدینگ سرمایه‌گذاری بانک سپه هستید.
      رویکرد و اشتهای ریسک جاری مجمع: ${personaText}.
      تعداد شرکت‌های تابعه تحت رصد: ${subsidiaries.length} شرکت.
      لیست مختصر وضعیت شرکت‌ها:
      ${subsidiaries.map(s => `- ${s.name} (${s.ticker}): سلامت مالی ${s.healthScore}%، حاکمیت شرکتی ${s.governanceScore}%، سود خالص ${s.financialData.netProfit} میلیارد تومان، زون ورشکستگی آلتمن ${s.riskMetrics.bankruptcyRisk}`).join('\n')}
      
      لطفاً یک گزارش ممیزی و نظارتی عالی، حرفه‌ای و طبقه بندی شده با عینک استراتژیک هلدینگ بانک سپه به صورت ساختاریافته (مارک‌داون شامل جداول و توصیه‌های کلیدی) بنویسید که:
      ۱. ریسک‌های بحرانی پورتفو را شناسایی کند.
      ۲. راهکارهای نظارتی عاجل را پیشنهاد دهد.
      ۳. توصیه‌های اختصاصی برای دکتر احسان رضایی (مدیر ارشد هلدینگ) ارائه کند تا در مجامع عمومی اتخاذ تصمیم شود.`;
    } else {
      // Selected company analysis
      promptText = `شما دستیار هوشمند نظارت حاکمیتی بانک سپه پیرامون صورت‌های مالی شرکت تابعه هستید.
      رویکرد نظارتی: ${personaText}.
      شرکت هدف: ${targetComp.name} (${targetComp.ticker}) در صنعت ${targetComp.sector}.
      شاخص‌های مالی کلیدی:
      - درآمد: ${targetComp.financialData.revenue} میلیارد تومان
      - سود خالص: ${targetComp.financialData.netProfit} میلیارد تومان
      - نسبت بدهی به حقوق صاحبان سهام: ${targetComp.riskMetrics.debtToEquity.toFixed(2)}
      - نسبت جاری: ${targetComp.riskMetrics.currentRatio.toFixed(2)}
      - شاخص سلامت مالی: ${targetComp.healthScore}%
      - شاخص حاکمیت شرکتی: ${targetComp.governanceScore}%
      - رتبه سلامت آلتمن: ${targetComp.riskMetrics.altmanZScore.toFixed(2)} (${targetComp.riskMetrics.bankruptcyRisk})
      - امتیاز ESG: ${targetComp.esgData.totalEsgScore}%
      
      لطفاً تحلیل و ارزیابی استراتژیک ۳۶۰ درجه‌ای کاملاً مکتوب و غنی در قالب مارک‌داون برای جناب دکتر احسان رضایی تهیه فرمایید. تحلیل باید شامل بخش‌های زیر باشد:
      ۱. تشخیص ناترازی و واکاوی ریسک ترازنامه‌ای تابعه.
      ۲. سناریوسازی تاثیرات استراتژی نظارتی ${riskPersona} بر آینده شرکت.
      ۳. اقدامات اصلاحی مشخص در هیئت مدیره با هدف بهبود نمره سلامت مالی و حاکمیت شرکتی به سطوح بالای ۸۰٪.`;
    }

    try {
      if (apiKey && apiKey !== 'mock-demo-key') {
        const responseText = await askGeminiAssistant(promptText, apiKey, targetComp || subsidiaries[0], riskPersona, riskThresholds);
        setAiReport(responseText);
      } else {
        // High fidelity mock generator based on real-time selected metrics
        setTimeout(() => {
          let report = '';
          if (!targetComp) {
            const lowHealthComps = subsidiaries.filter(s => s.healthScore < 60);
            const highRiskComps = subsidiaries.filter(s => s.riskMetrics.bankruptcyRisk === 'Severe' || s.riskMetrics.bankruptcyRisk === 'High');
            const totalProfit = subsidiaries.reduce((acc, curr) => acc + curr.financialData.netProfit, 0);

            report = `### 🧠 گزارش پایش جامع و نظارت هوشمند هلدینگ سپه
**گیرنده:** جناب دکتر احسان رضایی - مدیر ارشد حاکمیتی هلدینگ بانک سپه  
**فرستنده:** دستیار هوشمند تصمیم‌یار مجمع سپه  
**وضعیت اشتهای ریسک:** **${riskPersona === 'CONSERVATIVE' ? 'بسیار محافظه‌کارانه' : riskPersona === 'BALANCED' ? 'متعادل و پویا' : 'تهاجمی'}**

---

#### 📊 خلاصه وضعیت پورتفوی هلدینگ
در کل، پورتفوی شامل **${subsidiaries.length} شرکت فعال** مورد پایش است. مجموع سود خالص تجمعی شناسایی شده بالغ بر **${totalProfit.toLocaleString('fa-IR')} میلیارد تومان** می‌باشد.

| شاخص پایش | تعداد شرکت | درصد از کل پورتفو | اولویت نظارتی |
|---|---|---|---|
| وضعیت بحرانی (نمره زیر ۶۰) | ${lowHealthComps.length} شرکت | ${Math.round((lowHealthComps.length / subsidiaries.length) * 100)}٪ | 🔴 فوری و اضطراری |
| ریسک ورشکستگی آلتمن بالا | ${highRiskComps.length} شرکت | ${Math.round((highRiskComps.length / subsidiaries.length) * 100)}٪ | 🟡 ممیزی ویژه |
| وضعیت ممتاز (نمره بالای ۸۰) | ${subsidiaries.filter(s => s.healthScore >= 80).length} شرکت | ${Math.round((subsidiaries.filter(s => s.healthScore >= 80).length / subsidiaries.length) * 100)}٪ | 🟢 تقدیر و حفظ خط‌مشی |

---

#### 🚨 شناسایی نقاط ضعف و چالش‌های کلیدی ترازنامه‌ای
بر اساس واکاوی هوشمند، شرکت‌های زیر نیازمند **اصلاح فوری اهرم مالی** و تزریق نقدینگی نظام‌مند هستند:
${lowHealthComps.map(s => `* **${s.name} (${s.ticker})**: به دلیل نمره سلامت مالی پایین (**${s.healthScore}٪**) و نسبت بدهی بالا (**${s.riskMetrics.debtToEquity.toFixed(2)}**). مجمع عمومی موظف است افزایش سرمایه از محل تجدید ارزیابی یا آورده نقدی را بررسی کند.`).join('\n')}

---

#### 💡 فرامین و توصیه‌های نظارتی مجمع سپه (مخصوص دکتر رضایی)
۱. **الزام به پیاده‌سازی منشور حاکمیت شرکتی**: کلیه تابعه‌ها با نمره حاکمیت زیر ۷۰٪ موظفند حداکثر ظرف ۳ ماه کمیته‌های مستقل حسابرسی و ریسک را تشکیل دهند.  
۲. **کنترل سقف سود تقسیمی**: در شرکت‌های تابعه با نمره سلامت بحرانی، سود تقسیمی حداکثر در سطح ۱۰٪ حداقل قانونی مصوب شود تا جریان نقد در خدمت بازپرداخت دیون قرار گیرد.  
۳. **تعدیل خطوط اعتباری**: هماهنگی با معاونت اعتبارات بانک سپه جهت مشروط کردن تمدید تسهیلات تابعه‌ها به بهبود مستمر نمره چک‌لیست سلامت تصمیم‌یار.`;
          } else {
            const isCritical = targetComp.healthScore < 60 || targetComp.riskMetrics.bankruptcyRisk === 'Severe' || targetComp.riskMetrics.bankruptcyRisk === 'High';
            report = `### 🧠 گزارش ممیزی هوشمند حاکمیتی: ${targetComp.name} (${targetComp.ticker})
**مخاطب ارشد:** جناب دکتر احسان رضایی  
**صنعت:** ${targetComp.sector}  
**رویکرد تحلیل:** **${riskPersona === 'CONSERVATIVE' ? 'حفاظتی و محافظه‌کارانه' : 'نظارت استراتژیک'}**

---

#### 📈 واکاوی شاخص‌های بنیادی شرکت تابعه

* **جریان سودآوری**: شرکت با کسب درآمد **${targetComp.financialData.revenue.toLocaleString('fa-IR')} میلیارد تومان** توانسته سود خالص **${targetComp.financialData.netProfit.toLocaleString('fa-IR')} میلیارد تومانی** ایجاد کند که نسبت حاشیه سود آن در سطح **${((targetComp.financialData.netProfit / targetComp.financialData.revenue) * 100).toFixed(1)}٪** قرار می‌گیرد.
* **اهرم و ساختار بدهی**: نسبت بدهی به حقوق صاحبان سهام برابر با **${targetComp.riskMetrics.debtToEquity.toFixed(2)}** است. نسبت جاری شرکت **${targetComp.riskMetrics.currentRatio.toFixed(2)}** می‌باشد.
* **کیفیت حاکمیت شرکتی**: شاخص حاکمیت شرکتی برابر با **${targetComp.governanceScore}٪** است که در سطح **${targetComp.governanceScore >= 80 ? 'بسیار عالی' : targetComp.governanceScore >= 60 ? 'متوسط و نیازمند پایش' : 'ضعیف و نیازمند دخالت مجمع'}** ارزیابی می‌شود.

---

#### 📑 سناریوسازی و ارزیابی ریسک ورشکستگی (Altman Z-Score)
شاخص آلتمن این شرکت در سطح **${targetComp.riskMetrics.altmanZScore.toFixed(2)}** ثبت شده که معادل سطح خطر **${targetComp.riskMetrics.bankruptcyRisk}** است.

${isCritical ? `⚠️ **هشدار ناترازی مالی:** نمرات ترازنامه‌ای شرکت تابعه زنگ خطر انباشت دیون کوتاه‌مدت را به صدا درآورده است. ادامه این مسیر بدون دخالت نظارتی فعال هلدینگ، ریسک ورشکستگی جدی به همراه دارد.` : `✅ **پایداری ترازنامه:** شاخص‌های ریسک در منطقه امن قرار دارند. ساختار سرمایه بهینه بوده و ریسک مالی در کوتاه‌مدت ناچیز است.`}

---

#### 🛠️ نقشه راه و اقدامات اصلاحی پیشنهادی به جناب دکتر رضایی
۱. **کمیته‌های حاکمیت شرکتی**: ارتقای نمره حاکمیت به بالای ۸۰٪ با اضافه کردن ۲ عضو موظف مستقل و برگزاری ماهانه جلسات کنترل داخلی.  
۲. **مدیریت نقدینگی و بازپرداخت دیون**: کاهش فوری نسبت اهرمی به کمک انتشار اوراق گام یا اوراق سلف موازی در بورس کالا.  
۳. **پایش ماهانه پیشرفت**: الزام مدیران تابعه به ارسال گزارش تطبیق بودجه ماهانه به سامانه مرکزی هلدینگ بانک سپه.`;
          }
          setAiReport(report);
        }, 800);
      }
    } catch (e) {
      setAiReport('متاسفانه در برقراری ارتباط با موتور تصمیم‌یار هوشمند اختلالی پیش آمد. لطفاً اتصال اینترنت خود را چک کنید یا از کلید پیش‌فرض استفاده فرمایید.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCompareAiAnalysis = async () => {
    setIsComparingAi(true);
    setCompareAiReport('');
    
    const selectedCompanies = subsidiaries.filter(sub => selectedCompanyIds.includes(sub.id));
    const personaText = riskPersona === 'CONSERVATIVE' ? 'بسیار محافظه‌کارانه و حفاظتی' : riskPersona === 'BALANCED' ? 'متعادل، نظارتی و پویا' : 'تهاجمی و توسعه‌گرا';
    
    const promptText = `شما تحلیل‌گر ارشد و ممیز فوق‌حرفه‌ای هلدینگ بانک سپه هستید.
      رویکرد و اشتهای ریسک جاری مجمع: ${personaText}.
      شرکت‌های تابعه انتخاب شده برای مقایسه همزمان:
      ${selectedCompanies.map(s => `
      - نام شرکت: ${s.name} (${s.ticker})
        * صنعت: ${s.sector}
        * درآمد سالانه: ${s.financialData.revenue} میلیارد تومان
        * سود خالص: ${s.financialData.netProfit} میلیارد تومان
        * شاخص سلامت مالی: ${s.healthScore}%
        * شاخص حاکمیت شرکتی: ${s.governanceScore}%
        * Altman Z-Score: ${s.riskMetrics.altmanZScore.toFixed(2)} (${s.riskMetrics.bankruptcyRisk})
        * نسبت جاری: ${s.riskMetrics.currentRatio.toFixed(2)}
        * نسبت بدهی به حقوق: ${s.riskMetrics.debtToEquity.toFixed(2)}
        * امتیاز ESG: ${s.esgData.totalEsgScore}%
      `).join('\n')}
      
      لطفاً یک گزارش موازنه استراتژیک، مقایسه تطبیقی و ممیزی عمیق ترازنامه‌ای مخصوص جناب آقای دکتر احسان رضایی تهیه فرمایید. گزارش به زبان فارسی شیک و رسمی باشد و شامل:
      ۱. جدول مقایسه‌ای نقاط قوت و چالش‌های فوری هرکدام از این شرکت‌ها.
      ۲. تحلیل هم‌افزایی (Synergy) یا ریسک‌های سرریز (Spillover) ناشی از ناترازی این شرکت‌ها در پورتفوی هلدینگ سپه.
      ۳. دستورالعمل مشخص مجمع برای توزیع سود، افزایش سرمایه، تغییرات حاکمیتی و موازنه مالی میان این شرکت‌ها.`;

    try {
      if (apiKey && apiKey !== 'mock-demo-key') {
        const responseText = await askGeminiAssistant(promptText, apiKey, selectedCompanies[0], riskPersona, riskThresholds);
        setCompareAiReport(responseText);
      } else {
        // High fidelity mock comparison report
        setTimeout(() => {
          const report = `### ⚖️ گزارش موازنه استراتژیک و ممیزی تطبیقی شرکت‌های منتخب
**گیرنده:** جناب دکتر احسان رضایی - مدیر ارشد حاکمیتی هلدینگ بانک سپه  
**فرستنده:** دستیار ممیزی چندجانبه سپه AI  
**تاریخ گزارش:** ${new Date().toLocaleDateString('fa-IR')}  

---

#### 🔍 ۱. ارزیابی تطبیقی و نقاط قوت/ضعف ترازنامه‌ای
بر اساس همبستگی شاخص‌های مالی شرکت‌های تابعه منتخب، توازن ریسک و بازده به شرح زیر تحلیل می‌شود:

| نام شرکت | مزیت رقابتی کلیدی | ریسک ترازنامه‌ای بحرانی | سناریوی مطلوب مجمع عمومی |
|---|---|---|---|
${selectedCompanies.map(s => `| **${s.name} (${s.ticker})** | سلامت مالی ${s.healthScore}٪ | ${s.riskMetrics.bankruptcyRisk === 'Severe' ? '🔴 ریسک ورشکستگی شدید' : s.healthScore < 60 ? '🟠 سلامت ترازنامه ضعیف' : '🟢 ریسک کم و ساختار باثبات'} | ${s.healthScore >= 80 ? 'حفظ منابع جهت طرح‌های توسعه‌ای' : 'بازسازی فوری ساختار سرمایه و تجدید ارزیابی'} |`).join('\n')}

---

#### ⚡ ۲. تحلیل هم‌افزایی (Synergy) و پایش ریسک‌های سرریز در هلدینگ
* **انتقال ریسک نقدینگی:** شرکت‌های ضعیف‌تر با نسبت‌های جاری پایین نیاز مبرم به حمایت نقدی دارند. مجمع عمومی باید سیاست تقسیم سود بالایی در شرکت‌های قوی‌تر و سیاست تقسیمی بسیار کمی (۱۰٪) در شرکت‌های با ساختار بحرانی اتخاذ کند تا نقدینگی درون هلدینگ موازنه شود.
* **رعایت حاکمیت شرکتی:** شکاف موجود میان نمرات حاکمیتی شرکت‌ها نشان‌دهنده لزوم استقرار یکسان منشور حاکمیت شرکتی بانک سپه در کلیه تابعه‌ها با هدف ارتقای سلامت کل پورتفو است.

---

#### 🎯 ۳. فرامین نظارتی و تصمیمات پیشنهادی برای جناب دکتر رضایی
۱. **موازنه تقسیمی سود:** سود حاصل از شرکت‌های با سلامت عالی به عنوان پشتوانه افزایش سرمایه شرکت‌های با ناترازی مالی قرار گیرد.  
۲. **تشکیل کمیته ممیزی یکپارچه:** توصیه می‌شود مجمع عمومی یک کمیته ممیزی ترازنامه‌ای یکپارچه بین این شرکت‌های منتخب جهت کاهش ریسک همبستگی صنعت برقرار نماید.  
۳. **بازتعریف سقف اعتباری:** سقف بدهی‌های این شرکت‌ها متناسب با نمره سلامت مالی جدید آنها در داشبورد تصمیم‌یار تعدیل گردد.`;
          setCompareAiReport(report);
        }, 1500);
      }
    } catch (err: any) {
      console.error('Error during comparative analysis:', err);
      setCompareAiReport(`خطا در دریافت تحلیل مقایسه‌ای هوشمند: ${err.message || err}`);
    } finally {
      setIsComparingAi(false);
    }
  };

  const getSectorBadgeClass = (sec: string) => {
    switch (sec) {
      case 'محصولات شیمیایی و پتروشیمی':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'سیمان، آهک و گچ':
        return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
      case 'رایانه و خدمات وابسته':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
      case 'غذایی بجز قند و شکر':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'سرمایه‌گذاری‌های مالی':
        return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
      case 'استخراج کانه‌های فلزی':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'فلزات اساسی':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      default:
        return 'bg-neutral-500/10 text-neutral-400 border-white/10';
    }
  };

  return (
    <div className="space-y-6" id="subsidiary-grid-tab">
      {/* Stacked Layout: Main Subsidiaries Table on top, AI Assistant under it */}
      <div className="flex flex-col gap-6">
        
        {/* Main Subsidiaries Table: full width */}
        <div className="w-full bg-[#16161a] border border-white/10 rounded-2xl shadow-2xl p-5 sm:p-6 text-neutral-200 flex flex-col justify-between">
          
          {/* Header Controls */}
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between mb-6 pb-6 border-b border-white/5">
            <div className="flex items-center gap-3 w-full lg:w-auto">
              <span className="p-3 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20 shadow-inner">
                <SlidersHorizontal size={22} />
              </span>
              <div className="text-right" dir="rtl">
                <h3 className="text-base sm:text-lg font-bold text-neutral-100 font-sans tracking-tight">رصد و مانیتورینگ شرکت‌های تابعه هلدینگ سپه</h3>
                <p className="text-[10px] text-neutral-400 font-mono">Real-time Financial & Corporate Governance Monitor</p>
              </div>
            </div>

            {/* Filter Toolbar */}
            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              {/* Search */}
              <div className="relative flex-1 sm:w-72">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-neutral-500">
                  <Search size={14} />
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-[#0a0a0b] border border-white/10 rounded-xl text-xs text-neutral-300 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all font-sans"
                  placeholder="جستجوی نام، نماد یا صنعت..."
                  dir="rtl"
                />
              </div>

              {/* Sector Filter */}
              <div className="relative">
                <select
                  value={sectorFilter}
                  onChange={(e) => setSectorFilter(e.target.value)}
                  className="w-full sm:w-48 px-4 py-2.5 bg-[#0a0a0b] border border-white/10 rounded-xl text-xs text-neutral-300 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 appearance-none text-right cursor-pointer"
                  dir="rtl"
                >
                  {sectors.map(sec => (
                    <option key={sec} value={sec} className="bg-[#16161a]">
                      {sec === 'ALL' ? 'همه صنایع تابعه' : sec}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Table for Desktop & Bento cards for Mobile */}
          
          {/* DESKTOP TABLE VIEW */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-[10px] sm:text-[11px] text-neutral-400 font-bold uppercase tracking-wider bg-[#0a0a0b]/40">
                  <th className="py-3 px-3 text-center rounded-r-xl border-l border-white/5 w-12" dir="rtl">
                    <input
                      type="checkbox"
                      className="rounded border-white/20 bg-[#0a0a0b] text-blue-500 focus:ring-blue-500/40 focus:ring-offset-0 cursor-pointer w-3.5 h-3.5"
                      checked={filteredSubsidiaries.length > 0 && selectedCompanyIds.length === filteredSubsidiaries.length}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedCompanyIds(filteredSubsidiaries.map(sub => sub.id));
                        } else {
                          setSelectedCompanyIds([]);
                        }
                      }}
                    />
                  </th>
                  <th className="py-3 px-4 text-right border-l border-white/5" dir="rtl">نام شرکت و نماد</th>
                  <th className="py-3 px-4 text-right border-l border-white/5" dir="rtl">صنعت تابعه</th>
                  <th className="py-3 px-4 text-center border-l border-white/5 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('revenue')}>
                    <div className="flex items-center justify-center gap-1">
                      <ArrowUpDown size={11} className="text-neutral-500" />
                      <span>درآمد (همت)</span>
                    </div>
                  </th>
                  <th className="py-3 px-4 text-center border-l border-white/5 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('netProfit')}>
                    <div className="flex items-center justify-center gap-1">
                      <ArrowUpDown size={11} className="text-neutral-500" />
                      <span>سود خالص</span>
                    </div>
                  </th>
                  <th className="py-3 px-4 text-center border-l border-white/5 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('zScore')}>
                    <div className="flex items-center justify-center gap-1">
                      <ArrowUpDown size={11} className="text-neutral-500" />
                      <span>Altman Z-Score</span>
                    </div>
                  </th>
                  <th className="py-3 px-4 text-center border-l border-white/5 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('totalEsg')}>
                    <div className="flex items-center justify-center gap-1">
                      <ArrowUpDown size={11} className="text-neutral-500" />
                      <span>شاخص ESG</span>
                    </div>
                  </th>
                  <th className="py-3 px-4 text-center border-l border-white/5 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('healthScore')}>
                    <div className="flex items-center justify-center gap-1">
                      <ArrowUpDown size={11} className="text-neutral-500" />
                      <span>سلامت مالی</span>
                    </div>
                  </th>
                  <th className="py-3 px-4 text-center border-l border-white/5 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('governanceScore')}>
                    <div className="flex items-center justify-center gap-1">
                      <ArrowUpDown size={11} className="text-neutral-500" />
                      <span>حاکمیت شرکتی</span>
                    </div>
                  </th>
                  <th className="py-3 px-4 text-center rounded-l-xl">عملیات نظارتی</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs">
                {filteredSubsidiaries.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-16 text-center text-neutral-500 font-medium">
                      هیچ شرکتی متناسب با معیارهای جستجو یافت نشد.
                    </td>
                  </tr>
                ) : (
                  filteredSubsidiaries.map(sub => {
                    const isWarningActive = sub.riskMetrics.bankruptcyRisk === 'Severe' || sub.riskMetrics.bankruptcyRisk === 'High' || sub.healthScore < 60;
                    return (
                      <tr 
                        key={sub.id} 
                        onClick={() => onSelectCompany(sub.id)}
                        className={`hover:bg-blue-500/[0.04] cursor-pointer transition-all duration-200 group border-r-4 border-r-transparent hover:border-r-blue-500 ${isWarningActive ? 'bg-red-500/[0.015]' : ''}`}
                      >
                        {/* Selector checkbox cell */}
                        <td className="py-4 px-3 text-center border-l border-white/5 w-12" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            className="rounded border-white/20 bg-[#0a0a0b] text-blue-500 focus:ring-blue-500/40 focus:ring-offset-0 cursor-pointer w-3.5 h-3.5"
                            checked={selectedCompanyIds.includes(sub.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedCompanyIds(prev => [...prev, sub.id]);
                              } else {
                                setSelectedCompanyIds(prev => prev.filter(id => id !== sub.id));
                              }
                            }}
                          />
                        </td>

                        {/* Name & Ticker */}
                        <td className="py-4 px-4 text-right border-l border-white/5">
                          <div className="flex items-center justify-end gap-3">
                            <div className="text-right">
                              <div className="font-bold text-neutral-100 group-hover:text-blue-400 transition-colors flex items-center justify-end gap-1.5 font-sans text-xs">
                                {isWarningActive && <AlertTriangle size={14} className="text-red-400 animate-pulse" />}
                                <span>{sub.name}</span>
                              </div>
                              <span className="text-[9px] font-mono text-neutral-400">{sub.englishName}</span>
                            </div>
                            <div className="px-2.5 py-1 rounded-md bg-[#0a0a0b] border border-white/10 font-bold text-blue-400 font-mono text-[9px] shadow-sm uppercase">
                              {sub.ticker}
                            </div>
                          </div>
                        </td>

                        {/* Sector */}
                        <td className="py-4 px-4 text-right border-l border-white/5">
                          <span className={`inline-block px-2.5 py-1 text-[9px] rounded-lg border font-medium ${getSectorBadgeClass(sub.sector)}`}>
                            {sub.sector}
                          </span>
                        </td>

                        {/* Revenue */}
                        <td className="py-4 px-4 text-center border-l border-white/5 font-mono font-semibold text-neutral-200 text-xs">
                          {sub.financialData.revenue.toLocaleString('fa-IR')} <span className="text-[9px] text-neutral-400 font-sans">میلیارد</span>
                        </td>

                        {/* Profit */}
                        <td className={`py-4 px-4 text-center border-l border-white/5 font-mono font-bold text-xs ${sub.financialData.netProfit > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {sub.financialData.netProfit > 0 ? '+' : ''}{sub.financialData.netProfit.toLocaleString('fa-IR')} <span className="text-[9px] font-sans">میلیارد</span>
                        </td>

                        {/* Z Score */}
                        <td className="py-4 px-4 text-center border-l border-white/5 font-mono">
                          <div className="flex flex-col items-center gap-1">
                            <span className="font-bold text-neutral-200 text-xs">{sub.riskMetrics.altmanZScore.toFixed(2)}</span>
                            {renderBankruptcyBadge(sub.riskMetrics.bankruptcyRisk)}
                          </div>
                        </td>

                        {/* ESG Score */}
                        <td className="py-4 px-4 text-center border-l border-white/5 font-mono">
                          <span className="text-emerald-400 font-bold flex items-center justify-center gap-1 text-xs">
                            <Award size={12} className="text-emerald-400" />
                            {sub.esgData.totalEsgScore}%
                          </span>
                        </td>

                        {/* Health score */}
                        <td className="py-4 px-4 text-center border-l border-white/5">
                          {renderScoreBadge(sub.healthScore)}
                        </td>

                        {/* Governance score */}
                        <td className="py-4 px-4 text-center border-l border-white/5">
                          {renderScoreBadge(sub.governanceScore)}
                        </td>

                        {/* Actions (In-line AI Audit trigger) */}
                        <td className="py-4 px-4 text-center">
                          <div className="flex items-center justify-center gap-2" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => {
                                setSelectedAiCompanyId(sub.id);
                                handleAiAnalysis('RISK');
                                const aiSection = document.getElementById('subsidiary-ai-analyst');
                                if (aiSection) {
                                  aiSection.scrollIntoView({ behavior: 'smooth' });
                                }
                              }}
                              className="px-2 px-1.5 bg-blue-500/10 hover:bg-blue-600 border border-blue-500/20 hover:border-blue-500 text-blue-400 hover:text-white rounded-lg text-[9px] font-bold transition-all cursor-pointer flex items-center gap-1 shadow-sm"
                              title="آنالیز زنده ریسک با هوش مصنوعی"
                            >
                              <Bot size={11} />
                              <span>ممیزی هوشمند</span>
                            </button>
                            <span className="text-neutral-600 group-hover:text-blue-400 group-hover:translate-x-1 transition-all inline-block pl-1">
                              <ChevronRight size={14} />
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* MOBILE BENTO GRID CARD VIEW */}
          <div className="md:hidden grid grid-cols-1 gap-4">
            {filteredSubsidiaries.length === 0 ? (
              <div className="py-12 text-center text-neutral-500 font-medium">
                هیچ شرکتی متناسب با معیارهای جستجو یافت نشد.
              </div>
            ) : (
              filteredSubsidiaries.map(sub => {
                const isWarningActive = sub.riskMetrics.bankruptcyRisk === 'Severe' || sub.riskMetrics.bankruptcyRisk === 'High' || sub.healthScore < 60;
                return (
                  <div
                    key={sub.id}
                    onClick={() => onSelectCompany(sub.id)}
                    className={`bg-[#0a0a0b]/60 border border-white/5 rounded-2xl p-4 space-y-4 hover:border-blue-500/30 transition-all cursor-pointer shadow-lg relative ${isWarningActive ? 'border-red-500/30 bg-red-500/[0.015]' : ''}`}
                  >
                    {isWarningActive && (
                      <div className="absolute top-3 left-3 flex items-center gap-1 px-2 py-0.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-full text-[8px] font-bold uppercase tracking-wider animate-pulse">
                        <AlertTriangle size={10} />
                        <span>ریسک بالا</span>
                      </div>
                    )}

                    {/* Header Row */}
                    <div className="flex items-center justify-between" dir="rtl">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          className="rounded border-white/20 bg-[#0a0a0b] text-blue-500 focus:ring-blue-500/40 focus:ring-offset-0 cursor-pointer w-4 h-4"
                          checked={selectedCompanyIds.includes(sub.id)}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedCompanyIds(prev => [...prev, sub.id]);
                            } else {
                              setSelectedCompanyIds(prev => prev.filter(id => id !== sub.id));
                            }
                          }}
                        />
                        <div className="text-right">
                          <h4 className="font-bold text-neutral-100 text-sm flex items-center gap-1.5 font-sans">
                            {sub.name}
                          </h4>
                          <span className="text-[9px] text-neutral-400 font-mono">{sub.englishName}</span>
                        </div>
                      </div>
                      <div className="px-2.5 py-1 rounded-md bg-[#16161a] border border-white/10 font-bold text-blue-400 font-mono text-[10px]">
                        {sub.ticker}
                      </div>
                    </div>

                    {/* Sector Badge */}
                    <div className="text-right">
                      <span className={`inline-block px-2.5 py-0.5 text-[9px] rounded-full border ${getSectorBadgeClass(sub.sector)}`}>
                        {sub.sector}
                      </span>
                    </div>

                    {/* Financial Row */}
                    <div className="grid grid-cols-2 gap-3 text-right text-[10px] bg-[#16161a]/60 p-3 rounded-xl border border-white/5" dir="rtl">
                      <div>
                        <span className="text-neutral-500 block mb-0.5">سود خالص:</span>
                        <span className={`font-mono font-bold text-xs ${sub.financialData.netProfit > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {sub.financialData.netProfit.toLocaleString('fa-IR')} میلیارد
                        </span>
                      </div>
                      <div>
                        <span className="text-neutral-500 block mb-0.5">درآمد ناخالص:</span>
                        <span className="font-mono font-bold text-neutral-200 text-xs">
                          {sub.financialData.revenue.toLocaleString('fa-IR')} میلیارد
                        </span>
                      </div>
                    </div>

                    {/* Scores Metrics Row */}
                    <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                      <div className="bg-[#16161a]/40 p-2 rounded-xl border border-white/5 flex flex-col items-center justify-between">
                        <span className="text-neutral-500 block mb-1">سلامت مالی</span>
                        {renderScoreBadge(sub.healthScore)}
                      </div>
                      <div className="bg-[#16161a]/40 p-2 rounded-xl border border-white/5 flex flex-col items-center justify-between">
                        <span className="text-neutral-500 block mb-1">حاکمیت</span>
                        {renderScoreBadge(sub.governanceScore)}
                      </div>
                      <div className="bg-[#16161a]/40 p-2 rounded-xl border border-white/5 flex flex-col items-center justify-between">
                        <span className="text-neutral-500 block mb-1">Altman Z</span>
                        {renderBankruptcyBadge(sub.riskMetrics.bankruptcyRisk)}
                      </div>
                    </div>

                    {/* Mobile CTA Trigger */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedAiCompanyId(sub.id);
                        handleAiAnalysis('RISK');
                        const aiSection = document.getElementById('subsidiary-ai-analyst');
                        if (aiSection) {
                          aiSection.scrollIntoView({ behavior: 'smooth' });
                        }
                      }}
                      className="w-full py-2 bg-blue-500/10 hover:bg-blue-600 border border-blue-500/20 hover:border-blue-500 text-blue-400 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Bot size={13} />
                      <span>ممیزی هوشمند سپه AI</span>
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Grid footer */}
          <div className="flex flex-col sm:flex-row justify-between items-center text-[10px] text-neutral-400 font-mono mt-6 pt-5 border-t border-white/5 leading-relaxed" dir="rtl">
            <div>
              تعداد رکوردهای فعال: {filteredSubsidiaries.length.toLocaleString('fa-IR')} شرکت از {subsidiaries.length.toLocaleString('fa-IR')}
            </div>
            <div className="mt-2 sm:mt-0 text-center sm:text-left text-neutral-500">
              * نمرات سلامت مالی و حاکمیت شرکتی به صورت برخط و بر اساس وزن‌دهی آستانه‌ها تنظیم شده‌اند.
            </div>
          </div>
        </div>

        {/* MULTI-COMPANY COMPARISON DASHBOARD */}
        {selectedCompanyIds.length > 0 && (
          <div className="w-full bg-[#16161a] border border-blue-500/30 rounded-2xl shadow-2xl p-5 sm:p-6 text-neutral-200 flex flex-col gap-6 relative overflow-hidden" id="subsidiary-comparison-panel">
            {/* Decorative gradient background border glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex flex-col sm:flex-row items-center justify-between border-b border-white/10 pb-4 gap-3 z-10" dir="rtl">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/25">
                  <SlidersHorizontal size={18} className="animate-pulse" />
                </span>
                <div className="text-right">
                  <h3 className="text-xs sm:text-sm font-bold text-white font-sans flex items-center gap-2 flex-wrap">
                    <span>سامانه مقایسه تطبیقی و چندجانبه شرکت‌های تابعه</span>
                    <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-full text-[10px] font-mono font-bold">
                      {selectedCompanyIds.length.toLocaleString('fa-IR')} شرکت منتخب
                    </span>
                  </h3>
                  <p className="text-[10px] text-neutral-400 mt-0.5 font-sans">
                    تحلیل ترازنامه‌ای، شاخص‌های سودآوری و ریسک شرکت‌های تابعه به صورت موازی و همزمان
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {selectedCompanyIds.length >= 2 && (
                  <button
                    onClick={handleCompareAiAnalysis}
                    disabled={isComparingAi}
                    className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 disabled:bg-[#0a0a0b] disabled:text-neutral-600 text-black font-extrabold text-[10px] rounded-lg shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    {isComparingAi ? (
                      <>
                        <RefreshCw size={12} className="animate-spin" />
                        <span>تحلیل موازنه هوشمند...</span>
                      </>
                    ) : (
                      <>
                        <Bot size={13} />
                        <span>تحلیل موازنه و هم‌افزایی با هوش مصنوعی</span>
                      </>
                    )}
                  </button>
                )}
                <button
                  onClick={() => setSelectedCompanyIds([])}
                  className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-bold text-[10px] rounded-lg transition-all cursor-pointer border border-white/5"
                >
                  پاک کردن انتخاب‌ها
                </button>
              </div>
            </div>

            {selectedCompanyIds.length < 2 ? (
              <div className="py-8 text-center flex flex-col items-center justify-center space-y-2 text-neutral-400 z-10" dir="rtl">
                <SlidersHorizontal size={32} className="text-neutral-600 mb-2" />
                <span className="text-xs font-bold text-neutral-300">برای مقایسه چندجانبه، شرکت‌های بیشتری را انتخاب نمایید.</span>
                <span className="text-[10px] text-neutral-500">جناب دکتر رضایی، لطفاً چک‌باکس حداقل ۲ شرکت را در جدول فوق فعال کنید تا جدول مقایسه ترازنامه‌ای همزمان نمایش داده شود.</span>
              </div>
            ) : (
              <div className="space-y-6 z-10">
                {/* Comparison Table */}
                <div className="overflow-x-auto rounded-xl border border-white/5 bg-[#0a0a0b]/40 backdrop-blur-md">
                  <table className="w-full text-right text-xs" dir="rtl">
                    <thead>
                      <tr className="bg-[#0f0f12] text-neutral-400 font-bold border-b border-white/5">
                        <th className="py-3.5 px-4 text-right w-44 font-sans font-extrabold text-neutral-300 border-l border-white/5">معیار ارزیابی ترازنامه</th>
                        {subsidiaries.filter(sub => selectedCompanyIds.includes(sub.id)).map(sub => (
                          <th key={sub.id} className="py-3.5 px-4 text-center font-sans font-extrabold text-white min-w-[150px] border-l border-white/5 last:border-0 bg-blue-500/[0.02]">
                            <div className="flex flex-col items-center gap-1">
                              <span className="text-xs text-blue-400 font-bold">{sub.name}</span>
                              <span className="text-[10px] font-mono text-neutral-400 font-medium">({sub.ticker})</span>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 font-sans">
                      {/* Sector */}
                      <tr className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 px-4 font-bold text-neutral-400 bg-neutral-900/20 border-l border-white/5">صنعت تابعه</td>
                        {subsidiaries.filter(sub => selectedCompanyIds.includes(sub.id)).map(sub => (
                          <td key={sub.id} className="py-3 px-4 text-center border-l border-white/5 last:border-0">
                            <span className={`px-2 py-1 text-[9px] rounded-lg border font-medium ${getSectorBadgeClass(sub.sector)}`}>
                              {sub.sector}
                            </span>
                          </td>
                        ))}
                      </tr>
                      
                      {/* Revenue */}
                      <tr className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 px-4 font-bold text-neutral-400 bg-neutral-900/20 border-l border-white/5">درآمد سالانه (ناخالص)</td>
                        {subsidiaries.filter(sub => selectedCompanyIds.includes(sub.id)).map(sub => (
                          <td key={sub.id} className="py-3 px-4 text-center border-l border-white/5 last:border-0 font-mono font-semibold text-neutral-100">
                            {sub.financialData.revenue.toLocaleString('fa-IR')} <span className="text-[9px] text-neutral-400 font-sans">میلیارد تومان</span>
                          </td>
                        ))}
                      </tr>

                      {/* Net Profit */}
                      <tr className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 px-4 font-bold text-neutral-400 bg-neutral-900/20 border-l border-white/5">سود خالص سالانه</td>
                        {subsidiaries.filter(sub => selectedCompanyIds.includes(sub.id)).map(sub => {
                          const isProfit = sub.financialData.netProfit > 0;
                          return (
                            <td key={sub.id} className={`py-3 px-4 text-center border-l border-white/5 last:border-0 font-mono font-bold ${isProfit ? 'text-emerald-400' : 'text-red-400'}`}>
                              {isProfit ? '+' : ''}{sub.financialData.netProfit.toLocaleString('fa-IR')} <span className="text-[9px] font-sans">میلیارد تومان</span>
                            </td>
                          );
                        })}
                      </tr>

                      {/* Net Profit Margin */}
                      <tr className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 px-4 font-bold text-neutral-400 bg-neutral-900/20 border-l border-white/5">حاشیه سود خالص</td>
                        {subsidiaries.filter(sub => selectedCompanyIds.includes(sub.id)).map(sub => {
                          const margin = (sub.financialData.netProfit / sub.financialData.revenue) * 100;
                          const isProfit = margin > 0;
                          return (
                            <td key={sub.id} className={`py-3 px-4 text-center border-l border-white/5 last:border-0 font-mono font-bold ${isProfit ? 'text-emerald-400' : 'text-red-400'}`}>
                              {Number(margin.toFixed(1)).toLocaleString('fa-IR')}%
                            </td>
                          );
                        })}
                      </tr>

                      {/* Financial Health Score */}
                      <tr className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 px-4 font-bold text-neutral-400 bg-neutral-900/20 border-l border-white/5">شاخص سلامت مالی (سپه)</td>
                        {subsidiaries.filter(sub => selectedCompanyIds.includes(sub.id)).map(sub => (
                          <td key={sub.id} className="py-3 px-4 border-l border-white/5 last:border-0 text-center">
                            <div className="flex flex-col items-center gap-1.5">
                              {renderScoreBadge(sub.healthScore)}
                              <div className="w-24 bg-neutral-800 rounded-full h-1 overflow-hidden">
                                <div 
                                  className={`h-full rounded-full ${sub.healthScore >= 80 ? 'bg-emerald-500' : sub.healthScore >= 60 ? 'bg-amber-500' : 'bg-red-500'}`} 
                                  style={{ width: `${sub.healthScore}%` }}
                                />
                              </div>
                            </div>
                          </td>
                        ))}
                      </tr>

                      {/* Corporate Governance Score */}
                      <tr className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 px-4 font-bold text-neutral-400 bg-neutral-900/20 border-l border-white/5">شاخص حاکمیت شرکتی</td>
                        {subsidiaries.filter(sub => selectedCompanyIds.includes(sub.id)).map(sub => (
                          <td key={sub.id} className="py-3 px-4 border-l border-white/5 last:border-0 text-center">
                            <div className="flex flex-col items-center gap-1.5">
                              {renderScoreBadge(sub.governanceScore)}
                              <div className="w-24 bg-neutral-800 rounded-full h-1 overflow-hidden">
                                <div 
                                  className={`h-full rounded-full ${sub.governanceScore >= 80 ? 'bg-emerald-500' : sub.governanceScore >= 60 ? 'bg-amber-500' : 'bg-red-500'}`} 
                                  style={{ width: `${sub.governanceScore}%` }}
                                />
                              </div>
                            </div>
                          </td>
                        ))}
                      </tr>

                      {/* Altman Z-Score */}
                      <tr className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 px-4 font-bold text-neutral-400 bg-neutral-900/20 border-l border-white/5">Altman Z-Score & ریسک</td>
                        {subsidiaries.filter(sub => selectedCompanyIds.includes(sub.id)).map(sub => (
                          <td key={sub.id} className="py-3 px-4 text-center border-l border-white/5 last:border-0 font-mono">
                            <div className="flex flex-col items-center gap-1">
                              <span className="font-bold text-neutral-200">{sub.riskMetrics.altmanZScore.toFixed(2)}</span>
                              {renderBankruptcyBadge(sub.riskMetrics.bankruptcyRisk)}
                            </div>
                          </td>
                        ))}
                      </tr>

                      {/* Current Ratio */}
                      <tr className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 px-4 font-bold text-neutral-400 bg-neutral-900/20 border-l border-white/5">نسبت جاری (قدرت پرداخت)</td>
                        {subsidiaries.filter(sub => selectedCompanyIds.includes(sub.id)).map(sub => {
                          const ratio = sub.riskMetrics.currentRatio;
                          const isHealthy = ratio >= 1.2;
                          return (
                            <td key={sub.id} className={`py-3 px-4 text-center border-l border-white/5 last:border-0 font-mono font-medium ${isHealthy ? 'text-emerald-400' : 'text-amber-500'}`}>
                              {Number(ratio.toFixed(2)).toLocaleString('fa-IR')}
                            </td>
                          );
                        })}
                      </tr>

                      {/* Debt to Equity */}
                      <tr className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 px-4 font-bold text-neutral-400 bg-neutral-900/20 border-l border-white/5">نسبت بدهی به حقوق صاحبان سهام</td>
                        {subsidiaries.filter(sub => selectedCompanyIds.includes(sub.id)).map(sub => {
                          const ratio = sub.riskMetrics.debtToEquity;
                          const isLow = ratio < 1.5;
                          return (
                            <td key={sub.id} className={`py-3 px-4 text-center border-l border-white/5 last:border-0 font-mono font-medium ${isLow ? 'text-emerald-400' : 'text-red-400'}`}>
                              {Number(ratio.toFixed(2)).toLocaleString('fa-IR')}
                            </td>
                          );
                        })}
                      </tr>

                      {/* ESG Score */}
                      <tr className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 px-4 font-bold text-neutral-400 bg-neutral-900/20 border-l border-white/5">امتیاز کل ESG (محیط زیست/اجتماع)</td>
                        {subsidiaries.filter(sub => selectedCompanyIds.includes(sub.id)).map(sub => (
                          <td key={sub.id} className="py-3 px-4 text-center border-l border-white/5 last:border-0 font-mono">
                            <span className="text-emerald-400 font-bold flex items-center justify-center gap-1">
                              <Award size={12} className="text-emerald-400" />
                              {sub.esgData.totalEsgScore}%
                            </span>
                          </td>
                        ))}
                      </tr>

                      {/* Suggested Strategy */}
                      <tr className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3.5 px-4 font-bold text-neutral-400 bg-neutral-900/20 border-l border-white/5">خط‌مشی مجمع عمومی سپه</td>
                        {subsidiaries.filter(sub => selectedCompanyIds.includes(sub.id)).map(sub => {
                          let strategyText = '';
                          let strategyColor = '';
                          if (sub.healthScore >= 80 && sub.governanceScore >= 80) {
                            strategyText = 'توزیع متوازن سود، توسعه طرح‌های کلان سرمایه‌گذاری جدید و ارتقای به بورس ارشد.';
                            strategyColor = 'text-emerald-400';
                          } else if (sub.healthScore < 60 || sub.riskMetrics.bankruptcyRisk === 'Severe') {
                            strategyText = 'توقف حداکثری تقسیم سود (حداکثر ۱۰٪ قانون)، الزام به افزایش سرمایه اضطراری و ممیزی اهرم مالی.';
                            strategyColor = 'text-red-400';
                          } else {
                            strategyText = 'بازآفرینی تدریجی ساختار هیئت مدیره، کنترل سرمایه در گردش و استقرار فریم‌ورک مدیریت ریسک سپه.';
                            strategyColor = 'text-amber-400';
                          }
                          return (
                            <td key={sub.id} className="py-3.5 px-3 text-right border-l border-white/5 last:border-0 leading-relaxed text-[11px] max-w-[200px]" dir="rtl">
                              <span className={`font-bold block mb-1 ${strategyColor}`}>
                                {sub.healthScore >= 80 ? '🟢 استراتژی توسعه' : sub.healthScore < 60 ? '🔴 استراتژی بازسازی ساختار' : '🟡 استراتژی بهبود تدریجی'}
                              </span>
                              <span className="text-neutral-300 font-sans text-[10px]">{strategyText}</span>
                            </td>
                          );
                        })}
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* AI Comparison Analysis Report container */}
                {compareAiReport && (
                  <div className="mt-4 border border-blue-500/20 rounded-xl bg-[#0a0a0b]/60 overflow-hidden flex flex-col">
                    <div className="bg-[#0f0f12] border-b border-white/5 px-4 py-2 flex items-center justify-between text-[10px]" dir="rtl">
                      <div className="flex items-center gap-1.5 text-blue-400 font-bold">
                        <Bot size={13} />
                        <span>گزارش توازن ترازنامه و موازنه هوشمند سپه AI:</span>
                      </div>
                      <span className="text-neutral-500 font-mono">COMPARATIVE_AUDIT_REPORT</span>
                    </div>
                    <div className="p-4 text-right text-xs leading-relaxed max-h-[350px] overflow-y-auto custom-scrollbar" dir="rtl">
                      <div className="markdown-body text-neutral-300">
                        <MarkdownRenderer content={compareAiReport} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Smart AI Subsidiary Analyst Panel (full width underneath the table) */}
        <div className="w-full bg-[#16161a] border border-white/10 rounded-2xl shadow-2xl p-5 sm:p-6 text-neutral-200 flex flex-col justify-between" id="subsidiary-ai-analyst">
          <div className="space-y-4">
            {/* Panel Title */}
            <div className="flex items-center justify-between border-b border-white/5 pb-3" dir="rtl">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-blue-500/10 text-blue-400 rounded-lg border border-blue-500/20">
                  <Bot size={16} />
                </span>
                <h4 className="text-xs sm:text-sm font-bold text-white font-sans">تحلیل‌گر ارشد تابعه (سپه AI)</h4>
              </div>
              <span className="text-[8px] text-neutral-500 font-mono font-bold uppercase">Smart Auditor</span>
            </div>

            <div className="text-[11px] text-neutral-400 leading-relaxed text-right" dir="rtl">
              <p>
                جناب دکتر رضایی، جهت بررسی ۳۶۰ درجه و تولید سناریو ممیزی صورت‌های مالی شرکت تابعه، از دکمه‌های زیر استفاده کنید:
              </p>
            </div>

            {/* Target Select Dropdown */}
            <div className="space-y-1 text-right" dir="rtl">
              <label className="text-[10px] text-neutral-500 block font-bold">انتخاب شرکت هدف برای ممیزی:</label>
              <select
                value={selectedAiCompanyId}
                onChange={(e) => setSelectedAiCompanyId(e.target.value)}
                className="w-full bg-[#0a0a0b] border border-white/10 rounded-xl px-2.5 py-2 text-xs text-neutral-300 focus:outline-none focus:border-blue-500/50 cursor-pointer"
              >
                <option value="all">📊 کل سبد پورتفوی هلدینگ</option>
                {subsidiaries.map(sub => (
                  <option key={sub.id} value={sub.id}>
                    {sub.ticker} - {sub.name} ({sub.healthScore}٪)
                  </option>
                ))}
              </select>
            </div>

            {/* Analyst Quick Commands */}
            <div className="grid grid-cols-2 gap-2" dir="rtl">
              <button
                onClick={() => handleAiAnalysis('RISK')}
                disabled={isAnalyzing}
                className="py-2.5 bg-red-500/10 hover:bg-red-500/20 disabled:opacity-50 text-red-400 hover:text-red-300 border border-red-500/20 rounded-xl text-[10px] font-bold transition-all cursor-pointer flex flex-col items-center gap-1 justify-center"
              >
                <ShieldAlert size={14} />
                <span>بررسی ناترازی و ریسک</span>
              </button>

              <button
                onClick={() => handleAiAnalysis('PROFIT')}
                disabled={isAnalyzing}
                className="py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 disabled:opacity-50 text-emerald-400 hover:text-emerald-300 border border-emerald-500/20 rounded-xl text-[10px] font-bold transition-all cursor-pointer flex flex-col items-center gap-1 justify-center"
              >
                <TrendingUp size={14} />
                <span>بهینه‌سازی سودآوری</span>
              </button>

              <button
                onClick={() => handleAiAnalysis('ALLOCATION')}
                disabled={isAnalyzing}
                className="py-2.5 bg-blue-500/10 hover:bg-blue-500/20 disabled:opacity-50 text-blue-400 hover:text-blue-300 border border-blue-500/20 rounded-xl text-[10px] font-bold transition-all cursor-pointer flex flex-col items-center gap-1 justify-center"
              >
                <Brain size={14} />
                <span>مشاوره تخصیص سرمایه</span>
              </button>

              <button
                onClick={() => handleAiAnalysis('DIVIDEND')}
                disabled={isAnalyzing}
                className="py-2.5 bg-indigo-500/10 hover:bg-indigo-500/20 disabled:opacity-50 text-indigo-400 hover:text-indigo-300 border border-indigo-500/20 rounded-xl text-[10px] font-bold transition-all cursor-pointer flex flex-col items-center gap-1 justify-center"
              >
                <DollarSign size={14} />
                <span>سیاست تقسیم سود مجمع</span>
              </button>
            </div>
          </div>

          {/* Response Container */}
          <div className="mt-4 border border-white/5 rounded-xl bg-[#0a0a0b]/50 overflow-hidden flex-1 flex flex-col min-h-[220px]">
            <div className="bg-[#0f0f12] border-b border-white/5 px-3 py-1.5 flex items-center justify-between text-[10px]" dir="rtl">
              <span className="text-neutral-500">خروجی دستیار تصمیم‌یار:</span>
              <span className="text-blue-400 font-mono">ONLINE</span>
            </div>

            <div className="p-3.5 flex-1 overflow-y-auto text-right text-xs leading-relaxed max-h-[260px] custom-scrollbar" dir="rtl">
              {isAnalyzing ? (
                <div className="flex flex-col items-center justify-center py-10 space-y-3">
                  <RefreshCw className="animate-spin text-blue-400" size={24} />
                  <span className="text-neutral-500 text-[10px] animate-pulse">در حال استخراج ترازنامه‌ها و آنالیز مجمع...</span>
                </div>
              ) : aiReport ? (
                <div className="markdown-body text-neutral-300">
                  <MarkdownRenderer content={aiReport} />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center space-y-2">
                  <Sparkles size={18} className="text-neutral-600" />
                  <span className="text-neutral-500 text-[10px]">روی یکی از گزینه‌های نظارتی ممیزی کلیک کنید تا تحلیل هوشمند تولید شود.</span>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
