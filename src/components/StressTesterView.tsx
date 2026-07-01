import React, { useState, useEffect } from 'react';
import { Subsidiary } from '../types';
import { calculateAltmanZScore } from '../mockData';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { Activity, ShieldAlert, CheckCircle, TrendingUp, Info } from 'lucide-react';

interface StressTesterViewProps {
  subsidiaries: Subsidiary[];
}

export default function StressTesterView({ subsidiaries }: StressTesterViewProps) {
  // Shocks controls
  const [usdRateSpike, setUsdRateSpike] = useState(0); // 0% to +100%
  const [interestRate, setInterestRate] = useState(25); // 15% to 35%
  const [inflationShock, setInflationShock] = useState(0); // 0% to +80%
  const [energyPriceSpike, setEnergyPriceSpike] = useState(0); // 0% to +150%

  // Simulated metrics
  const [stressedData, setStressedData] = useState<Array<Subsidiary & { stressedZScore: number; stressedProfit: number; stressedRisk: string }>>([]);

  useEffect(() => {
    const updated = subsidiaries.map(sub => {
      let profitMultiplier = 1.0;
      let assetMultiplier = 1.0;
      let liabilityMultiplier = 1.0;

      // Sector specific sensitivities to macroeconomic shocks
      if (sub.sectorEng === 'Chemicals & Energy') {
        // Petrochemical benefits from USD rate spikes (exports) but loses on energy price spikes (feedstock)
        profitMultiplier += (usdRateSpike / 100) * 0.45;
        profitMultiplier -= (energyPriceSpike / 100) * 0.25;
        // High inflation raises operational costs
        profitMultiplier -= (inflationShock / 100) * 0.15;
        // Interest rate sensitivity
        const interestImpact = (interestRate - 22) / 100 * 0.08;
        profitMultiplier -= interestImpact;
      } 
      else if (sub.sectorEng === 'Pharmaceuticals') {
        // Pharma relies on imported ingredients so USD rate hike hurts margins
        profitMultiplier -= (usdRateSpike / 100) * 0.30;
        // Inflation adds cost, but pharma has pricing power (defensive)
        profitMultiplier -= (inflationShock / 100) * 0.10;
        // Zero debt, so low interest rate sensitivity
        profitMultiplier -= (interestRate > 30 ? 0.02 : 0);
      }
      else if (sub.sectorEng === 'Heavy Industries') {
        // Cement is highly energy intensive and high debt
        profitMultiplier -= (energyPriceSpike / 100) * 0.50;
        profitMultiplier -= (inflationShock / 100) * 0.20;
        // Highly sensitive to interest rate hikes due to massive bank debt
        const interestImpact = (interestRate - 18) / 100 * 0.60;
        profitMultiplier -= interestImpact;
        // Asset replacement cost goes up with USD spike
        liabilityMultiplier += (usdRateSpike / 100) * 0.15;
      }
      else if (sub.sectorEng === 'Technology') {
        // Tech resilient to energy cost but hurt by wage inflation
        profitMultiplier -= (inflationShock / 100) * 0.35;
        // Highly sensitive to tech valuation discount factor (higher rates = lower value)
        const discountFactor = (interestRate - 18) / 100 * 0.25;
        profitMultiplier -= discountFactor;
      }
      else {
        // Consumer goods / agriculture
        profitMultiplier -= (energyPriceSpike / 100) * 0.15;
        profitMultiplier -= (inflationShock / 100) * 0.12;
        profitMultiplier -= (usdRateSpike / 100) * 0.10;
      }

      // Compute stressed financial statements
      const stressedProfit = Math.round(sub.financialData.netProfit * Math.max(-0.9, profitMultiplier));
      const stressedLiabilities = Math.round(sub.financialData.totalLiabilities * liabilityMultiplier);
      const stressedCurrentLiabilities = Math.round(sub.financialData.currentLiabilities * (1 + (interestRate - 22)/100 * 0.2));

      // Calculate stressed Altman Z-Score
      const zCalc = calculateAltmanZScore(
        sub.financialData.currentAssets,
        stressedCurrentLiabilities,
        sub.financialData.totalAssets,
        sub.financialData.retainedEarnings,
        stressedProfit,
        sub.financialData.stockEquity,
        sub.financialData.revenue,
        stressedLiabilities
      );

      return {
        ...sub,
        stressedZScore: zCalc.zScore,
        stressedProfit,
        stressedRisk: zCalc.risk
      };
    });

    setStressedData(updated);
  }, [usdRateSpike, interestRate, inflationShock, energyPriceSpike, subsidiaries]);

  // Chart dataset
  const chartData = stressedData.map(d => ({
    name: d.name,
    'سود قبل از تنش': d.financialData.netProfit,
    'سود پس از تنش مالی': d.stressedProfit
  }));

  const getRiskBadgeColor = (risk: string) => {
    if (risk === 'Very Low' || risk === 'Low') return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/15';
    if (risk === 'Moderate') return 'bg-amber-500/10 text-amber-400 border-amber-500/15';
    return 'bg-red-500/10 text-red-400 border-red-500/15 animate-pulse';
  };

  return (
    <div className="space-y-6 text-neutral-200 font-sans" id="stress-tester-tab">
      {/* Top Description */}
      <div className="bg-[#16161a] border border-white/10 p-5 rounded-xl shadow-lg">
        <div className="flex items-center gap-3 mb-2 text-blue-400">
          <Activity size={24} />
          <h3 className="text-sm font-bold text-white" dir="rtl">سامانه شبیه‌سازی بحران‌های کلان و استرس‌تست مالی</h3>
        </div>
        <p className="text-xs text-neutral-400 leading-relaxed text-right" dir="rtl">
          این ماژول پیشرفته به مدیران هلدینگ امکان می‌دهد تا شوک‌های کلان اقتصادی کشور نظیر نوسانات ناگهانی ارز، افزایش نرخ سود بانکی، جهش تورمی یا آزادسازی قیمت حامل‌های انرژی را شبیه‌سازی کرده و تأثیر مستقیم آن را بر ساختار سودآوری، ترازنامه و ریسک ورشکستگی کل پورتفوی بانک سپه در قالب سناریوهای پویای ریاضی تحلیل نمایند.
        </p>
      </div>

      {/* Main Grid: Left Controls, Right Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls Card */}
        <div className="bg-[#16161a] border border-white/10 p-5 rounded-xl shadow-lg space-y-6">
          <h4 className="text-xs font-bold text-neutral-400 border-b border-white/10 pb-2.5 uppercase tracking-wider font-mono">Macro Shock Parameters</h4>
          
          {/* Slider 1 */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="font-mono text-blue-400">+{usdRateSpike}%</span>
              <span className="text-neutral-400" dir="rtl">جهش نرخ ارز (USD/IRR):</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={usdRateSpike} 
              onChange={(e) => setUsdRateSpike(parseInt(e.target.value))}
              className="w-full accent-blue-500 cursor-pointer" 
            />
            <p className="text-[10px] text-neutral-500 text-right" dir="rtl">افزایش سود صادراتی پتروشیمی / تضعیف حاشیه دارویی و سیمانی</p>
          </div>

          {/* Slider 2 */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="font-mono text-blue-400">{interestRate}%</span>
              <span className="text-neutral-400" dir="rtl">نرخ بهره بین‌بانکی / سود بانکی:</span>
            </div>
            <input 
              type="range" 
              min="15" 
              max="35" 
              value={interestRate} 
              onChange={(e) => setInterestRate(parseInt(e.target.value))}
              className="w-full accent-blue-500 cursor-pointer" 
            />
            <p className="text-[10px] text-neutral-500 text-right" dir="rtl">افزایش هزینه‌های مالی صنایع دارای اهرم بدهی بالا (سکاویر)</p>
          </div>

          {/* Slider 3 */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="font-mono text-blue-400">+{inflationShock}%</span>
              <span className="text-neutral-400" dir="rtl">تورم هزینه‌های عمومی و دستمزد:</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="80" 
              value={inflationShock} 
              onChange={(e) => setInflationShock(parseInt(e.target.value))}
              className="w-full accent-blue-500 cursor-pointer" 
            />
            <p className="text-[10px] text-neutral-500 text-right" dir="rtl">افزایش بهای تمام شده کالای فروش رفته و کاهش حاشیه ناخالص هلدینگ</p>
          </div>

          {/* Slider 4 */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="font-mono text-blue-400">+{energyPriceSpike}%</span>
              <span className="text-neutral-400" dir="rtl">جهش قیمت گاز خوراک و حامل‌های انرژی:</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="150" 
              value={energyPriceSpike} 
              onChange={(e) => setEnergyPriceSpike(parseInt(e.target.value))}
              className="w-full accent-blue-500 cursor-pointer" 
            />
            <p className="text-[10px] text-neutral-500 text-right" dir="rtl">فشار بر حاشیه پتروشیمی‌ها و فرآیندهای کوره کلینکر سیمان کویر</p>
          </div>
        </div>

        {/* Stressed Profit Chart */}
        <div className="bg-[#16161a] border border-white/10 p-5 rounded-xl shadow-lg lg:col-span-2 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-4">
            <span className="text-xs font-mono text-neutral-500">STRESSED PROFIT COMPARISON</span>
            <h3 className="text-sm font-bold text-neutral-300" dir="rtl">شبیه‌سازی حاشیه سود خالص تحت تنش</h3>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" stroke="#a1a1aa" fontSize={11} tickLine={false} />
                <YAxis stroke="#a1a1aa" fontSize={11} tickLine={false} width={80} tickMargin={10} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0a0a0b', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                />
                <Legend iconSize={10} wrapperStyle={{ fontSize: '11px', paddingTop: 10 }} />
                <Bar dataKey="سود قبل از تنش" fill="rgba(255,255,255,0.15)" radius={[4, 4, 0, 0]} barSize={20} />
                <Bar dataKey="سود پس از تنش مالی" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-[#0a0a0b]/40 border border-white/5 p-3 rounded-lg text-xs leading-relaxed flex gap-2 text-neutral-400 mt-4" dir="rtl">
            <Info size={16} className="text-blue-400 flex-shrink-0 mt-0.5" />
            <span>مدل ریاضی شبیه‌ساز شامل متغیرهای کشش تقاضا، نرخ مصوب قیمت‌گذاری دستوری و میزان صادراتی بودن هر شرکت تابعه است. پتروشیمی به عنوان یک پوشش ریسک (Hedging) ارزی برای هلدینگ عمل می‌کند.</span>
          </div>
        </div>
      </div>

      {/* Results Table under Stress */}
      <div className="bg-[#16161a] border border-white/10 rounded-xl shadow-lg p-5">
        <h4 className="text-sm font-bold text-neutral-200 mb-4 text-right animate-none" dir="rtl">برآورد فروریزش شاخص‌های پایداری و ریسک ورشکستگی زیر تنش</h4>
        
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-right border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-neutral-400">
                <th className="py-2.5 px-4 text-right">شرکت و نماد</th>
                <th className="py-2.5 px-4 text-center">سود ترازنامه قبلی</th>
                <th className="py-2.5 px-4 text-center">سود ترازنامه تحت استرس</th>
                <th className="py-2.5 px-4 text-center">تغییر سودآوری</th>
                <th className="py-2.5 px-4 text-center">Z-Score پایه</th>
                <th className="py-2.5 px-4 text-center">Z-Score فرضی</th>
                <th className="py-2.5 px-4 text-center">وضعیت ریسک نهایی</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-neutral-300">
              {stressedData.map(d => {
                const profitDiff = d.stressedProfit - d.financialData.netProfit;
                const profitPct = d.financialData.netProfit > 0 ? (profitDiff / d.financialData.netProfit) * 100 : 0;
                
                return (
                  <tr key={d.id} className="hover:bg-white/[0.02]">
                    <td className="py-3 px-4 font-bold text-white">{d.name} <span className="text-[10px] text-neutral-500 font-mono font-bold">({d.ticker})</span></td>
                    <td className="py-3 px-4 text-center font-sans" dir="rtl">
                      <span className="font-semibold text-neutral-100">{d.financialData.netProfit.toLocaleString('fa-IR')}</span>{' '}
                      <span className="text-neutral-400 text-xs">میلیارد</span>
                    </td>
                    <td className="py-3 px-4 text-center font-sans font-bold" dir="rtl">
                      <span className="font-bold text-white">{d.stressedProfit.toLocaleString('fa-IR')}</span>{' '}
                      <span className="text-neutral-400 text-xs font-normal">میلیارد</span>
                    </td>
                    <td className={`py-3 px-4 text-center font-mono font-bold ${profitDiff >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {profitDiff >= 0 ? '+' : ''}{Math.round(profitPct)}%
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-neutral-500">{d.riskMetrics.altmanZScore.toFixed(2)}</td>
                    <td className={`py-3 px-4 text-center font-mono font-bold ${d.stressedZScore < 1.8 ? 'text-red-400' : d.stressedZScore > 2.9 ? 'text-emerald-400' : 'text-amber-500'}`}>
                      {d.stressedZScore.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getRiskBadgeColor(d.stressedRisk)}`}>
                        {d.stressedRisk} Risk
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
