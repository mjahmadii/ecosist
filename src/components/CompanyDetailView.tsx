import React, { useState, useEffect } from 'react';
import { Subsidiary, RiskThresholds } from '../types';
import { 
  ArrowLeft, Building2, Shield, Calendar, Award, Zap, AlertTriangle, 
  HelpCircle, CheckCircle2, TrendingUp, Sparkles, RefreshCw
} from 'lucide-react';
import { calculateAltmanZScore, calculateScores } from '../mockData';

interface CompanyDetailViewProps {
  company: Subsidiary;
  thresholds: RiskThresholds;
  onBack: () => void;
  onUpdateCompanyFinancials: (id: string, updatedData: any) => void;
}

export default function CompanyDetailView({ company, thresholds, onBack, onUpdateCompanyFinancials }: CompanyDetailViewProps) {
  // Altman Z-Score playground interactive states initialized with company values
  const [revenue, setRevenue] = useState(company.financialData.revenue);
  const [netProfit, setNetProfit] = useState(company.financialData.netProfit);
  const [totalAssets, setTotalAssets] = useState(company.financialData.totalAssets);
  const [totalLiabilities, setTotalLiabilities] = useState(company.financialData.totalLiabilities);
  const [currentAssets, setCurrentAssets] = useState(company.financialData.currentAssets);
  const [currentLiabilities, setCurrentLiabilities] = useState(company.financialData.currentLiabilities);
  const [retainedEarnings, setRetainedEarnings] = useState(company.financialData.retainedEarnings);
  const [stockEquity, setStockEquity] = useState(company.financialData.stockEquity);

  // Dynamic calculations
  const [zScore, setZScore] = useState(company.riskMetrics.altmanZScore);
  const [riskLevel, setRiskLevel] = useState(company.riskMetrics.bankruptcyRisk);
  const [debtToEquity, setDebtToEquity] = useState(company.riskMetrics.debtToEquity);
  const [currentRatio, setCurrentRatio] = useState(company.riskMetrics.currentRatio);
  const [tempHealthScore, setTempHealthScore] = useState(company.healthScore);
  const [tempGovScore, setTempGovScore] = useState(company.governanceScore);
  const [isDirty, setIsDirty] = useState(false);

  // Recompute parameters on input changes (Playground mode)
  useEffect(() => {
    const zCalc = calculateAltmanZScore(
      currentAssets, currentLiabilities, totalAssets, retainedEarnings, netProfit, stockEquity, revenue, totalLiabilities
    );
    setZScore(zCalc.zScore);
    setRiskLevel(zCalc.risk);

    const computedDebtToEquity = stockEquity > 0 ? totalLiabilities / stockEquity : 0;
    const computedCurrentRatio = currentLiabilities > 0 ? currentAssets / currentLiabilities : 1;
    setDebtToEquity(computedDebtToEquity);
    setCurrentRatio(computedCurrentRatio);

    // Calculate simulated overall scores
    const subClone = {
      ...company,
      financialData: {
        revenue, netProfit, totalAssets, totalLiabilities, currentAssets,
        currentLiabilities, operatingCashFlow: company.financialData.operatingCashFlow,
        rAndDExpenses: company.financialData.rAndDExpenses, retainedEarnings, stockEquity
      }
    };
    const scores = calculateScores(subClone, thresholds);
    setTempHealthScore(scores.healthScore);
    setTempGovScore(scores.governanceScore);

    // Check if anything has deviated from database values
    const hasChanged = 
      revenue !== company.financialData.revenue ||
      netProfit !== company.financialData.netProfit ||
      totalAssets !== company.financialData.totalAssets ||
      totalLiabilities !== company.financialData.totalLiabilities ||
      currentAssets !== company.financialData.currentAssets ||
      currentLiabilities !== company.financialData.currentLiabilities ||
      retainedEarnings !== company.financialData.retainedEarnings ||
      stockEquity !== company.financialData.stockEquity;
    
    setIsDirty(hasChanged);
  }, [revenue, netProfit, totalAssets, totalLiabilities, currentAssets, currentLiabilities, retainedEarnings, stockEquity, thresholds, company]);

  const handleSaveSimulatedFinancials = () => {
    onUpdateCompanyFinancials(company.id, {
      revenue, netProfit, totalAssets, totalLiabilities, currentAssets,
      currentLiabilities, retainedEarnings, stockEquity,
      altmanZScore: zScore, bankruptcyRisk: riskLevel, debtToEquity, currentRatio,
      healthScore: tempHealthScore, governanceScore: tempGovScore
    });
    setIsDirty(false);
  };

  const handleResetSimulatedFinancials = () => {
    setRevenue(company.financialData.revenue);
    setNetProfit(company.financialData.netProfit);
    setTotalAssets(company.financialData.totalAssets);
    setTotalLiabilities(company.financialData.totalLiabilities);
    setCurrentAssets(company.financialData.currentAssets);
    setCurrentLiabilities(company.financialData.currentLiabilities);
    setRetainedEarnings(company.financialData.retainedEarnings);
    setStockEquity(company.financialData.stockEquity);
    setIsDirty(false);
  };

  // Score Colors Helpers
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/5';
    if (score >= 60) return 'text-amber-400 border-amber-500/30 bg-amber-500/5';
    return 'text-red-400 border-red-500/30 bg-red-500/5';
  };

  const getZScoreColor = (z: number) => {
    if (z > 2.9) return 'text-emerald-400';
    if (z > 1.8) return 'text-amber-400';
    return 'text-red-400 font-bold';
  };

  return (
    <div className="space-y-6 text-neutral-200 font-sans" id="company-detail-page">
      {/* Detail Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between bg-[#16161a] border border-white/10 p-5 rounded-xl shadow-lg gap-4">
        <button 
          onClick={onBack}
          className="px-4 py-2 bg-[#0a0a0b] border border-white/10 rounded-lg hover:border-blue-500/40 text-neutral-300 hover:text-blue-400 flex items-center gap-2 text-xs transition-colors cursor-pointer self-start sm:self-center font-semibold"
        >
          <ArrowLeft size={16} />
          <span>بازگشت به هلدینگ / Return</span>
        </button>

        <div className="flex items-center gap-3.5 text-right w-full sm:w-auto justify-end">
          <div>
            <h2 className="text-lg font-extrabold text-white flex items-center justify-end gap-2" dir="rtl">
              {company.name}
              <span className="text-xs px-2.5 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded font-bold font-mono">
                {company.ticker}
              </span>
            </h2>
            <p className="text-xs text-neutral-500 font-mono mt-0.5">
              {company.englishName} &bull; {company.sector}
            </p>
          </div>
          <span className="p-3 bg-[#0a0a0b] border border-white/10 rounded-xl text-neutral-400">
            <Building2 size={24} />
          </span>
        </div>
      </div>

      {/* Main KPI Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Financial health */}
        <div className={`border p-5 rounded-xl flex items-center justify-between ${getScoreColor(tempHealthScore)}`}>
          <div>
            <div className="text-xs text-neutral-400 uppercase tracking-wider font-mono">Simulated Financial Health</div>
            <div className="text-3xl font-extrabold tracking-tight mt-1 font-mono">{tempHealthScore}%</div>
            <p className="text-[10px] text-neutral-500 mt-2" dir="rtl">بر اساس حاشیه سود، نسبت جاری و ریسک آلتمن</p>
          </div>
          <span className="p-3 bg-[#0a0a0b]/40 rounded-xl border border-white/5">
            <Zap size={20} />
          </span>
        </div>

        {/* Corporate governance */}
        <div className={`border p-5 rounded-xl flex items-center justify-between ${getScoreColor(tempGovScore)}`}>
          <div>
            <div className="text-xs text-neutral-400 uppercase tracking-wider font-mono">Simulated Corp Governance</div>
            <div className="text-3xl font-extrabold tracking-tight mt-1 font-mono">{tempGovScore}%</div>
            <p className="text-[10px] text-neutral-500 mt-2" dir="rtl">بر اساس نسبت اعضا، حضور حسابرس و شفافیت</p>
          </div>
          <span className="p-3 bg-[#0a0a0b]/40 rounded-xl border border-white/5">
            <Award size={20} />
          </span>
        </div>

        {/* Altman zscore summary */}
        <div className="bg-[#16161a] border border-white/10 p-5 rounded-xl flex items-center justify-between text-neutral-200">
          <div>
            <div className="text-xs text-neutral-400 uppercase tracking-wider font-mono">Current Altman Z-Score</div>
            <div className="text-3xl font-extrabold tracking-tight mt-1 font-mono flex items-baseline gap-2">
              <span className={getZScoreColor(zScore)}>{zScore.toFixed(2)}</span>
              <span className="text-[10px] text-neutral-400 font-bold uppercase">{riskLevel} RISK</span>
            </div>
            <p className="text-[10px] text-neutral-500 mt-2" dir="rtl">مدل پیش‌بینی ورشکستگی صنایع تولیدی و خدماتی</p>
          </div>
          <span className="p-3 bg-[#0a0a0b] rounded-xl border border-white/10 text-blue-400">
            <Shield size={20} />
          </span>
        </div>
      </div>

      {/* Main Breakdown & Modeling grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Interactive Modeling Playground */}
        <div className="bg-[#16161a] border border-white/10 p-5 rounded-xl shadow-lg lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center pb-4 border-b border-white/10">
            <div className="flex items-center gap-2">
              <RefreshCw size={14} className={isDirty ? 'text-blue-400 animate-spin' : 'text-neutral-500'} />
              <span className="text-xs font-mono text-neutral-500">DYNAMIC RESTRUCTURE SIMULATOR</span>
            </div>
            <h3 className="text-sm font-bold text-neutral-300" dir="rtl">شبیه‌ساز سناریوهای مالی و تجدید ساختار</h3>
          </div>

          <div className="bg-blue-500/5 border border-blue-500/10 p-3 rounded-lg text-xs leading-relaxed text-blue-400" dir="rtl">
            💡 **روش کار**: مقادیر ورودی صورت‌های مالی تابعه را در کادرهای زیر تغییر دهید؛ هوش مصنوعی و کدهای تحلیلی Altman Z-Score، نسبت بدهی و سطح ریسک نهایی هلدینگ را به طور آنی مدل‌سازی می‌کنند.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
            {/* Input 1 */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-neutral-400">
                <span>Revenue (درآمد کل)</span>
                <span className="font-sans font-semibold text-neutral-200" dir="rtl">
                  {revenue.toLocaleString('fa-IR')} <span className="text-neutral-500 text-[10px]">میلیارد</span>
                </span>
              </div>
              <input 
                type="number" 
                value={revenue} 
                onChange={(e) => setRevenue(parseFloat(e.target.value) || 0)}
                className="w-full bg-[#0a0a0b] border border-white/10 rounded px-3 py-2 focus:border-blue-500/50 focus:outline-none text-white font-mono" 
              />
            </div>

            {/* Input 2 */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-neutral-400">
                <span>Net Profit (سود خالص)</span>
                <span className="font-sans font-semibold text-neutral-200" dir="rtl">
                  {netProfit.toLocaleString('fa-IR')} <span className="text-neutral-500 text-[10px]">میلیارد</span>
                </span>
              </div>
              <input 
                type="number" 
                value={netProfit} 
                onChange={(e) => setNetProfit(parseFloat(e.target.value) || 0)}
                className="w-full bg-[#0a0a0b] border border-white/10 rounded px-3 py-2 focus:border-blue-500/50 focus:outline-none text-white font-mono" 
              />
            </div>

            {/* Input 3 */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-neutral-400">
                <span>Total Assets (مجموع دارایی‌ها)</span>
                <span className="font-sans font-semibold text-neutral-200" dir="rtl">
                  {totalAssets.toLocaleString('fa-IR')} <span className="text-neutral-500 text-[10px]">میلیارد</span>
                </span>
              </div>
              <input 
                type="number" 
                value={totalAssets} 
                onChange={(e) => setTotalAssets(parseFloat(e.target.value) || 0)}
                className="w-full bg-[#0a0a0b] border border-white/10 rounded px-3 py-2 focus:border-blue-500/50 focus:outline-none text-white font-mono" 
              />
            </div>

            {/* Input 4 */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-neutral-400">
                <span>Total Liabilities (مجموع بدهی‌ها)</span>
                <span className="font-sans font-semibold text-neutral-200" dir="rtl">
                  {totalLiabilities.toLocaleString('fa-IR')} <span className="text-neutral-500 text-[10px]">میلیارد</span>
                </span>
              </div>
              <input 
                type="number" 
                value={totalLiabilities} 
                onChange={(e) => setTotalLiabilities(parseFloat(e.target.value) || 0)}
                className="w-full bg-[#0a0a0b] border border-white/10 rounded px-3 py-2 focus:border-blue-500/50 focus:outline-none text-white font-mono" 
              />
            </div>

            {/* Input 5 */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-neutral-400">
                <span>Current Assets (دارایی‌های جاری)</span>
                <span className="font-sans font-semibold text-neutral-200" dir="rtl">
                  {currentAssets.toLocaleString('fa-IR')} <span className="text-neutral-500 text-[10px]">میلیارد</span>
                </span>
              </div>
              <input 
                type="number" 
                value={currentAssets} 
                onChange={(e) => setCurrentAssets(parseFloat(e.target.value) || 0)}
                className="w-full bg-[#0a0a0b] border border-white/10 rounded px-3 py-2 focus:border-blue-500/50 focus:outline-none text-white font-mono" 
              />
            </div>

            {/* Input 6 */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-neutral-400">
                <span>Current Liabilities (بدهی‌های جاری)</span>
                <span className="font-sans font-semibold text-neutral-200" dir="rtl">
                  {currentLiabilities.toLocaleString('fa-IR')} <span className="text-neutral-500 text-[10px]">میلیارد</span>
                </span>
              </div>
              <input 
                type="number" 
                value={currentLiabilities} 
                onChange={(e) => setCurrentLiabilities(parseFloat(e.target.value) || 0)}
                className="w-full bg-[#0a0a0b] border border-white/10 rounded px-3 py-2 focus:border-blue-500/50 focus:outline-none text-white font-mono" 
              />
            </div>

            {/* Input 7 */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-neutral-400">
                <span>Retained Earnings (سود انباشته)</span>
                <span className="font-sans font-semibold text-neutral-200" dir="rtl">
                  {retainedEarnings.toLocaleString('fa-IR')} <span className="text-neutral-500 text-[10px]">میلیارد</span>
                </span>
              </div>
              <input 
                type="number" 
                value={retainedEarnings} 
                onChange={(e) => setRetainedEarnings(parseFloat(e.target.value) || 0)}
                className="w-full bg-[#0a0a0b] border border-white/10 rounded px-3 py-2 focus:border-blue-500/50 focus:outline-none text-white font-mono" 
              />
            </div>

            {/* Input 8 */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-neutral-400">
                <span>Stockholder Equity (حقوق صاحبان سهام)</span>
                <span className="font-sans font-semibold text-neutral-200" dir="rtl">
                  {stockEquity.toLocaleString('fa-IR')} <span className="text-neutral-500 text-[10px]">میلیارد</span>
                </span>
              </div>
              <input 
                type="number" 
                value={stockEquity} 
                onChange={(e) => setStockEquity(parseFloat(e.target.value) || 0)}
                className="w-full bg-[#0a0a0b] border border-white/10 rounded px-3 py-2 focus:border-blue-500/50 focus:outline-none text-white font-mono" 
              />
            </div>
          </div>

          {/* Action buttons if simulator is modified */}
          {isDirty && (
            <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
              <button 
                id="reset-playground"
                onClick={handleResetSimulatedFinancials}
                className="px-4 py-2 bg-[#0a0a0b] hover:bg-white/[0.05] text-neutral-400 hover:text-neutral-200 text-xs rounded-lg transition-colors border border-white/10 cursor-pointer font-semibold"
              >
                انصراف و ریست / Cancel
              </button>
              <button 
                id="save-playground"
                onClick={handleSaveSimulatedFinancials}
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold text-xs rounded-lg hover:shadow-lg hover:shadow-blue-500/5 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles size={14} />
                <span>ذخیره دائمی تغییرات در هلدینگ / Apply</span>
              </button>
            </div>
          )}
        </div>

        {/* C-Level Governance & ESG Parameters */}
        <div className="bg-[#16161a] border border-white/10 p-5 rounded-xl shadow-lg flex flex-col justify-between space-y-6 text-neutral-200">
          <div>
            <div className="flex justify-between items-center pb-4 border-b border-white/10 mb-5">
              <span className="text-xs font-mono text-neutral-500">GOVERNANCE & SUSTAINABILITY</span>
              <h3 className="text-sm font-bold text-neutral-300" dir="rtl">کیفیت حاکمیت و پایداری شرکتی</h3>
            </div>

            {/* Gov Data metrics */}
            <div className="space-y-4 text-xs">
              <div className="flex justify-between items-center py-1.5 border-b border-white/5">
                <span className="px-2 py-0.5 bg-[#0a0a0b] border border-white/10 rounded font-mono text-neutral-300 font-bold">{company.governanceData.boardMembersCount} نفر</span>
                <span className="text-neutral-400" dir="rtl">تعداد کل اعضای هیئت مدیره:</span>
              </div>

              <div className="flex justify-between items-center py-1.5 border-b border-white/5">
                <span className="px-2 py-0.5 bg-[#0a0a0b] border border-white/10 rounded font-mono text-neutral-300 font-bold">{Math.round(company.governanceData.independentDirectorsRatio * 100)}٪</span>
                <span className="text-neutral-400" dir="rtl">نسبت اعضای مستقل (هدف ۴۰٪):</span>
              </div>

              <div className="flex justify-between items-center py-1.5 border-b border-white/5">
                <span className="px-2 py-0.5 bg-[#0a0a0b] border border-white/10 rounded font-mono text-neutral-300 font-bold">{company.governanceData.boardMeetingsCount} جلسه</span>
                <span className="text-neutral-400" dir="rtl">تعداد جلسات برگزار شده سالانه:</span>
              </div>

              <div className="flex justify-between items-center py-1.5 border-b border-white/5">
                <span className="px-2 py-0.5 bg-[#0a0a0b] border border-white/10 rounded font-mono text-neutral-300 font-bold">{Math.round(company.governanceData.attendanceRate * 100)}٪</span>
                <span className="text-neutral-400" dir="rtl">نرخ میانگین حضور در جلسات:</span>
              </div>

              <div className="flex justify-between items-center py-1.5 border-b border-white/5">
                <span className="px-2 py-0.5 bg-[#0a0a0b] border border-white/10 rounded font-mono text-blue-400 font-extrabold">{company.governanceData.auditQualityRating}</span>
                <span className="text-neutral-400" dir="rtl">درجه کیفیت حسابرس مستقل مجمع:</span>
              </div>

              <div className="flex justify-between items-center py-1.5">
                <span className="px-2 py-0.5 bg-[#0a0a0b] border border-white/10 rounded font-mono text-neutral-300 font-bold">{company.governanceData.shareholderDisputesCount} مورد</span>
                <span className="text-neutral-400" dir="rtl">دعاوی حقوقی و اختلافات سهامداران:</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-white/10 space-y-4">
            <h4 className="text-xs font-bold text-neutral-400 text-right" dir="rtl">شاخص زیست‌محیطی (ESG)</h4>
            <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
              <div className="p-2 bg-[#0a0a0b] rounded border border-white/5">
                <span className="text-emerald-400 font-bold block text-sm font-mono">{company.esgData.environmentalScore}%</span>
                <span className="text-neutral-500">محیط‌زیست</span>
              </div>
              <div className="p-2 bg-[#0a0a0b] rounded border border-white/5">
                <span className="text-blue-400 font-bold block text-sm font-mono">{company.esgData.socialScore}%</span>
                <span className="text-neutral-500">مسئولیت اجتماعی</span>
              </div>
              <div className="p-2 bg-[#0a0a0b] rounded border border-white/5">
                <span className="text-indigo-400 font-bold block text-sm font-mono">{company.esgData.governanceScore}%</span>
                <span className="text-neutral-500">شفافیت مجامع</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
