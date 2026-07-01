'use client';
import { useState, useCallback } from 'react';
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, RadarChart, PolarGrid, PolarAngleAxis, Radar,
  BarChart, Bar, Legend, LineChart, Line,
} from 'recharts';
import {
  TrendingUp, Zap, Target, GitMerge, ArrowUpRight, Sparkles, Brain,
  ChevronDown, RefreshCw, CheckCircle, AlertTriangle, Loader, FileText, Table, FileSpreadsheet,
} from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import KPICard from '@/components/dashboard/KPICard';
import ContextChat from '@/components/ui/ContextChat';
import ExportMenu from '@/components/ui/ExportMenu';
import { exportPortfolioExcel, exportSubsidiariesToCSV, exportToPDF } from '@/utils';

const QUICK_PROMPTS = [
  'بهترین گزینه ادغام را پیشنهاد بده',
  'استراتژی خروج از سرمایه‌گذاری‌های ضعیف',
  'ریسک‌های هم‌افزایی M&A را بررسی کن',
  'پرتفوی بهینه برای ۵ سال آینده',
];

// Local AI call that respects provider
async function callAI(prompt: string, systemPrompt: string, apiKey: string, provider: string, model: string): Promise<string> {
  if (!apiKey || apiKey === 'demo-mode') return '';

  if (provider === 'openai') {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: model || 'gpt-4o',
        messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: prompt }],
        max_tokens: 1200,
      }),
    });
    const data = await res.json();
    return data.choices?.[0]?.message?.content ?? '';
  }

  if (provider === 'anthropic') {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: model || 'claude-opus-4-8',
        max_tokens: 1200,
        system: systemPrompt,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    const data = await res.json();
    return data.content?.[0]?.text ?? '';
  }

  // Gemini
  const gModel = model || 'gemini-2.0-flash';
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${gModel}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 1200 },
      }),
    }
  );
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
}

// Generate local demo for M&A
function demoMASynergy(a: string, b: string): string {
  return `## 🔗 تحلیل هم‌افزایی ادغام: ${a} + ${b}

**خلاصه اجرایی:**
ادغام این دو شرکت می‌تواند هم‌افزایی قابل‌توجهی در ابعاد عملیاتی، مالی و بازاریابی ایجاد کند.

**هم‌افزایی‌های شناسایی‌شده:**
• **صرفه‌جویی در هزینه:** تخمین ۱۵-۲۰٪ کاهش هزینه‌های عمومی از طریق ادغام زیرساخت‌ها
• **تقویت درآمد:** دسترسی به بازارهای مکمل و افزایش سهم بازار مشترک
• **ظرفیت مالی:** بهبود نسبت بدهی از طریق ترکیب جریان نقدی

**ریسک‌های ادغام:**
• ریسک فرهنگ سازمانی: میانگین ۳۰٪ ادغام‌ها به دلیل تفاوت فرهنگی با شکست مواجه می‌شوند
• پیچیدگی انتقال سیستم‌های IT
• احتمال خروج نیروهای کلیدی در فاز انتقال

**توصیه:** این ادغام در صورت مدیریت صحیح فرآیند، می‌تواند ارزش‌افزوده معناداری برای گروه ایجاد کند.`;
}

function demoPortfolioOpt(names: string[]): string {
  return `## 📊 استراتژی بهینه‌سازی پرتفوی

**تحلیل وضع موجود:**
پرتفوی گروه شامل ${names.length} شرکت تابعه با پراکندگی مناسب صنعتی است.

**استراتژی پیشنهادی — افق ۵ ساله:**

**افزایش سرمایه (Buy & Build):**
${names.slice(0, 2).map(n => `• **${n}:** پتانسیل رشد بالا، پیشنهاد افزایش مالکیت تا ۱۰٪`).join('\n')}

**نگهداری (Hold):**
${names.slice(2, 5).map(n => `• **${n}:** عملکرد پایدار، حفظ وضع موجود`).join('\n')}

**بررسی خروج (Review/Divest):**
${names.slice(5).map(n => `• **${n}:** ارزیابی مجدد در افق ۱۸ ماهه`).join('\n')}

**اثر پیش‌بینی‌شده:** بهبود ۱۲-۱۸٪ بازده پرتفوی در افق ۵ ساله`;
}

