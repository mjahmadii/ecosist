'use client';
import { useState } from 'react';
import {
  LineChart, Line, BarChart, Bar, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, ComposedChart, Area,
} from 'recharts';
import { TrendingUp, BarChart3, Activity, Filter, Brain, Loader, TrendingDown } from 'lucide-react';
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

async function callAIFinance(prompt: string, system: string, provider: string, apiKey: string, model: string): Promise<string> {
  if (!apiKey) throw new Error('no-key');
  if (provider === 'openai') {
    const r = await fetch('https://api.openai.com/v1/chat/completions', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` }, body: JSON.stringify({ model: model || 'gpt-4o', messages: [{ role: 'system', content: system }, { role: 'user', content: prompt }], max_tokens: 1400 }) });
    return (await r.json()).choices?.[0]?.message?.content ?? '';
  } else if (provider === 'anthropic') {
    const r = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' }, body: JSON.stringify({ model: model || 'claude-opus-4-5', max_tokens: 1400, system, messages: [{ role: 'user', content: prompt }] }) });
    return (await r.json()).content?.[0]?.text ?? '';
  } else {
    const m = model || 'gemini-2.0-flash';
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${apiKey}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ system_instruction: { parts: [{ text: system }] }, contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: { maxOutputTokens: 1400 } }) });
    return (await r.json()).candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  }
}

export default function FinancialAnalysis() {
  const { holdingData, settings } = useAppStore();
  const [selectedSubs, setSelectedSubs] = useState<string[]>([]);
  const [forecastResult, setForecastResult] = useState('');
  const [forecastLoading, setForecastLoading] = useState(false);
  const [commentaryResult, setCommentaryResult] = useState('');
  const [commentaryLoading, setCommentaryLoading] = useState(false);

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

  const handleForecast = async () => {
    setForecastLoading(true); setForecastResult('');
    const system = 'شما یک تحلیلگر مالی ارشد با تخصص در پیش‌بینی مالی هستید. خروجی به فارسی.';
    const prompt = `بر اساس داده‌های مالی ۳ سال گذشته، پیش‌بینی مالی سال آینده (۱۴۰۳) گروه را ارائه بده:

شرکت‌ها:
${subsidiaries.map(s => {
  const fin = s.financials;
  return `${s.name}: درآمد ${fin.map(f => (f.revenue/1000).toFixed(0)).join('→')} م.م.ت | ROE ${calcROE(s)}٪ | حاشیه سود ${calcNetMargin(s)}٪ | امتیاز ${s.financialScore}`;
}).join('\n')}

لطفاً:
۱. پیش‌بینی رشد درآمد گروه در ۱۴۰۳
۲. شرکت‌هایی که احتمال بهبود عملکرد دارند
۳. شرکت‌هایی که نیاز به توجه ویژه دارند
۴. ریسک‌های کلیدی پیش‌بینی`;
    try {
      setForecastResult(await callAIFinance(prompt, system, settings.aiProvider, settings.apiKey ?? '', settings.aiModel ?? 'gemini-2.0-flash'));
    } catch {
      const topSub = [...subsidiaries].sort((a, b) => b.financialScore - a.financialScore)[0];
      const bottomSub = [...subsidiaries].sort((a, b) => a.financialScore - b.financialScore)[0];
      setForecastResult(`📈 پیش‌بینی مالی ۱۴۰۳ (آفلاین)

رشد کل گروه: پیش‌بینی رشد ۱۲-۱۸٪ در درآمد تجمیعی

✅ بالاترین پتانسیل رشد:
• ${topSub?.name ?? '—'}: امتیاز مالی ${topSub?.financialScore ?? '—'} — انتظار رشد ۲۰٪+
• صنایع فناوری و پتروشیمی: رشد ۱۵-۲۵٪

⚠️ نیاز به توجه ویژه:
• ${bottomSub?.name ?? '—'}: امتیاز مالی ${bottomSub?.financialScore ?? '—'} — نیاز به برنامه بهبود
• شرکت‌های با حاشیه سود زیر ۵٪: خطر زیان عملیاتی

ریسک‌های کلیدی پیش‌بینی:
🔴 نوسان نرخ ارز: تأثیر ±۱۵٪ بر درآمد شرکت‌های وارداتی
🟡 تورم: افزایش هزینه‌های عملیاتی ۲۰-۳۰٪
🟢 فرصت: توسعه بازارهای صادراتی`);
    }
    setForecastLoading(false);
  };

  const handleFinancialCommentary = async () => {
    setCommentaryLoading(true); setCommentaryResult('');
    const system = 'شما مدیر ارشد مالی (CFO) یک هلدینگ بزرگ هستید. گزارش هیئت مدیره را به فارسی حرفه‌ای بنویس.';
    const prompt = `گزارش تحلیلی خلاصه برای هیئت مدیره در مورد وضعیت مالی فعلی گروه تهیه کن:

شاخص‌های کلیدی:
• میانگین ROE: ${avgROE.toFixed(1)}٪
• حاشیه سود: ${avgMargin.toFixed(1)}٪
• نسبت بدهی: ${avgDebt.toFixed(0)}٪
• میانگین درآمد: ${(avgRevenue/1000).toFixed(0)} میلیارد تومان

بهترین عملکرد: ${subsidiaries.sort((a,b) => b.financialScore - a.financialScore).slice(0,2).map(s => s.name).join(', ')}
ضعیف‌ترین عملکرد: ${subsidiaries.sort((a,b) => a.financialScore - b.financialScore).slice(0,2).map(s => s.name).join(', ')}

گزارش شامل: خلاصه اجرایی، نقاط قوت، نگرانی‌ها، و ۳ توصیه اصلی برای هیئت مدیره`;
    try {
      setCommentaryResult(await callAIFinance(prompt, system, settings.aiProvider, settings.apiKey ?? '', settings.aiModel ?? 'gemini-2.0-flash'));
    } catch {
      setCommentaryResult(`📊 گزارش هیئت مدیره — خلاصه اجرایی (آفلاین)

وضعیت کلی: ${avgROE > 15 ? '✅ مطلوب' : avgROE > 8 ? '🟡 متوسط' : '🔴 نیاز به بهبود'}
میانگین ROE ${avgROE.toFixed(1)}٪ در مقایسه با میانگین صنعت (۱۸٪) نشان‌دهنده ${avgROE > 18 ? 'عملکرد بالاتر از بازار' : 'فضای بهبود قابل‌توجه'} است.

نقاط قوت:
✅ تنوع صنعتی خوب در پرتفولیو
✅ شرکت‌های برتر با امتیاز مالی بالای ۷۵
✅ جریان نقدی عملیاتی مثبت در اکثر شرکت‌ها

نگرانی‌های اصلی:
⚠️ نسبت بدهی ${avgDebt.toFixed(0)}٪ ${avgDebt > 65 ? '— بالاتر از حد مطلوب' : '— در محدوده قابل قبول'}
⚠️ حاشیه سود ${avgMargin.toFixed(1)}٪ — نیاز به بهینه‌سازی هزینه‌ها
⚠️ شرکت‌های با امتیاز زیر ۵۰ نیاز به برنامه اصلاحی دارند

۳ توصیه اصلی برای هیئت مدیره:
۱️⃣ کاهش نسبت بدهی از طریق بازپرداخت وام‌های پرهزینه
۲️⃣ تمرکز سرمایه بر شرکت‌های با امتیاز بالا و رشد بالقوه بیشتر
۳️⃣ برنامه بهبود عملکرد برای ۲ شرکت با پایین‌ترین امتیاز مالی`);
    }
    setCommentaryLoading(false);
  };

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

      {/* AI Forecast */}
      <div className="card p-5" style={{ borderColor: 'rgba(61,82,255,0.2)' }}>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-brand-400" />
            <div>
              <h3 className="section-title">پیش‌بینی مالی هوشمند ۱۴۰۳</h3>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>تحلیل روند و پیش‌بینی عملکرد آینده شرکت‌ها</p>
            </div>
          </div>
          <button onClick={handleForecast} disabled={forecastLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
            style={{ background: 'rgba(61,82,255,0.12)', color: '#637bff', border: '1px solid rgba(61,82,255,0.25)' }}>
            {forecastLoading ? <Loader className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
            پیش‌بینی مالی
          </button>
        </div>
        {forecastLoading && <div className="flex items-center gap-3 p-4 rounded-xl" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
          <Loader className="w-4 h-4 animate-spin" style={{ color: '#637bff' }} /><span className="text-sm" style={{ color: 'var(--text-2)' }}>در حال پیش‌بینی...</span>
        </div>}
        {forecastResult && <div className="p-4 rounded-xl" style={{ background: 'rgba(61,82,255,0.06)', border: '1px solid rgba(61,82,255,0.2)' }}>
          <p className="text-xs font-bold mb-2" style={{ color: '#637bff' }}>پیش‌بینی مالی ۱۴۰۳</p>
          <div className="text-sm leading-relaxed whitespace-pre-line" style={{ color: 'var(--text-2)' }}>{forecastResult}</div>
        </div>}
      </div>

      {/* AI Financial Commentary */}
      <div className="card p-5" style={{ borderColor: 'rgba(139,92,246,0.2)' }}>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-violet-400" />
            <div>
              <h3 className="section-title">گزارش هیئت مدیره</h3>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>خلاصه اجرایی مالی برای تصمیم‌گیری هیئت مدیره</p>
            </div>
          </div>
          <button onClick={handleFinancialCommentary} disabled={commentaryLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
            style={{ background: 'rgba(139,92,246,0.12)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.25)' }}>
            {commentaryLoading ? <Loader className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
            تولید گزارش
          </button>
        </div>
        {commentaryLoading && <div className="flex items-center gap-3 p-4 rounded-xl" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
          <Loader className="w-4 h-4 animate-spin text-violet-400" /><span className="text-sm" style={{ color: 'var(--text-2)' }}>در حال نوشتن گزارش...</span>
        </div>}
        {commentaryResult && <div className="p-4 rounded-xl" style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.2)' }}>
          <p className="text-xs font-bold mb-2 text-violet-400">گزارش هیئت مدیره</p>
          <div className="text-sm leading-relaxed whitespace-pre-line" style={{ color: 'var(--text-2)' }}>{commentaryResult}</div>
        </div>}
      </div>

      <ContextChat moduleId="analysis" contextData={contextData} quickPrompts={QUICK_PROMPTS} title="دستیار تحلیل مالی" />
    </div>
  );
}
