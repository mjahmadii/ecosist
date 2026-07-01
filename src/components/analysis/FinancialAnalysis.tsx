'use client';
import { useState } from 'react';
import {
  LineChart, Line, BarChart, Bar, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, ComposedChart, Area,
} from 'recharts';
import { TrendingUp, BarChart3, Activity, Filter } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import KPICard from '@/components/dashboard/KPICard';
import ContextChat from '@/components/ui/ContextChat';
import ExportMenu from '@/components/ui/ExportMenu';
import { FileSpreadsheet, FileText, Table } from 'lucide-react';
import { exportPortfolioExcel, exportSubsidiariesToCSV, exportToPDF } from '@/utils';
import { calcDebtRatio, calcCurrentRatio, calcROE, calcROA, calcNetMargin, getSectorColor } from '@/utils';

const QUICK_PROMPTS = [
  'کدام شرکت‌ها بهترین عملکرد مالی دارند؟',
  'تحلیل نسبت‌های مالی گروه',
  'روند درآمدی سه سال گذشته را بررسی کن',
  'پیشنهاد بهبود سودآوری بده',
];

const RATIO_COLORS = ['#3d52ff', '#00c48c', '#f59e0b', '#8b5cf6', '#f43f5e', '#22d3ee', '#10b981', '#fbbf24'];