function AIResultDisplay({ content }: { content: string }) {
  const lines = content.split('\n');
  return (
    <div className="text-sm leading-7 space-y-1" style={{ color: 'var(--text-1)' }}>
      {lines.map((line, i) => {
        if (line.startsWith('## ')) return <h3 key={i} className="font-bold text-base mt-2" style={{ color: 'var(--text-1)' }}>{line.replace('## ','')}</h3>;
        if (line.startsWith('**') && line.endsWith('**')) return <p key={i} className="font-semibold mt-2" style={{ color: 'var(--text-1)' }}>{line.replace(/\*\*/g,'')}</p>;
        const parts = line.split(/(\*\*[^*]+\*\*)/g);
        return <p key={i}>{parts.map((p,j) => p.startsWith('**') ? <strong key={j}>{p.replace(/\*\*/g,'')}</strong> : p)}</p>;
      })}
    </div>
  );
}

export default function StrategicView() {
  const { holdingData, apiKey, aiProvider, settings } = useAppStore();
  const [selectedA, setSelectedA] = useState('');
  const [selectedB, setSelectedB] = useState('');
  const [maResult, setMaResult] = useState('');
  const [maLoading, setMaLoading] = useState(false);
  const [optResult, setOptResult] = useState('');
  const [optLoading, setOptLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'scatter' | 'ma' | 'optimize'>('scatter');

  if (!holdingData) return <div className="p-6 text-center py-20" style={{ color: 'var(--text-3)' }}>داده‌ای موجود نیست</div>;

  const { subsidiaries } = holdingData;

  // Scatter: x=riskScore(lower=better), y=governanceScore
  const scatterData = subsidiaries.map((s) => ({
    x: s.altmanZ.bankruptcyProbability,
    y: s.governanceScore,
    name: s.name.split(' ').slice(0,2).join(' '),
    overall: s.overallScore,
    sector: s.sector,
  }));

  // Radar: compare selected pair
  const radarKeys = ['financialScore', 'governanceScore', 'overallScore'];
  const radarLabels = { financialScore: 'مالی', governanceScore: 'حاکمیتی', overallScore: 'کلی' };
  const radarData = radarKeys.map((k) => {
    const d: Record<string, unknown> = { subject: radarLabels[k as keyof typeof radarLabels] };
    if (selectedA) { const s = subsidiaries.find((x) => x.id === selectedA); if (s) d['شرکت الف'] = s[k as keyof typeof s] as number; }
    if (selectedB) { const s = subsidiaries.find((x) => x.id === selectedB); if (s) d['شرکت ب'] = s[k as keyof typeof s] as number; }
    return d;
  });

  const totalAssets = subsidiaries.reduce((a, s) => a + s.financials[s.financials.length - 1].totalAssets, 0);
  const avgScore = subsidiaries.reduce((a, s) => a + s.overallScore, 0) / subsidiaries.length;
  const topPerformers = subsidiaries.filter((s) => s.overallScore >= 75).length;
  const divCandidates = subsidiaries.filter((s) => s.overallScore < 60 || s.altmanZ.bankruptcyProbability > 35).length;

  const systemPrompt = `شما یک استراتژیست ارشد M&A و مشاور سرمایه‌گذاری برای گروه هلدینگ ${holdingData.name} هستید.
پاسخ‌ها را به فارسی، دقیق و با قالب‌بندی مناسب ارائه دهید. از اعداد و تحلیل کمی استفاده کنید.`;

  const handleMASynergy = async () => {
    if (!selectedA || !selectedB) return;
    const subA = subsidiaries.find((s) => s.id === selectedA);
    const subB = subsidiaries.find((s) => s.id === selectedB);
    if (!subA || !subB) return;
    setMaLoading(true);
    setMaResult('');
    try {
      const prompt = `تحلیل هم‌افزایی ادغام دو شرکت زیر را ارائه دهید:
شرکت الف: ${subA.name} — امتیاز کلی ${subA.overallScore} — بخش ${subA.sector} — احتمال ورشکستگی ${subA.altmanZ.bankruptcyProbability}٪
شرکت ب: ${subB.name} — امتیاز کلی ${subB.overallScore} — بخش ${subB.sector} — احتمال ورشکستگی ${subB.altmanZ.bankruptcyProbability}٪
شامل: هم‌افزایی‌ها، ریسک‌ها، ارزش پیشنهادی و توصیه نهایی`;
      const res = await callAI(prompt, systemPrompt, apiKey, aiProvider, settings.aiModel);
      setMaResult(res || demoMASynergy(subA.name, subB.name));
    } catch {
      setMaResult(demoMASynergy(subA?.name ?? '', subB?.name ?? ''));
    }
    setMaLoading(false);
  };

  const handleOptimize = async () => {
    setOptLoading(true);
    setOptResult('');
    try {
      const summaryData = subsidiaries.map((s) => `${s.name}: امتیاز ${s.overallScore}, ریسک ${s.altmanZ.bankruptcyProbability}٪, ESG ${s.esg.overallScore}`).join('\n');
      const prompt = `استراتژی بهینه‌سازی پرتفوی شرکت‌های زیر را ارائه دهید:\n${summaryData}\n
شامل: پیشنهاد افزایش سرمایه، نگهداری، و بررسی خروج برای هر شرکت با دلایل کمی`;
      const res = await callAI(prompt, systemPrompt, apiKey, aiProvider, settings.aiModel);
      setOptResult(res || demoPortfolioOpt(subsidiaries.map((s) => s.name)));
    } catch {
      setOptResult(demoPortfolioOpt(subsidiaries.map((s) => s.name)));
    }
    setOptLoading(false);
  };

  const COLORS = ['#3d52ff','#00c48c','#f43f5e','#f59e0b','#8b5cf6','#06b6d4','#10b981','#6366f1'];

  const contextData = `استراتژی پرتفوی ${holdingData.name} | ${subsidiaries.length} شرکت | مجموع دارایی: ${(totalAssets/1e12).toFixed(1)} هزار میلیارد | میانگین امتیاز: ${avgScore.toFixed(1)} | برترین‌ها: ${topPerformers} | نیاز به بررسی: ${divCandidates}`;

  return (
    <div className="p-5 space-y-5 animate-fade-in" id="strategic-content">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="section-title">پرتفوی استراتژیک و M&A</h2>
          <p className="section-subtitle">تحلیل هوشمند ادغام، تملک و بهینه‌سازی سبد دارایی</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="highlight-pill"><Sparkles className="w-3 h-3" />هوش مصنوعی فعال</span>
          <ExportMenu
            options={[
              { label: 'Excel', format: 'xlsx', icon: FileSpreadsheet, color: '#34d399', action: () => exportPortfolioExcel(holdingData) },
              { label: 'CSV', format: 'csv', icon: Table, color: '#22d3ee', action: () => exportSubsidiariesToCSV(subsidiaries) },
              { label: 'PDF', format: 'pdf', icon: FileText, color: '#a78bfa', action: () => exportToPDF('strategic-content', 'گزارش_استراتژی') },
            ]}
          />
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="مجموع دارایی‌ها" value={(totalAssets/1e12).toFixed(1)} suffix="هزار میلیارد"
          icon={TrendingUp} color="brand" change={8.3} subtitle="ارزش کل پرتفوی" />
        <KPICard title="میانگین امتیاز کلی" value={avgScore.toFixed(0)} suffix="/۱۰۰"
          icon={Target} color="emerald" change={2.4} subtitle="سلامت کلی گروه" />
        <KPICard title="شرکت‌های برتر" value={topPerformers} suffix="شرکت"
          icon={ArrowUpRight} color="cyan" subtitle="امتیاز بالای ۷۵" />
        <KPICard title="نیاز به بررسی استراتژیک" value={divCandidates} suffix="شرکت"
          icon={AlertTriangle} color={divCandidates > 0 ? 'rose' : 'emerald'} subtitle="امتیاز زیر ۶۰ یا ریسک بالا" />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 rounded-xl" style={{ background: 'var(--surface-2)', width: 'fit-content' }}>
        {[
          { id: 'scatter', label: '📊 ماتریس ریسک-سلامت' },
          { id: 'ma', label: '🔗 شبیه‌ساز M&A' },
          { id: 'optimize', label: '🎯 بهینه‌سازی پرتفوی' },
        ].map((t) => (
          <button key={t.id} onClick={() => setActiveTab(t.id as typeof activeTab)}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={activeTab === t.id
              ? { background: 'var(--surface-active)', color: '#637bff', border: '1px solid rgba(99,123,255,0.2)' }
              : { color: 'var(--text-2)', background: 'transparent', border: '1px solid transparent' }}>
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'scatter' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-fade-in">
          {/* Scatter chart */}
          <div className="card p-5">
            <h3 className="section-title mb-1">ماتریس ریسک–حاکمیت</h3>
            <p className="section-subtitle mb-4">محور X: احتمال ورشکستگی | محور Y: امتیاز حاکمیتی</p>
            <ResponsiveContainer width="100%" height={280}>
              <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="x" name="ریسک ٪" type="number" domain={[0, 60]} tick={{ fontSize: 10 }}
                  label={{ value: 'احتمال ورشکستگی (٪)', position: 'insideBottom', offset: -5, fontSize: 10, fill: 'var(--text-3)' }} />
                <YAxis dataKey="y" name="حاکمیت" type="number" domain={[40, 100]} tick={{ fontSize: 10 }}
                  label={{ value: 'حاکمیت', angle: 90, position: 'insideLeft', fontSize: 10, fill: 'var(--text-3)' }} />
                <Tooltip content={({ payload }) => payload?.[0] ? (
                  <div className="p-3 rounded-xl text-xs" style={{ background: 'var(--tooltip-bg)', border: '1px solid var(--border-2)', minWidth: 160 }}>
                    <p className="font-bold mb-1" style={{ color: 'var(--text-1)' }}>{(payload[0].payload as {name:string}).name}</p>
                    <p style={{ color: 'var(--text-2)' }}>ریسک: {(payload[0].payload as {x:number}).x}٪</p>
                    <p style={{ color: 'var(--text-2)' }}>حاکمیت: {(payload[0].payload as {y:number}).y}</p>
                    <p style={{ color: 'var(--text-2)' }}>امتیاز کلی: {(payload[0].payload as {overall:number}).overall}</p>
                  </div>
                ) : null} />
                <Scatter data={scatterData}>
                  {scatterData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} fillOpacity={0.85} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
            {/* Legend */}
            <div className="flex flex-wrap gap-2 mt-3">
              {scatterData.map((d, i) => (
                <div key={i} className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-2)' }}>
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                  {d.name}
                </div>
              ))}
            </div>
          </div>

          {/* Bar sorted by overall */}
          <div className="card p-5">
            <h3 className="section-title mb-1">رتبه‌بندی عملکرد کلی</h3>
            <p className="section-subtitle mb-4">مقایسه امتیاز کلی شرکت‌های تابعه</p>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={[...subsidiaries].sort((a,b) => b.overallScore - a.overallScore).map((s) => ({
                  name: s.name.split(' ').slice(0,2).join(' '),
                  امتیاز: s.overallScore,
                  ریسک: s.altmanZ.bankruptcyProbability,
                }))}
                barSize={14}
                margin={{ top: 10, right: 10, bottom: 30, left: -15 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-25} textAnchor="end" />
                <YAxis domain={[0,100]} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="امتیاز" radius={[5,5,0,0]}>
                  {[...subsidiaries].sort((a,b) => b.overallScore - a.overallScore).map((s,i) => (
                    <Cell key={i} fill={s.overallScore >= 75 ? '#00c48c' : s.overallScore >= 60 ? '#f59e0b' : '#f43f5e'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {activeTab === 'ma' && (
        <div className="space-y-4 animate-fade-in">
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(61,82,255,0.2), rgba(0,212,255,0.15))', border: '1px solid rgba(61,82,255,0.25)' }}>
                <GitMerge className="w-4 h-4" style={{ color: '#637bff' }} />
              </div>
              <div>
                <h3 className="section-title">شبیه‌ساز هوشمند ادغام و تملک</h3>
                <p className="section-subtitle">تحلیل هم‌افزایی ادغام دو شرکت تابعه توسط هوش مصنوعی</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-xs font-semibold mb-2 block" style={{ color: 'var(--text-2)' }}>شرکت الف (اول)</label>
                <select value={selectedA} onChange={(e) => setSelectedA(e.target.value)} className="inp">
                  <option value="">انتخاب کنید...</option>
                  {subsidiaries.filter((s) => s.id !== selectedB).map((s) => (
                    <option key={s.id} value={s.id}>{s.name} (امتیاز {s.overallScore})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold mb-2 block" style={{ color: 'var(--text-2)' }}>شرکت ب (دوم)</label>
                <select value={selectedB} onChange={(e) => setSelectedB(e.target.value)} className="inp">
                  <option value="">انتخاب کنید...</option>
                  {subsidiaries.filter((s) => s.id !== selectedA).map((s) => (
                    <option key={s.id} value={s.id}>{s.name} (امتیاز {s.overallScore})</option>
                  ))}
                </select>
              </div>
            </div>

            {selectedA && selectedB && (
              <div className="mb-4">
                <ResponsiveContainer width="100%" height={200}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="var(--chart-grid)" />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: 'var(--text-3)' }} />
                    <Radar dataKey="شرکت الف" stroke="#3d52ff" fill="#3d52ff" fillOpacity={0.2} strokeWidth={2} />
                    <Radar dataKey="شرکت ب" stroke="#00c48c" fill="#00c48c" fillOpacity={0.2} strokeWidth={2} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            )}

            <button
              onClick={handleMASynergy}
              disabled={!selectedA || !selectedB || maLoading}
              className="btn btn-primary w-full"
            >
              {maLoading ? (
                <><Loader className="w-4 h-4 animate-spin" /> در حال تحلیل هم‌افزایی...</>
              ) : (
                <><Brain className="w-4 h-4" /> تحلیل هوشمند هم‌افزایی M&A</>
              )}
            </button>
          </div>

          {maResult && (
            <div className="ai-result-card animate-slide-up">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4" style={{ color: '#637bff' }} />
                <span className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>تحلیل هوش مصنوعی</span>
              </div>
              <AIResultDisplay content={maResult} />
            </div>
          )}
        </div>
      )}

      {activeTab === 'optimize' && (
        <div className="space-y-4 animate-fade-in">
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(0,196,140,0.2), rgba(61,82,255,0.15))', border: '1px solid rgba(0,196,140,0.25)' }}>
                <Target className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <h3 className="section-title">توصیه‌ساز بهینه‌سازی سبد دارایی</h3>
                <p className="section-subtitle">استراتژی‌های خروج، نگهداری و افزایش سرمایه توسط هوش مصنوعی</p>
              </div>
            </div>

            {/* Quick matrix */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              {[
                { label: 'Buy & Build', color: '#00c48c', bg: 'rgba(0,196,140,0.08)', border: 'rgba(0,196,140,0.2)', items: subsidiaries.filter((s) => s.overallScore >= 75) },
                { label: 'Hold & Monitor', color: '#3d52ff', bg: 'rgba(61,82,255,0.08)', border: 'rgba(61,82,255,0.2)', items: subsidiaries.filter((s) => s.overallScore >= 60 && s.overallScore < 75) },
                { label: 'Review/Divest', color: '#f43f5e', bg: 'rgba(244,63,94,0.08)', border: 'rgba(244,63,94,0.2)', items: subsidiaries.filter((s) => s.overallScore < 60) },
              ].map(({ label, color, bg, border, items }) => (
                <div key={label} className="p-4 rounded-14" style={{ background: bg, border: `1px solid ${border}`, borderRadius: 14 }}>
                  <p className="text-xs font-bold mb-3" style={{ color }}>{label}</p>
                  <div className="space-y-1.5">
                    {items.length === 0
                      ? <p className="text-xs" style={{ color: 'var(--text-3)' }}>—</p>
                      : items.map((s) => (
                        <div key={s.id} className="flex items-center justify-between">
                          <span className="text-xs" style={{ color: 'var(--text-1)' }}>{s.name.split(' ').slice(0,2).join(' ')}</span>
                          <span className="text-xs font-bold" style={{ color }}>{s.overallScore}</span>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleOptimize}
              disabled={optLoading}
              className="btn btn-primary w-full"
            >
              {optLoading ? (
                <><Loader className="w-4 h-4 animate-spin" /> در حال تدوین استراتژی...</>
              ) : (
                <><Zap className="w-4 h-4" /> تولید استراتژی بهینه‌سازی هوشمند</>
              )}
            </button>
          </div>

          {optResult && (
            <div className="ai-result-card animate-slide-up">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4" style={{ color: '#637bff' }} />
                <span className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>استراتژی هوش مصنوعی</span>
              </div>
              <AIResultDisplay content={optResult} />
            </div>
          )}
        </div>
      )}

      <ContextChat moduleId="strategic" contextData={contextData} quickPrompts={QUICK_PROMPTS} title="مشاور استراتژیک M&A" />
    </div>
  );
}
