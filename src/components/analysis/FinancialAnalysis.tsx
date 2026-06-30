'use client';
import { useState } from 'react';
import {
  LineChart, Line, BarChart, Bar, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, Legend, ComposedChart, Area, AreaChart,
} from 'recharts';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, BarChart2 } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import {
  formatCurrency, calcDebtRatio, calcCurrentRatio, calcROE, calcROA, calcNetMargin,
  getScoreColor, getSectorLabel, getSectorColor,
} from '@/utils';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-strong rounded-xl p-3 border border-white/10 text-xs space-y-1">
      <p className="text-slate-400 font-medium">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color ?? p.stroke }}>
          {p.name}: <span className="font-bold">{typeof p.value === 'number' ? p.value.toLocaleString('fa-IR') : p.value}</span>
        </p>
      ))}
    </div>
  );
};

export default function FinancialAnalysis() {
  const { holdingData } = useAppStore();
  const [selectedMetric, setSelectedMetric] = useState<'revenue' | 'netIncome' | 'ebitda'>('revenue');
  const [comparisonSubs, setComparisonSubs] = useState<string[]>([]);

  if (!holdingData) return null;
  const { subsidiaries } = holdingData;

  const toggleSub = (id: string) => {
    setComparisonSubs((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < 4 ? [...prev, id] : prev
    );
  };

  const selectedSubs = comparisonSubs.length > 0
    ? subsidiaries.filter((s) => comparisonSubs.includes(s.id))
    : subsidiaries.slice(0, 3);

  // Build multi-year comparison data
  const trendData = [2021, 2022, 2023].map((year) => {
    const entry: Record<string, number> = { year };
    selectedSubs.forEach((sub) => {
      const fin = sub.financials.find((f) => f.year === year);
      if (fin) entry[sub.nameEn.split(' ')[0]] = fin[selectedMetric];
    });
    return entry;
  });

  // Ratio analysis
  const ratioData = subsidiaries.map((sub) => ({
    name: sub.name,
    nameEn: sub.nameEn.split(' ')[0],
    debtRatio: calcDebtRatio(sub),
    currentRatio: calcCurrentRatio(sub),
    roe: calcROE(sub),
    roa: calcROA(sub),
    margin: calcNetMargin(sub),
    sector: sub.sector,
  }));

  // Scatter: ROE vs Debt Ratio
  const scatterData = subsidiaries.map((sub) => ({
    x: calcDebtRatio(sub),
    y: calcROE(sub),
    name: sub.name,
    z: sub.financials[sub.financials.length - 1].revenue / 50000,
    color: getSectorColor(sub.sector),
  }));

  // Waterfall data for consolidated P&L
  const plData = [
    { name: 'درآمد کل', value: holdingData.totalRevenue, fill: '#3d52ff' },
    { name: 'بهای تمام‌شده', value: -holdingData.totalRevenue * 0.65, fill: '#ff3d6e' },
    { name: 'سود ناخالص', value: holdingData.totalRevenue * 0.35, fill: '#00d4ff' },
    { name: 'هزینه عملیاتی', value: -holdingData.totalRevenue * 0.18, fill: '#ffb020' },
    { name: 'EBITDA', value: holdingData.totalRevenue * 0.17, fill: '#8b5cf6' },
    { name: 'استهلاک', value: -holdingData.totalRevenue * 0.04, fill: '#ff3d6e' },
    { name: 'بهره', value: -holdingData.totalRevenue * 0.03, fill: '#ff3d6e' },
    { name: 'سود خالص', value: holdingData.totalNetIncome, fill: '#00e5b0' },
  ];

  const metricLabels = { revenue: 'درآمد', netIncome: 'سود خالص', ebitda: 'EBITDA' };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Section 1: Multi-company trend */}
      <div className="glass rounded-2xl p-5 card-glow">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-semibold text-white">مقایسه روند {metricLabels[selectedMetric]}</h3>
            <p className="text-xs text-slate-500">انتخاب حداکثر ۴ شرکت برای مقایسه</p>
          </div>
          <div className="flex items-center gap-2">
            {(['revenue', 'netIncome', 'ebitda'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setSelectedMetric(m)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  selectedMetric === m ? 'bg-brand-600/30 text-brand-300 border border-brand-500/30' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {metricLabels[m]}
              </button>
            ))}
          </div>
        </div>

        {/* Sub selector chips */}
        <div className="flex flex-wrap gap-2 mb-4">
          {subsidiaries.map((sub) => (
            <button
              key={sub.id}
              onClick={() => toggleSub(sub.id)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                comparisonSubs.includes(sub.id)
                  ? 'border-brand-500/50 bg-brand-500/20 text-brand-300'
                  : comparisonSubs.length >= 4
                  ? 'border-white/5 text-slate-600 cursor-not-allowed'
                  : 'border-white/10 text-slate-400 hover:border-white/20 hover:text-slate-300'
              }`}
              disabled={!comparisonSubs.includes(sub.id) && comparisonSubs.length >= 4}
            >
              {sub.name}
            </button>
          ))}
          {comparisonSubs.length > 0 && (
            <button onClick={() => setComparisonSubs([])} className="text-xs px-2 py-1 rounded-full text-slate-500 hover:text-slate-300">
              پاک‌سازی
            </button>
          )}
        </div>

        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="year" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
            {selectedSubs.map((sub, i) => (
              <Line
                key={sub.id}
                type="monotone"
                dataKey={sub.nameEn.split(' ')[0]}
                stroke={['#3d52ff', '#00d4ff', '#00e5b0', '#ffb020'][i]}
                strokeWidth={2.5}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Section 2: Ratio heatmap */}
      <div className="glass rounded-2xl p-5 card-glow">
        <h3 className="text-sm font-semibold text-white mb-1">تحلیل نسبت‌های مالی</h3>
        <p className="text-xs text-slate-500 mb-4">مقایسه شاخص‌های کلیدی همه شرکت‌های تابعه</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-right text-xs font-medium text-slate-400 py-2 px-3">شرکت</th>
                <th className="text-center text-xs font-medium text-slate-400 py-2 px-3">نسبت بدهی</th>
                <th className="text-center text-xs font-medium text-slate-400 py-2 px-3">نسبت جاری</th>
                <th className="text-center text-xs font-medium text-slate-400 py-2 px-3">بازده حقوق</th>
                <th className="text-center text-xs font-medium text-slate-400 py-2 px-3">بازده دارایی</th>
                <th className="text-center text-xs font-medium text-slate-400 py-2 px-3">حاشیه سود</th>
                <th className="text-center text-xs font-medium text-slate-400 py-2 px-3">Z-Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {ratioData.map((row, i) => {
                const sub = subsidiaries[i];
                return (
                  <tr key={row.name} className="hover:bg-white/3 transition-colors">
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ background: getSectorColor(row.sector) }} />
                        <span className="text-slate-200 text-xs">{row.name}</span>
                      </div>
                    </td>
                    {[
                      { val: row.debtRatio, suffix: '٪', warn: (v: number) => v > 65, good: (v: number) => v < 50 },
                      { val: row.currentRatio, suffix: '', warn: (v: number) => v < 1.2, good: (v: number) => v > 2 },
                      { val: row.roe, suffix: '٪', warn: (v: number) => v < 5, good: (v: number) => v > 15 },
                      { val: row.roa, suffix: '٪', warn: (v: number) => v < 3, good: (v: number) => v > 8 },
                      { val: row.margin, suffix: '٪', warn: (v: number) => v < 5, good: (v: number) => v > 15 },
                    ].map(({ val, suffix, warn, good }, j) => (
                      <td key={j} className="py-2.5 px-3 text-center">
                        <span className={`text-xs font-mono font-medium px-2 py-0.5 rounded ${
                          warn(val) ? 'text-rose-400 bg-rose-500/10' :
                          good(val) ? 'text-emerald-400 bg-emerald-500/10' :
                          'text-slate-300'
                        }`}>
                          {val}{suffix}
                        </span>
                      </td>
                    ))}
                    <td className="py-2.5 px-3 text-center">
                      <span className={`text-xs font-mono font-bold ${
                        sub.altmanZ.zScore > 2.99 ? 'text-emerald-400' :
                        sub.altmanZ.zScore > 1.81 ? 'text-amber-400' : 'text-rose-400'
                      }`}>{sub.altmanZ.zScore}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="flex items-center gap-4 mt-3 text-xs">
          <div className="flex items-center gap-1.5"><span className="w-3 h-1.5 rounded bg-rose-500/60 inline-block" />هشدار</div>
          <div className="flex items-center gap-1.5"><span className="w-3 h-1.5 rounded bg-emerald-500/60 inline-block" />مطلوب</div>
          <div className="flex items-center gap-1.5"><span className="w-3 h-1.5 rounded bg-slate-500/40 inline-block" />عادی</div>
        </div>
      </div>

      {/* Section 3: Scatter + P&L */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scatter ROE vs Debt */}
        <div className="glass rounded-2xl p-5 card-glow">
          <h3 className="text-sm font-semibold text-white mb-1">بازده در برابر ریسک</h3>
          <p className="text-xs text-slate-500 mb-4">بازده حقوق صاحبان سهام (ROE) در برابر نسبت بدهی</p>
          <ResponsiveContainer width="100%" height={240}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="x" name="نسبت بدهی" type="number" unit="٪" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} label={{ value: 'نسبت بدهی ٪', position: 'bottom', fill: '#64748b', fontSize: 10 }} />
              <YAxis dataKey="y" name="ROE" type="number" unit="٪" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} />
              <Tooltip
                cursor={{ strokeDasharray: '3 3' }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0].payload;
                  return (
                    <div className="glass-strong rounded-xl p-3 text-xs border border-white/10">
                      <p className="text-white font-medium">{d.name}</p>
                      <p className="text-slate-400">بدهی: {d.x}٪</p>
                      <p className="text-slate-400">ROE: {d.y}٪</p>
                    </div>
                  );
                }}
              />
              <ReferenceLine x={65} stroke="#ff3d6e" strokeDasharray="4 4" label={{ value: 'آستانه بدهی', fill: '#ff3d6e', fontSize: 9 }} />
              <Scatter data={scatterData} fill="#3d52ff">
                {scatterData.map((entry, i) => (
                  <cell key={i} fill={entry.color} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        {/* Consolidated P&L */}
        <div className="glass rounded-2xl p-5 card-glow">
          <h3 className="text-sm font-semibold text-white mb-1">صورت سود و زیان تلفیقی</h3>
          <p className="text-xs text-slate-500 mb-4">گروه سرمایه‌گذاری — سال ۱۴۰۲ (میلیون تومان)</p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={plData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
              <XAxis type="number" tick={{ fill: '#64748b', fontSize: 9 }} axisLine={false} tickLine={false} />
              <YAxis dataKey="name" type="category" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} width={90} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" name="مقدار" radius={[0, 4, 4, 0]}>
                {plData.map((entry, i) => (
                  <cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