export default function FinancialAnalysis() {
  const { holdingData } = useAppStore();
  const [selectedSubs, setSelectedSubs] = useState<string[]>([]);

  if (!holdingData) return <div className="p-6 text-center py-20" style={{ color: 'var(--text-3)' }}>داده‌ای موجود نیست</div>;

  const { subsidiaries } = holdingData;
  const toggleSub = (id: string) => setSelectedSubs((prev) =>
    prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
  );
  const activeSubs = selectedSubs.length > 0 ? subsidiaries.filter((s) => selectedSubs.includes(s.id)) : subsidiaries.slice(0, 4);

  // Multi-year trend data
  const years = [1400, 1401, 1402];
  const trendData = years.map((year) => {
    const row: Record<string, number | string> = { year: String(year) };
    activeSubs.forEach((s) => {
      const fin = s.financials.find((f) => f.year === year);
      if (fin) row[s.name.split(' ')[0]] = Math.round(fin.revenue / 1000);
    });
    return row;
  });

  // Ratio heatmap
  const ratioData = subsidiaries.map((s) => ({
    name: s.name.split(' ').slice(0, 2).join(' '),
    'نسبت بدهی': calcDebtRatio(s),
    'نسبت جاری': calcCurrentRatio(s) * 10,
    'ROE': calcROE(s),
    'ROA': calcROA(s),
    'حاشیه سود': calcNetMargin(s),
    'امتیاز مالی': s.financialScore,
  }));

  // ROE vs Debt scatter
  const scatterData = subsidiaries.map((s) => ({
    x: calcDebtRatio(s),
    y: calcROE(s),
    name: s.name,
    fill: getSectorColor(s.sector),
  }));

  const avgRevenue = subsidiaries.reduce((a, s) => a + s.financials[s.financials.length - 1].revenue, 0) / subsidiaries.length;
  const avgROE = subsidiaries.reduce((a, s) => a + calcROE(s), 0) / subsidiaries.length;
  const avgMargin = subsidiaries.reduce((a, s) => a + calcNetMargin(s), 0) / subsidiaries.length;
  const avgDebt = subsidiaries.reduce((a, s) => a + calcDebtRatio(s), 0) / subsidiaries.length;

  const contextData = `تحلیل مالی گروه
میانگین ROE: ${avgROE.toFixed(1)}٪ | حاشیه سود: ${avgMargin.toFixed(1)}٪ | نسبت بدهی: ${avgDebt.toFixed(1)}٪
${subsidiaries.map((s) => `${s.name}: ROE=${calcROE(s)}% | حاشیه=${calcNetMargin(s)}% | بدهی=${calcDebtRatio(s)}%`).join('\n')}`;

  return (
    <div className="p-5 space-y-5 animate-fade-in" id="financial-content">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="section-title">تحلیل مالی پیشرفته</h2>
          <p className="section-subtitle">بررسی نسبت‌های مالی، روند درآمدی و مقایسه عملکرد شرکت‌های تابعه</p>
        </div>
        <ExportMenu
          options={[
            { label: 'گزارش Excel', format: 'xlsx', icon: FileSpreadsheet, color: '#3d52ff', action: () => exportPortfolioExcel(holdingData) },
            { label: 'CSV', format: 'csv', icon: Table, color: '#22d3ee', action: () => exportSubsidiariesToCSV(subsidiaries) },
            { label: 'PDF', format: 'pdf', icon: FileText, color: '#a78bfa', action: () => exportToPDF('financial-content', 'گزارش_مالی') },
          ]}
        />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="میانگین ROE" value={avgROE.toFixed(1)} suffix="٪" icon={TrendingUp} color="brand" change={4.2} subtitle="بازده حقوق صاحبان سهام" />
        <KPICard title="حاشیه سود" value={avgMargin.toFixed(1)} suffix="٪" icon={Activity} color="emerald" change={1.8} subtitle="میانگین حاشیه خالص" />
        <KPICard title="نسبت بدهی" value={avgDebt.toFixed(0)} suffix="٪" icon={BarChart3} color={avgDebt > 65 ? 'rose' : 'amber'} subtitle="میانگین اهرم مالی" />
        <KPICard title="درآمد میانگین" value={(avgRevenue / 1000).toFixed(0)} suffix="م.ت" icon={TrendingUp} color="cyan" change={8.5} subtitle="میانگین درآمد شرکت‌ها" />
      </div>

      {/* Company selector */}
      <div className="card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4" style={{ color: 'var(--text-3)' }} />
          <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>فیلتر شرکت‌ها برای نمودار روند</p>
          {selectedSubs.length > 0 && (
            <button onClick={() => setSelectedSubs([])} className="btn btn-ghost btn-sm mr-auto">
              پاک کردن فیلتر
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {subsidiaries.map((s, i) => {
            const isSelected = selectedSubs.includes(s.id) || (selectedSubs.length === 0 && i < 4);
            return (
              <button key={s.id} onClick={() => toggleSub(s.id)}
                className="text-xs px-3 py-1.5 rounded-full transition-all"
                style={isSelected
                  ? { background: `${RATIO_COLORS[i % RATIO_COLORS.length]}20`, color: RATIO_COLORS[i % RATIO_COLORS.length], border: `1px solid ${RATIO_COLORS[i % RATIO_COLORS.length]}40` }
                  : { background: 'var(--surface-2)', color: 'var(--text-3)', border: '1px solid var(--border)' }}>
                {s.name.split(' ').slice(0, 2).join(' ')}
              </button>
            );
          })}
        </div>
      </div>

      {/* Revenue trend */}
      <div className="card p-5">
        <h3 className="section-title mb-1">روند درآمد شرکت‌های منتخب</h3>
        <p className="section-subtitle mb-5">مقایسه درآمد سالانه (میلیارد تومان)</p>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="year" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            {activeSubs.map((s, i) => (
              <Line key={s.id} type="monotone" dataKey={s.name.split(' ')[0]}
                stroke={RATIO_COLORS[i % RATIO_COLORS.length]} strokeWidth={2.5}
                dot={{ r: 4 }} activeDot={{ r: 6 }} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Ratio table */}
      <div className="card p-5">
        <h3 className="section-title mb-4">جدول نسبت‌های مالی کلیدی</h3>
        <div className="overflow-x-auto">
          <table className="tbl">
            <thead>
              <tr>
                <th>شرکت</th>
                <th>نسبت بدهی (٪)</th>
                <th>نسبت جاری (x)</th>
                <th>ROE (٪)</th>
                <th>ROA (٪)</th>
                <th>حاشیه سود (٪)</th>
                <th>امتیاز مالی</th>
              </tr>
            </thead>
            <tbody>
              {subsidiaries.map((s) => {
                const debt = calcDebtRatio(s);
                const curr = calcCurrentRatio(s);
                const roe = calcROE(s);
                const roa = calcROA(s);
                const margin = calcNetMargin(s);
                const colorVal = (v: number, good: number, bad: number) =>
                  v >= good ? '#34d399' : v >= bad ? '#fbbf24' : '#fb7185';
                return (
                  <tr key={s.id}>
                    <td className="font-semibold" style={{ color: 'var(--text-1)', whiteSpace: 'nowrap' }}>{s.name}</td>
                    <td style={{ color: colorVal(100 - debt, 65, 35), fontWeight: 600 }}>{debt}٪</td>
                    <td style={{ color: colorVal(curr, 1.5, 1.0), fontWeight: 600 }}>{curr}x</td>
                    <td style={{ color: colorVal(roe, 15, 8), fontWeight: 600 }}>{roe}٪</td>
                    <td style={{ color: colorVal(roa, 8, 4), fontWeight: 600 }}>{roa}٪</td>
                    <td style={{ color: colorVal(margin, 12, 6), fontWeight: 600 }}>{margin}٪</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <span className="font-bold" style={{ color: s.financialScore >= 75 ? '#34d399' : s.financialScore >= 55 ? '#fbbf24' : '#fb7185' }}>
                          {s.financialScore}
                        </span>
                        <div className="score-track flex-1" style={{ minWidth: 60 }}>
                          <div className="score-fill" style={{ width: `${s.financialScore}%`, background: s.financialScore >= 75 ? '#34d399' : s.financialScore >= 55 ? '#fbbf24' : '#fb7185' }} />
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap gap-3 mt-3 text-xs" style={{ color: 'var(--text-3)' }}>
          <span><span className="inline-block w-2 h-2 rounded-full bg-emerald-400 mr-1" />خوب</span>
          <span><span className="inline-block w-2 h-2 rounded-full bg-amber-400 mr-1" />متوسط</span>
          <span><span className="inline-block w-2 h-2 rounded-full bg-rose-400 mr-1" />ضعیف</span>
        </div>
      </div>

      {/* ROE vs Debt scatter */}
      <div className="card p-5">
        <h3 className="section-title mb-1">نمودار ROE در برابر نسبت بدهی</h3>
        <p className="section-subtitle mb-5">تحلیل رابطه اهرم مالی و بازده</p>
        <ResponsiveContainer width="100%" height={260}>
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="x" name="نسبت بدهی" unit="٪" tick={{ fontSize: 11 }} label={{ value: 'نسبت بدهی (٪)', position: 'bottom', fontSize: 11 }} />
            <YAxis dataKey="y" name="ROE" unit="٪" tick={{ fontSize: 11 }} label={{ value: 'ROE (٪)', angle: -90, position: 'insideLeft', fontSize: 11 }} />
            <Tooltip cursor={{ strokeDasharray: '3 3' }}
              content={({ payload }) => payload?.[0] ? (
                <div className="p-3 rounded-xl text-xs" style={{ background: 'var(--modal-bg)', border: '1px solid var(--border-2)' }}>
                  <p className="font-bold mb-1" style={{ color: 'var(--text-1)' }}>{payload[0].payload.name}</p>
                  <p style={{ color: 'var(--text-2)' }}>نسبت بدهی: {payload[0].payload.x}٪</p>
                  <p style={{ color: 'var(--text-2)' }}>ROE: {payload[0].payload.y}٪</p>
                </div>
              ) : null}
            />
            <Scatter data={scatterData} name="شرکت‌ها">
              {scatterData.map((entry, i) => (
                <circle key={i} r={8} fill={entry.fill} opacity={0.85} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      <ContextChat moduleId="analysis" contextData={contextData} quickPrompts={QUICK_PROMPTS} title="دستیار تحلیل مالی" />
    </div>
  );
}
