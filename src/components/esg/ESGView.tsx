'use client';
import { useState } from 'react';
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { Leaf, Droplets, Wind, Users, Award, TrendingUp, Brain, Loader, Sparkles } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import KPICard from '@/components/dashboard/KPICard';
import ContextChat from '@/components/ui/ContextChat';
import ExportMenu from '@/components/ui/ExportMenu';
import { FileSpreadsheet, FileText, Table } from 'lucide-react';
import { exportPortfolioExcel, exportSubsidiariesToCSV, exportToPDF } from '@/utils';

async function callAIESG(prompt: string, system: string, provider: string, apiKey: string, model: string): Promise<string> {
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

const QUICK_PROMPTS = [
  'وضعیت ESG گروه را تحلیل کن',
  'مهم‌ترین فرصت‌های بهبود ESG',
  'ریسک‌های آب‌وهوایی شرکت‌ها',
  'مقایسه عملکرد ESG شرکت‌ها',
];

const ESG_RATINGS: Record<string, { color: string; bg: string; label: string }> = {
  AAA: { color: '#34d399', bg: 'rgba(0,196,140,0.12)', label: 'ممتاز' },
  AA:  { color: '#34d399', bg: 'rgba(0,196,140,0.10)', label: 'عالی' },
  A:   { color: '#22d3ee', bg: 'rgba(0,212,255,0.10)', label: 'خوب' },
  BBB: { color: '#fbbf24', bg: 'rgba(245,158,11,0.10)', label: 'متوسط' },
  BB:  { color: '#fbbf24', bg: 'rgba(245,158,11,0.10)', label: 'زیر متوسط' },
  B:   { color: '#fb7185', bg: 'rgba(244,63,94,0.10)', label: 'ضعیف' },
  CCC: { color: '#fb7185', bg: 'rgba(244,63,94,0.12)', label: 'بحرانی' },
};

function ScoreBar({ value, color = '#10b981' }: { value: number; color?: string }) {
  return (
    <div className="score-track">
      <div className="score-fill" style={{ width: `${value}%`, background: color }} />
    </div>
  );
}

export default function ESGView() {
  const { holdingData, settings } = useAppStore();
  const [planResult, setPlanResult] = useState('');
  const [planLoading, setPlanLoading] = useState(false);
  const [climateResult, setClimateResult] = useState('');
  const [climateLoading, setClimateLoading] = useState(false);
  if (!holdingData) return <div className="p-6 text-center py-20" style={{ color: 'var(--text-3)' }}>داده‌ای موجود نیست</div>;

  const { subsidiaries } = holdingData;
  const avgESG = subsidiaries.reduce((a, s) => a + s.esg.overallScore, 0) / subsidiaries.length;
  const avgEnv = subsidiaries.reduce((a, s) => a + (s.esg.environmental.carbonEmissions + s.esg.environmental.energyEfficiency + s.esg.environmental.wasteManagement) / 3, 0) / subsidiaries.length;
  const avgSocial = subsidiaries.reduce((a, s) => a + (s.esg.social.employeeSatisfaction + s.esg.social.communityInvestment) / 2, 0) / subsidiaries.length;
  const avgGov = subsidiaries.reduce((a, s) => a + (s.esg.governance.transparencyScore + s.esg.governance.anticorruptionMeasures) / 2, 0) / subsidiaries.length;

  const barData = subsidiaries.map((s) => ({
    name: s.name.split(' ').slice(0, 2).join(' '),
    'محیط‌زیست': Math.round((s.esg.environmental.carbonEmissions + s.esg.environmental.energyEfficiency + s.esg.environmental.wasteManagement) / 3),
    'اجتماعی': Math.round((s.esg.social.employeeSatisfaction + s.esg.social.communityInvestment) / 2),
    'حاکمیتی': Math.round((s.esg.governance.transparencyScore + s.esg.governance.anticorruptionMeasures) / 2),
  }));

  const radarData = [
    { subject: 'انتشار کربن', value: avgEnv },
    { subject: 'بهره‌وری انرژی', value: subsidiaries.reduce((a, s) => a + s.esg.environmental.energyEfficiency, 0) / subsidiaries.length },
    { subject: 'رضایت کارکنان', value: avgSocial },
    { subject: 'تنوع جنسیتی', value: subsidiaries.reduce((a, s) => a + s.esg.social.genderDiversityRatio, 0) / subsidiaries.length },
    { subject: 'شفافیت', value: avgGov },
    { subject: 'ضد فساد', value: subsidiaries.reduce((a, s) => a + s.esg.governance.anticorruptionMeasures, 0) / subsidiaries.length },
  ];

  const handleESGPlan = async () => {
    setPlanLoading(true); setPlanResult('');
    const system = 'شما یک مشاور ارشد ESG و پایداری شرکتی هستید. خروجی کامل به فارسی.';
    const weakSubs = [...subsidiaries].sort((a, b) => a.esg.overallScore - b.esg.overallScore).slice(0, 3);
    const prompt = `برنامه بهبود ESG ۱۲ ماهه برای گروه سرمایه‌گذاری با این وضعیت طراحی کن:
میانگین امتیاز ESG: ${avgESG.toFixed(1)}/۱۰۰
ضعیف‌ترین شرکت‌ها: ${weakSubs.map(s => `${s.name}(${s.esg.overallScore})`).join('، ')}
میانگین محیط‌زیست: ${avgEnv.toFixed(0)} | اجتماعی: ${avgSocial.toFixed(0)} | حاکمیت: ${avgGov.toFixed(0)}

برنامه جامع شامل:
۱. اهداف قابل سنجش هر سه ماه
۲. اقدامات کوتاه‌مدت (۱-۳ ماه) برای بهبود فوری
۳. پروژه‌های میان‌مدت (۳-۶ ماه) محیط‌زیستی و اجتماعی
۴. اهداف بلندمدت (۶-۱۲ ماه) برای ارتقاء رتبه
۵. شاخص‌های KPI برای پایش پیشرفت`;
    try {
      setPlanResult(await callAIESG(prompt, system, settings.aiProvider, settings.apiKey ?? '', settings.aiModel ?? 'gemini-2.0-flash'));
    } catch {
      setPlanResult(`📋 برنامه بهبود ESG ۱۲ ماهه (آفلاین)

فاز ۱ — ۱ تا ۳ ماه (اقدامات فوری):
✅ حسابرسی کامل ESG تمام شرکت‌های تابعه
✅ شناسایی بزرگترین منابع انتشار کربن
✅ آموزش مدیران میانی در حوزه پایداری
✅ KPI: کاهش ۵٪ مصرف انرژی

فاز ۲ — ۳ تا ۶ ماه (پروژه‌های محیط‌زیستی):
🌱 پیاده‌سازی سیستم جمع‌آوری داده‌های آب و انرژی
🌱 نصب پانل‌های خورشیدی در واحدهای بزرگ
🌱 برنامه بازیافت زباله صنعتی
🎯 KPI: کاهش ۱۰٪ انتشار کربن

فاز ۳ — ۶ تا ۱۲ ماه (ارتقاء رتبه):
⭐ اخذ گواهینامه ISO 14001
⭐ گزارش‌دهی ESG مطابق GRI Standards
⭐ هدف‌گذاری ۴۰٪ حضور زنان در مدیریت
🎯 هدف: ارتقاء امتیاز ESG به ${Math.min(100, avgESG + 12).toFixed(0)}/۱۰۰`);
    }
    setPlanLoading(false);
  };

  const handleClimateRisk = async () => {
    setClimateLoading(true); setClimateResult('');
    const system = 'شما یک متخصص ریسک‌های آب‌وهوایی و ESG هستید. تحلیل به فارسی.';
    const prompt = `ریسک‌های آب‌وهوایی و ESG برای شرکت‌های زیر را تحلیل کن:
${subsidiaries.map(s => `${s.name}: امتیاز E=${Math.round((s.esg.environmental.carbonEmissions + s.esg.environmental.energyEfficiency) / 2)}, رتبه=${s.esg.rating}`).join('\n')}

برای هر دسته بنویس:
🌡️ ریسک‌های فیزیکی (سیل، خشکسالی، دما)
⚖️ ریسک‌های انتقال (مقررات کربن، جریمه‌ها)
📉 ریسک‌های بازار (تغییر ترجیحات سرمایه‌گذار)
💡 فرصت‌های پایداری`;
    try {
      setClimateResult(await callAIESG(prompt, system, settings.aiProvider, settings.apiKey ?? '', settings.aiModel ?? 'gemini-2.0-flash'));
    } catch {
      setClimateResult(`🌡️ تحلیل ریسک‌های آب‌وهوایی (آفلاین)

ریسک‌های فیزیکی:
• خشکسالی: تأثیر بالا بر واحدهای کشاورزی و غذایی
• گرمایش: افزایش هزینه‌های خنک‌کاری صنعتی ۸-۱۲٪
• سیل: خطر پایین اما نیاز به پوشش بیمه‌ای کافی

ریسک‌های انتقال:
• احتمال اجرای مالیات کربن در ایران — آمادگی لازم
• سخت‌گیری مقررات زیست‌محیطی در ۳ سال آینده
• جریمه احتمالی برای رتبه‌های B و CCC

فرصت‌های پایداری:
🌿 بازار سبز: دسترسی به تأمین مالی ESG-linked
📈 برتری رقابتی با گزارش‌دهی شفاف
🤝 جذب سرمایه‌گذاران ESG-focused`);
    }
    setClimateLoading(false);
  };

  const contextData = `ESG گروه — میانگین: ${avgESG.toFixed(1)} | محیط: ${avgEnv.toFixed(1)} | اجتماعی: ${avgSocial.toFixed(1)} | حاکمیتی: ${avgGov.toFixed(1)}
رتبه‌بندی: ${subsidiaries.map((s) => `${s.name}(${s.esg.rating})`).join(' | ')}`;

  return (
    <div className="p-5 space-y-5 animate-fade-in" id="esg-content">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="section-title">گزارش ESG و پایداری شرکتی</h2>
          <p className="section-subtitle">ارزیابی عملکرد محیط‌زیستی، اجتماعی و حاکمیتی شرکت‌های تابعه</p>
        </div>
        <ExportMenu
          options={[
            { label: 'گزارش Excel', format: 'xlsx', icon: FileSpreadsheet, color: '#10b981', action: () => exportPortfolioExcel(holdingData) },
            { label: 'CSV', format: 'csv', icon: Table, color: '#22d3ee', action: () => exportSubsidiariesToCSV(subsidiaries) },
            { label: 'PDF', format: 'pdf', icon: FileText, color: '#a78bfa', action: () => exportToPDF('esg-content', 'گزارش_ESG') },
          ]}
        />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="امتیاز کلی ESG" value={avgESG.toFixed(0)} suffix="/۱۰۰" icon={Award} color="emerald" change={7.8} subtitle="میانگین گروه" />
        <KPICard title="عملکرد محیط‌زیستی" value={avgEnv.toFixed(0)} suffix="/۱۰۰" icon={Wind} color="cyan" change={5.2} subtitle="E — Environmental" />
        <KPICard title="عملکرد اجتماعی" value={avgSocial.toFixed(0)} suffix="/۱۰۰" icon={Users} color="violet" change={4.1} subtitle="S — Social" />
        <KPICard title="حاکمیت پایداری" value={avgGov.toFixed(0)} suffix="/۱۰۰" icon={Leaf} color="brand" change={3.8} subtitle="G — Governance" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 card p-5">
          <h3 className="section-title mb-1">مقایسه ESG شرکت‌های تابعه</h3>
          <p className="section-subtitle mb-5">مقایسه سه بُعد محیط‌زیست، اجتماعی و حاکمیتی</p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={barData} barSize={10}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="محیط‌زیست" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="اجتماعی" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="حاکمیتی" fill="#3d52ff" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h3 className="section-title mb-1">پروفایل ESG گروه</h3>
          <p className="section-subtitle mb-3">میانگین شاخص‌های کلیدی</p>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="var(--chart-grid)" />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 9, fill: 'var(--text-3)' }} />
              <Radar dataKey="value" stroke="#10b981" fill="#10b981" fillOpacity={0.2} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card p-5">
        <h3 className="section-title mb-4">رتبه‌بندی ESG شرکت‌های تابعه</h3>
        <div className="space-y-3">
          {[...subsidiaries].sort((a, b) => b.esg.overallScore - a.esg.overallScore).map((s) => {
            const rc = ESG_RATINGS[s.esg.rating] ?? ESG_RATINGS.BBB;
            const envScore = Math.round((s.esg.environmental.carbonEmissions + s.esg.environmental.energyEfficiency + s.esg.environmental.wasteManagement) / 3);
            const socScore = Math.round((s.esg.social.employeeSatisfaction + s.esg.social.communityInvestment) / 2);
            const govScore = Math.round((s.esg.governance.transparencyScore + s.esg.governance.anticorruptionMeasures) / 2);
            return (
              <div key={s.id} className="p-4 rounded-xl" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm"
                      style={{ background: rc.bg, color: rc.color, border: `1px solid ${rc.color}30` }}>
                      {s.esg.rating}
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>{s.name}</p>
                      <p className="text-xs" style={{ color: 'var(--text-3)' }}>{rc.label}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold" style={{ color: rc.color }}>{s.esg.overallScore}</span>
                    <span className="text-xs" style={{ color: 'var(--text-3)' }}>/۱۰۰</span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'محیط (E)', value: envScore, color: '#10b981' },
                    { label: 'اجتماعی (S)', value: socScore, color: '#8b5cf6' },
                    { label: 'حاکمیت (G)', value: govScore, color: '#3d52ff' },
                  ].map(({ label, value, color }) => (
                    <div key={label}>
                      <div className="flex justify-between text-xs mb-1">
                        <span style={{ color: 'var(--text-3)' }}>{label}</span>
                        <span className="font-semibold" style={{ color }}>{value}</span>
                      </div>
                      <ScoreBar value={value} color={color} />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-emerald-400" />
          <h3 className="section-title">فرصت‌های بهبود ESG</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { icon: Wind, title: 'کاهش ردپای کربنی', desc: 'تدوین نقشه راه کاهش ۱۵٪ انتشار کربن تا ۱۴۰۵', color: '#10b981', priority: 'بالا' },
            { icon: Users, title: 'افزایش تنوع جنسیتی', desc: 'هدف‌گذاری ۴۰٪ حضور زنان در مدیریت میانی', color: '#8b5cf6', priority: 'متوسط' },
            { icon: Droplets, title: 'مدیریت مصرف آب', desc: 'پیاده‌سازی سیستم بازیافت آب در واحدهای صنعتی', color: '#22d3ee', priority: 'متوسط' },
            { icon: Award, title: 'گواهینامه‌های ESG', desc: 'اخذ گواهینامه ISO 14001 برای ۳ شرکت اولویت‌دار', color: '#fbbf24', priority: 'پایین' },
          ].map(({ icon: Icon, title, desc, color, priority }) => (
            <div key={title} className="flex items-start gap-3 p-4 rounded-xl"
              style={{ background: `${color}08`, border: `1px solid ${color}20` }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${color}15` }}>
                <Icon className="w-4 h-4" style={{ color }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>{title}</p>
                  <span className="badge" style={{ background: `${color}12`, color, border: `1px solid ${color}25`, fontSize: 10 }}>{priority}</span>
                </div>
                <p className="text-xs mt-1" style={{ color: 'var(--text-2)' }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI ESG Improvement Plan */}
      <div className="card p-5" style={{ borderColor: 'rgba(16,185,129,0.2)' }}>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="section-title">برنامه بهبود ESG هوشمند</h3>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>نقشه راه ۱۲ ماهه برای ارتقاء رتبه پایداری</p>
            </div>
          </div>
          <button onClick={handleESGPlan} disabled={planLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
            style={{ background: 'rgba(16,185,129,0.12)', color: '#34d399', border: '1px solid rgba(16,185,129,0.25)' }}>
            {planLoading ? <Loader className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            تولید برنامه بهبود
          </button>
        </div>
        {planLoading && <div className="flex items-center gap-3 p-4 rounded-xl" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
          <Loader className="w-4 h-4 animate-spin text-emerald-400" /><span className="text-sm" style={{ color: 'var(--text-2)' }}>در حال طراحی برنامه...</span>
        </div>}
        {planResult && <div className="p-4 rounded-xl" style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)' }}>
          <p className="text-xs font-bold mb-2 text-emerald-400">برنامه بهبود ESG</p>
          <div className="text-sm leading-relaxed whitespace-pre-line" style={{ color: 'var(--text-2)' }}>{planResult}</div>
        </div>}
      </div>

      {/* AI Climate Risk */}
      <div className="card p-5" style={{ borderColor: 'rgba(34,211,238,0.2)' }}>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-cyan-400" />
            <div>
              <h3 className="section-title">تحلیل ریسک آب‌وهوایی هوشمند</h3>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>بررسی ریسک‌های فیزیکی و انتقال مرتبط با تغییرات اقلیمی</p>
            </div>
          </div>
          <button onClick={handleClimateRisk} disabled={climateLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
            style={{ background: 'rgba(34,211,238,0.12)', color: '#22d3ee', border: '1px solid rgba(34,211,238,0.25)' }}>
            {climateLoading ? <Loader className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
            تحلیل ریسک اقلیمی
          </button>
        </div>
        {climateLoading && <div className="flex items-center gap-3 p-4 rounded-xl" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
          <Loader className="w-4 h-4 animate-spin text-cyan-400" /><span className="text-sm" style={{ color: 'var(--text-2)' }}>در حال تحلیل...</span>
        </div>}
        {climateResult && <div className="p-4 rounded-xl" style={{ background: 'rgba(34,211,238,0.06)', border: '1px solid rgba(34,211,238,0.2)' }}>
          <p className="text-xs font-bold mb-2 text-cyan-400">تحلیل ریسک آب‌وهوایی</p>
          <div className="text-sm leading-relaxed whitespace-pre-line" style={{ color: 'var(--text-2)' }}>{climateResult}</div>
        </div>}
      </div>

      <ContextChat moduleId="esg" contextData={contextData} quickPrompts={QUICK_PROMPTS} title="دستیار ESG" />
    </div>
  );
}
