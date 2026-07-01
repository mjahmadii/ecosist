'use client';
import { useState } from 'react';
import {
  Search, Download, ArrowUp, ArrowDown, X,
  FileSpreadsheet, FileText, Table, Sparkles, Loader, Brain,
} from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import {
  formatCurrency, getStatusConfig, getSectorLabel, getSectorColor, getScoreColor, getScoreBg,
  calcDebtRatio, calcCurrentRatio, calcROE, calcNetMargin,
  exportPortfolioExcel, exportSubsidiariesToCSV, exportToPDF,
} from '@/utils';
import type { Subsidiary } from '@/types';
import ContextChat from '@/components/ui/ContextChat';
import ExportMenu from '@/components/ui/ExportMenu';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

const QUICK_PROMPTS = [
  'بهترین و بدترین شرکت‌های تابعه را مقایسه کن',
  'کدام شرکت بیشترین ریسک را دارد؟',
  'پیشنهاد بهبود عملکرد شرکت‌های ضعیف',
  'تحلیل ساختار مالکیت پرتفولیو',
];

async function callAISimple(prompt: string, systemP: string, apiKey: string, provider: string, model: string): Promise<string> {
  if (!apiKey || apiKey === 'demo-mode') return '';
  if (provider === 'openai') {
    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model: model || 'gpt-4o', messages: [{ role: 'system', content: systemP }, { role: 'user', content: prompt }], max_tokens: 1000 }),
    });
    return (await r.json()).choices?.[0]?.message?.content ?? '';
  }
  if (provider === 'anthropic') {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
      body: JSON.stringify({ model: model || 'claude-opus-4-8', max_tokens: 1000, system: systemP, messages: [{ role: 'user', content: prompt }] }),
    });
    return (await r.json()).content?.[0]?.text ?? '';
  }
  const gm = model || 'gemini-2.0-flash';
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${gm}:generateContent?key=${apiKey}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ system_instruction: { parts: [{ text: systemP }] }, contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: { maxOutputTokens: 1000 } }),
  });
  return (await r.json()).candidates?.[0]?.content?.parts?.[0]?.text ?? '';
}

function demoSWOT(sub: Subsidiary): string {
  return `**نقاط قوت:**\n• امتیاز کلی ${sub.overallScore}/۱۰۰ — جایگاه ${sub.overallScore >= 75 ? 'برتر' : 'متوسط'} در پرتفوی\n• استقلال هیئت مدیره ${sub.governance.boardIndependence}٪\n• امتیاز ESG: ${sub.esg.overallScore} (رتبه ${sub.esg.rating})\n\n**نقاط ضعف:**\n• احتمال ورشکستگی آلتمن ${sub.altmanZ.bankruptcyProbability}٪\n• امتیاز شفافیت ${sub.governance.disclosureScore}/۱۰۰ نیاز به بهبود\n\n**فرصت‌ها:**\n• پتانسیل بهبود ESG از طریق سرمایه‌گذاری سبز\n• همکاری استراتژیک با سایر تابعه‌های گروه\n\n**تهدیدها:**\n• ریسک سیستماتیک بازار در بخش ${getSectorLabel(sub.sector)}\n• تغییرات مقرراتی و الزامات انطباق`;
}

function demoRisk(sub: Subsidiary): string {
  const riskLevel = sub.altmanZ.bankruptcyProbability > 40 ? 'بحرانی' : sub.altmanZ.bankruptcyProbability > 25 ? 'متوسط' : 'پایین';
  return `**سطح ریسک کلی: ${riskLevel}**\n\n• Z-Score آلتمن ${sub.altmanZ.zScore} — وضعیت ${sub.altmanZ.bankruptcyRisk === 'safe' ? 'امن' : sub.altmanZ.bankruptcyRisk === 'grey' ? 'خاکستری' : 'بحرانی'}\n• نسبت بدهی ${calcDebtRatio(sub)}٪ — ${calcDebtRatio(sub) > 65 ? 'بالاتر از آستانه هشدار' : 'در محدوده قابل قبول'}\n• نسبت جاری ${calcCurrentRatio(sub).toFixed(2)} — ${calcCurrentRatio(sub) < 1.2 ? 'کمتر از حداقل توصیه‌شده' : 'کافی'}\n\n**توصیه:** ${sub.altmanZ.bankruptcyProbability > 35 ? 'بررسی فوری ساختار مالی و نقدینگی' : 'پایش ماهانه شاخص‌های کلیدی'}`
}

function ScoreBadge({ score }: { score: number }) {
  return (
    <span className={`px-2.5 py-1 rounded-lg text-sm font-bold border ${getScoreBg(score)} ${getScoreColor(score)}`}>
      {score}
    </span>
  );
}

function SubsidiaryDetail({ sub, onClose }: { sub: Subsidiary; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<'financial' | 'governance' | 'esg' | 'board' | 'alerts' | 'swot' | 'ai-risk'>('financial');
  const [swotResult, setSwotResult] = useState('');
  const [swotLoading, setSwotLoading] = useState(false);
  const [riskResult, setRiskResult] = useState('');
  const [riskLoading, setRiskLoading] = useState(false);

  const latest = sub.financials[sub.financials.length - 1];
  const tabs = [
    { id: 'financial', label: 'مالی' },
    { id: 'governance', label: 'حاکمیت' },
    { id: 'esg', label: 'ESG' },
    { id: 'board', label: 'هیئت مدیره' },
    { id: 'alerts', label: `هشدارها (${sub.alerts.filter(a => !a.acknowledged).length})` },
    { id: 'swot', label: '🧠 SWOT' },
    { id: 'ai-risk', label: '⚠️ ریسک AI' },
  ] as const;

  const { acknowledgeAlert, apiKey, aiProvider, settings } = useAppStore();

  const handleSWOT = async () => {
    setSwotLoading(true);
    const sp = `شما تحلیلگر استراتژیک هستید. تحلیل SWOT دقیق و کاربردی به فارسی ارائه دهید.`;
    const prompt = `تحلیل SWOT کامل برای ${sub.name} (بخش: ${getSectorLabel(sub.sector)}، امتیاز کلی: ${sub.overallScore}/۱۰۰، ریسک ورشکستگی: ${sub.altmanZ.bankruptcyProbability}٪، ESG: ${sub.esg.overallScore}، حاکمیت: ${sub.governanceScore}) ارائه دهید. هر بخش ۳-۴ آیتم مشخص و قابل اقدام داشته باشد.`;
    try {
      const res = await callAISimple(prompt, sp, apiKey, aiProvider, settings.aiModel);
      setSwotResult(res || demoSWOT(sub));
    } catch { setSwotResult(demoSWOT(sub)); }
    setSwotLoading(false);
  };

  const handleAIRisk = async () => {
    setRiskLoading(true);
    const sp = `شما کارشناس ریسک مالی هستید. گزارش ریسک دقیق و اجرایی به فارسی ارائه دهید.`;
    const prompt = `ارزیابی ریسک جامع برای ${sub.name}: Z-Score ${sub.altmanZ.zScore} (${sub.altmanZ.bankruptcyRisk})، نسبت بدهی ${calcDebtRatio(sub)}٪، نسبت جاری ${calcCurrentRatio(sub).toFixed(2)}، ROE ${calcROE(sub)}٪، احتمال ورشکستگی ${sub.altmanZ.bankruptcyProbability}٪. ریسک‌های بحرانی، توصیه‌های کنترلی و نقشه راه کاهش ریسک ارائه دهید.`;
    try {
      const res = await callAISimple(prompt, sp, apiKey, aiProvider, settings.aiModel);
      setRiskResult(res || demoRisk(sub));
    } catch { setRiskResult(demoRisk(sub)); }
    setRiskLoading(false);
  };

  const zConfig = {
    safe: { color: 'text-emerald-400', label: 'امن', bg: 'bg-emerald-500/10' },
    grey: { color: 'text-amber-400', label: 'خاکستری', bg: 'bg-amber-500/10' },
    distress: { color: 'text-rose-400', label: 'پریشان', bg: 'bg-rose-500/10' },
  }[sub.altmanZ.bankruptcyRisk];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-2xl h-full overflow-y-auto animate-slide-in-right" style={{ background: 'var(--bg-2)', borderLeft: '1px solid var(--border)' }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="sticky top-0 backdrop-blur-md border-b p-5 z-10" style={{ background: 'var(--bg-2)', borderColor: 'var(--border)' }}>
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold" style={{ color: 'var(--text-1)' }}>{sub.name}</h2>
              <p className="text-sm mt-0.5" style={{ color: 'var(--text-3)' }}>{sub.nameEn}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: getSectorColor(sub.sector) + '30', color: getSectorColor(sub.sector) }}>
                  {getSectorLabel(sub.sector)}
                </span>
                {sub.isListed && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/20">
                    {sub.stockSymbol} | بورسی
                  </span>
                )}
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition-all">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Score row */}
          <div className="grid grid-cols-4 gap-3 mt-4">
            {[
              { label: 'مالی', score: sub.financialScore },
              { label: 'حاکمیتی', score: sub.governanceScore },
              { label: 'ESG', score: sub.esg.overallScore },
              { label: 'کلی', score: sub.overallScore },
            ].map(({ label, score }) => (
              <div key={label} className="text-center p-2.5 rounded-xl bg-white/3 border border-white/5">
                <ScoreBadge score={score} />
                <p className="text-xs text-slate-500 mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10 px-4">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === t.id
                  ? 'border-brand-500 text-brand-300'
                  : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-5">
          {activeTab === 'financial' && (
            <div className="space-y-4">
              {/* Key metrics */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'درآمد', value: formatCurrency(latest.revenue, true) },
                  { label: 'سود خالص', value: formatCurrency(latest.netIncome, true) },
                  { label: 'کل دارایی', value: formatCurrency(latest.totalAssets, true) },
                  { label: 'نسبت بدهی', value: `${calcDebtRatio(sub)}٪`, warn: calcDebtRatio(sub) > 65 },
                  { label: 'نسبت جاری', value: calcCurrentRatio(sub).toFixed(2), warn: calcCurrentRatio(sub) < 1.2 },
                  { label: 'بازده حقوق صاحبان', value: `${calcROE(sub)}٪` },
                  { label: 'حاشیه سود خالص', value: `${calcNetMargin(sub)}٪` },
                  { label: 'EBITDA', value: formatCurrency(latest.ebitda, true) },
                ].map(({ label, value, warn }) => (
                  <div key={label} className={`p-3 rounded-xl border ${warn ? 'bg-amber-500/5 border-amber-500/20' : 'bg-white/3 border-white/5'}`}>
                    <p className="text-xs text-slate-500">{label}</p>
                    <p className={`text-sm font-bold mt-0.5 ${warn ? 'text-amber-400' : 'text-white'}`}>{value}</p>
                  </div>
                ))}
              </div>

              {/* Revenue trend */}
              <div className="p-4 rounded-xl bg-white/3 border border-white/5">
                <p className="text-xs font-medium text-slate-300 mb-3">روند درآمد و سود ۳ ساله</p>
                <ResponsiveContainer width="100%" height={150}>
                  <BarChart data={sub.financials}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="year" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#64748b', fontSize: 9 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: '#111827', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', fontSize: '11px', color: '#f0f4ff' }} />
                    <Bar dataKey="revenue" name="درآمد" fill="#3d52ff" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="netIncome" name="سود خالص" fill="#00e5b0" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Altman Z */}
              <div className={`p-4 rounded-xl border ${zConfig.bg} border-white/10`}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-white">مدل پیش‌بینی ورشکستگی آلتمن Z</p>
                  <div className={`flex items-center gap-2 ${zConfig.color}`}>
                    <span className="text-lg font-bold font-mono">{sub.altmanZ.zScore}</span>
                    <span className="text-xs">({zConfig.label})</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        sub.altmanZ.zScore > 2.99 ? 'bg-emerald-500' :
                        sub.altmanZ.zScore > 1.81 ? 'bg-amber-500' : 'bg-rose-500'
                      }`}
                      style={{ width: `${Math.min(100, (sub.altmanZ.zScore / 5) * 100)}%` }}
                    />
                  </div>
                  <span className={`text-sm font-bold ${zConfig.color}`}>{sub.altmanZ.bankruptcyProbability}٪</span>
                </div>
                <p className="text-xs text-slate-500 mt-1.5">احتمال ورشکستگی در ۲ سال آینده: {sub.altmanZ.bankruptcyProbability}٪</p>
              </div>
            </div>
          )}

          {activeTab === 'governance' && (
            <div className="space-y-3">
              {Object.entries({
                boardIndependence: { label: 'استقلال هیئت مدیره', suffix: '٪' },
                auditQuality: { label: 'کیفیت حسابرسی', suffix: '' },
                disclosureScore: { label: 'شفافیت اطلاعاتی', suffix: '' },
                shareholderRights: { label: 'حقوق سهامداران', suffix: '' },
                riskManagement: { label: 'مدیریت ریسک', suffix: '' },
                boardMeetingAttendance: { label: 'حضور در جلسات', suffix: '٪' },
              }).map(([key, { label, suffix }]) => {
                const val = sub.governance[key as keyof typeof sub.governance] as number;
                return (
                  <div key={key} className="flex items-center gap-3 p-3 rounded-xl bg-white/3 border border-white/5">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs text-slate-400">{label}</span>
                        <span className={`text-sm font-bold ${getScoreColor(val)}`}>{val}{suffix}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/10">
                        <div className={`h-full rounded-full bg-gradient-to-r transition-all ${
                          val >= 80 ? 'from-emerald-600 to-emerald-400' :
                          val >= 65 ? 'from-blue-600 to-blue-400' :
                          val >= 50 ? 'from-amber-600 to-amber-400' : 'from-rose-600 to-rose-400'
                        }`} style={{ width: `${val}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
              <div className="grid grid-cols-3 gap-3 mt-2">
                {[
                  { label: 'اعضای هیئت مدیره', val: sub.governance.boardSize },
                  { label: 'اعضای مستقل', val: sub.governance.independentDirectors },
                  { label: 'اعضای زن', val: sub.governance.femaleDirectors },
                ].map(({ label, val }) => (
                  <div key={label} className="p-3 rounded-xl bg-white/3 border border-white/5 text-center">
                    <p className="text-xl font-bold text-white">{val}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'esg' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-br from-emerald-900/30 to-teal-900/20 border border-emerald-500/20">
                <div>
                  <p className="text-sm text-slate-300">امتیاز کلی ESG</p>
                  <p className="text-3xl font-bold text-white mt-1">{sub.esg.overallScore}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400">رتبه‌بندی</p>
                  <p className="text-2xl font-bold text-emerald-400 mt-0.5">{sub.esg.rating}</p>
                </div>
              </div>

              {[
                { label: '🌱 محیط زیست', data: sub.esg.environmental, keys: { carbonEmissions: 'انتشار کربن', energyEfficiency: 'بهره‌وری انرژی', wasteManagement: 'مدیریت پسماند', waterUsage: 'مصرف آب', greenCertifications: 'گواهینامه‌های سبز' } },
                { label: '👥 اجتماعی', data: sub.esg.social, keys: { employeeSatisfaction: 'رضایت کارکنان', genderDiversityRatio: 'تنوع جنسیتی', communityInvestment: 'سرمایه‌گذاری اجتماعی', humanRightsScore: 'حقوق بشر' } },
                { label: '🏛 حاکمیت', data: sub.esg.governance, keys: { transparencyScore: 'شفافیت', anticorruptionMeasures: 'مبارزه با فساد', whistleblowerPolicy: 'خط گزارش تخلف', taxTransparency: 'شفافیت مالیاتی' } },
              ].map(({ label, data, keys }) => (
                <div key={label} className="p-4 rounded-xl bg-white/3 border border-white/5">
                  <p className="text-sm font-medium text-white mb-3">{label}</p>
                  <div className="space-y-2.5">
                    {Object.entries(keys).map(([k, name]) => {
                      const val = (data as any)[k] as number;
                      return (
                        <div key={k}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-slate-400">{name}</span>
                            <span className={getScoreColor(val)}>{val}</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-white/10">
                            <div className="h-full rounded-full bg-gradient-to-r from-emerald-700 to-emerald-400 transition-all" style={{ width: `${val}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'board' && (
            <div className="space-y-3">
              {sub.boardMembers.map((m) => (
                <div key={m.id} className="p-4 rounded-xl bg-white/3 border border-white/5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-white">{m.name}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{m.role}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {m.independent && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/20">مستقل</span>
                      )}
                      <span className="text-xs text-slate-500">{m.tenureYears} سال</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2.5">
                    <div className="flex-1">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-500">حضور در جلسات</span>
                        <span className={m.attendanceRate >= 90 ? 'text-emerald-400' : 'text-amber-400'}>{m.attendanceRate}٪</span>
                      </div>
                      <div className="h-1 rounded-full bg-white/10">
                        <div className={`h-full rounded-full ${m.attendanceRate >= 90 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${m.attendanceRate}%` }} />
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {m.expertise.map((e) => (
                      <span key={e} className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-slate-400">{e}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'alerts' && (
            <div className="space-y-3">
              {sub.alerts.length === 0 ? (
                <div className="text-center py-8 text-sm" style={{ color: 'var(--text-3)' }}>بدون هشدار فعال</div>
              ) : (
                sub.alerts.map((alert) => {
                  const colors = {
                    critical: { color: '#fb7185', bg: 'rgba(244,63,94,0.08)', border: 'rgba(244,63,94,0.2)' },
                    warning: { color: '#fbbf24', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)' },
                    info: { color: '#60a5fa', bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.2)' },
                  }[alert.severity];
                  return (
                    <div key={alert.id} className="p-4 rounded-xl" style={{ background: colors.bg, border: `1px solid ${colors.border}`, opacity: alert.acknowledged ? 0.45 : 1 }}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium" style={{ color: colors.color }}>{alert.title}</p>
                          <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--text-2)' }}>{alert.description}</p>
                        </div>
                        {!alert.acknowledged && (
                          <button onClick={() => acknowledgeAlert(sub.id, alert.id)}
                            className="text-xs px-2 py-1 rounded-lg transition-all flex-shrink-0 mr-2"
                            style={{ color: 'var(--text-3)' }}>تأیید</button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {activeTab === 'swot' && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 rounded-xl ai-card">
                <div className="flex items-center gap-2 mb-3">
                  <Brain className="w-4 h-4" style={{ color: '#637bff' }} />
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>تحلیل SWOT هوشمند</p>
                </div>
                <p className="text-xs mb-3" style={{ color: 'var(--text-2)' }}>
                  شناسایی نقاط قوت، ضعف، فرصت‌ها و تهدیدها بر اساس داده‌های واقعی شرکت توسط هوش مصنوعی
                </p>
                <button onClick={handleSWOT} disabled={swotLoading} className="btn btn-primary btn-sm w-full">
                  {swotLoading ? <><Loader className="w-3 h-3 animate-spin" />در حال تحلیل...</> : <><Sparkles className="w-3 h-3" />تولید تحلیل SWOT</>}
                </button>
              </div>
              {swotResult && (
                <div className="space-y-3 animate-slide-up">
                  {[
                    { key: 'نقاط قوت', cls: 'swot-strengths', color: '#34d399', icon: '💪' },
                    { key: 'نقاط ضعف', cls: 'swot-weaknesses', color: '#fb7185', icon: '⚠️' },
                    { key: 'فرصت', cls: 'swot-opportunities', color: '#637bff', icon: '🚀' },
                    { key: 'تهدید', cls: 'swot-threats', color: '#fbbf24', icon: '🛡️' },
                  ].map(({ key, cls, color, icon }) => {
                    const section = swotResult.split('\n\n').find((s) => s.includes(key)) ?? '';
                    if (!section) return null;
                    const lines = section.split('\n').filter(Boolean);
                    return (
                      <div key={key} className={`swot-card ${cls}`}>
                        <p className="text-sm font-bold mb-2" style={{ color }}>{icon} {lines[0]?.replace(/\*\*/g,'').replace(/:$/, '')}</p>
                        <ul className="space-y-1">
                          {lines.slice(1).map((l, i) => (
                            <li key={i} className="text-xs flex items-start gap-1.5" style={{ color: 'var(--text-2)' }}>
                              <span style={{ color }}>•</span>
                              <span>{l.replace(/^[•\-\*]\s*/, '').replace(/\*\*/g, '')}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                  {/* Raw fallback if structured parsing fails */}
                  {![...['نقاط قوت','نقاط ضعف','فرصت','تهدید']].some(k => swotResult.includes(k)) && (
                    <div className="ai-result-card text-sm leading-7" style={{ color: 'var(--text-1)', whiteSpace: 'pre-line' }}>{swotResult}</div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'ai-risk' && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 rounded-xl" style={{ background: 'rgba(244,63,94,0.06)', border: '1px solid rgba(244,63,94,0.2)', borderRadius: 14 }}>
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-rose-400" />
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>ارزیابی ریسک هوشمند</p>
                </div>
                <p className="text-xs mb-3" style={{ color: 'var(--text-2)' }}>
                  آنالیز عمیق ریسک‌های مالی، عملیاتی و حاکمیتی توسط هوش مصنوعی
                </p>
                <button onClick={handleAIRisk} disabled={riskLoading} className="btn btn-danger btn-sm w-full">
                  {riskLoading ? <><Loader className="w-3 h-3 animate-spin" />در حال تحلیل...</> : <><Brain className="w-3 h-3" />تولید گزارش ریسک</>}
                </button>
              </div>
              {riskResult && (
                <div className="ai-result-card animate-slide-up">
                  <div className="text-sm leading-7 space-y-1" style={{ color: 'var(--text-1)', whiteSpace: 'pre-line' }}>
                    {riskResult.split('\n').map((line, i) => {
                      const isHeader = line.startsWith('**') && line.endsWith('**');
                      if (isHeader) return <p key={i} className="font-bold mt-2" style={{ color: '#fb7185' }}>{line.replace(/\*\*/g,'')}</p>;
                      const parts = line.split(/(\*\*[^*]+\*\*)/g);
                      return <p key={i}>{parts.map((p,j) => p.startsWith('**') ? <strong key={j}>{p.replace(/\*\*/g,'')}</strong> : p)}</p>;
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SubsidiariesView() {
  const { holdingData, selectedSubsidiary, setSelectedSubsidiary, settings } = useAppStore();
  const [search, setSearch] = useState('');
  const [sectorFilter, setSectorFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'overallScore' | 'revenue' | 'name'>('overallScore');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  if (!holdingData) return null;

  const filtered = holdingData.subsidiaries
    .filter((s) => {
      const q = search.toLowerCase();
      return (
        (sectorFilter === 'all' || s.sector === sectorFilter) &&
        (statusFilter === 'all' || s.status === statusFilter) &&
        (s.name.includes(search) || s.nameEn.toLowerCase().includes(q) || !search)
      );
    })
    .sort((a, b) => {
      let valA: number | string, valB: number | string;
      if (sortBy === 'overallScore') { valA = a.overallScore; valB = b.overallScore; }
      else if (sortBy === 'revenue') { valA = a.financials[a.financials.length - 1].revenue; valB = b.financials[b.financials.length - 1].revenue; }
      else { valA = a.name; valB = b.name; }
      if (sortDir === 'asc') return valA > valB ? 1 : -1;
      return valA < valB ? 1 : -1;
    });

  const sectors = [...new Set(holdingData.subsidiaries.map((s) => s.sector))];
  const avgScore = holdingData.portfolioSummary.avgFinancialScore;

  const contextData = `شرکت‌های تابعه گروه: ${holdingData.subsidiaries.length} شرکت | میانگین امتیاز کلی: ${avgScore} | ${holdingData.subsidiaries.map(s => `${s.name}: امتیاز ${s.overallScore}, درآمد ${formatCurrency(s.financials[s.financials.length-1].revenue, true)}`).join(' | ')}`;

  return (
    <div className="p-6 space-y-5 animate-fade-in" id="subsidiaries-content">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-1">
        <div>
          <h2 className="section-title">شرکت‌های تابعه</h2>
          <p className="section-subtitle">مدیریت و پایش جامع شرکت‌های زیرمجموعه گروه</p>
        </div>
        <ExportMenu
          options={[
            { label: 'گزارش Excel', format: 'xlsx', icon: FileSpreadsheet, color: '#34d399', action: () => exportPortfolioExcel(holdingData) },
            { label: 'CSV', format: 'csv', icon: Table, color: '#22d3ee', action: () => exportSubsidiariesToCSV(holdingData.subsidiaries) },
            { label: 'PDF', format: 'pdf', icon: FileText, color: '#a78bfa', action: () => exportToPDF('subsidiaries-content', 'گزارش_شرکت‌های_تابعه') },
          ]}
        />
      </div>
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="جستجوی شرکت..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-10 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500/50 transition-all"
          />
        </div>

        <select value={sectorFilter} onChange={(e) => setSectorFilter(e.target.value)} className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-slate-300 focus:outline-none">
          <option value="all">همه بخش‌ها</option>
          {sectors.map((s) => <option key={s} value={s}>{getSectorLabel(s)}</option>)}
        </select>

        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-slate-300 focus:outline-none">
          <option value="all">همه وضعیت‌ها</option>
          <option value="excellent">عالی</option>
          <option value="good">خوب</option>
          <option value="warning">هشدار</option>
          <option value="critical">بحرانی</option>
        </select>

        <button
          onClick={() => exportSubsidiariesToCSV(filtered)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600/20 border border-brand-500/30 text-brand-300 text-sm hover:bg-brand-600/30 transition-all"
        >
          <Download className="w-4 h-4" />
          خروجی CSV
        </button>
      </div>

      {/* Table */}
      <div className="card overflow-hidden" style={{ padding: 0 }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10 bg-white/2">
                <th className="text-right text-xs font-medium text-slate-400 px-4 py-3">شرکت</th>
                <th className="text-right text-xs font-medium text-slate-400 px-4 py-3">بخش</th>
                <th className="text-right text-xs font-medium text-slate-400 px-4 py-3">وضعیت</th>
                <th className="text-center text-xs font-medium text-slate-400 px-4 py-3 cursor-pointer" onClick={() => { setSortBy('overallScore'); setSortDir(d => d === 'asc' ? 'desc' : 'asc'); }}>
                  <span className="flex items-center justify-center gap-1">امتیاز کلی {sortBy === 'overallScore' && (sortDir === 'desc' ? <ArrowDown className="w-3 h-3" /> : <ArrowUp className="w-3 h-3" />)}</span>
                </th>
                <th className="text-center text-xs font-medium text-slate-400 px-4 py-3">مالی</th>
                <th className="text-center text-xs font-medium text-slate-400 px-4 py-3">حاکمیتی</th>
                <th className="text-center text-xs font-medium text-slate-400 px-4 py-3">ESG</th>
                <th className="text-center text-xs font-medium text-slate-400 px-4 py-3">نسبت بدهی</th>
                <th className="text-right text-xs font-medium text-slate-400 px-4 py-3 cursor-pointer" onClick={() => { setSortBy('revenue'); setSortDir(d => d === 'asc' ? 'desc' : 'asc'); }}>
                  درآمد
                </th>
                <th className="text-center text-xs font-medium text-slate-400 px-4 py-3">Z-Score</th>
                <th className="text-right text-xs font-medium text-slate-400 px-4 py-3">مالکیت</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((sub) => {
                const sc = getStatusConfig(sub.status);
                const debtRatio = calcDebtRatio(sub);
                const isAboveAvg = sub.overallScore > avgScore;
                const latestRev = sub.financials[sub.financials.length - 1].revenue;
                return (
                  <tr
                    key={sub.id}
                    className="hover:bg-white/3 cursor-pointer transition-colors group"
                    onClick={() => setSelectedSubsidiary(sub)}
                  >
                    <td className="px-4 py-3.5">
                      <div>
                        <p className="text-sm font-medium text-white group-hover:text-brand-300 transition-colors">{sub.name}</p>
                        <p className="text-xs text-slate-500">{sub.nameEn}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: getSectorColor(sub.sector) + '25', color: getSectorColor(sub.sector) }}>
                        {getSectorLabel(sub.sector)}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs ${sc.bg} ${sc.color}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                        {sc.label}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <ScoreBadge score={sub.overallScore} />
                        <span className={`text-xs ${isAboveAvg ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {isAboveAvg ? '▲' : '▼'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-center"><ScoreBadge score={sub.financialScore} /></td>
                    <td className="px-4 py-3.5 text-center"><ScoreBadge score={sub.governanceScore} /></td>
                    <td className="px-4 py-3.5 text-center"><ScoreBadge score={sub.esg.overallScore} /></td>
                    <td className="px-4 py-3.5 text-center">
                      <span className={`text-sm font-mono font-medium ${debtRatio > settings.thresholds.maxDebtRatio ? 'text-rose-400' : 'text-slate-300'}`}>
                        {debtRatio}٪
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <span className="text-sm text-slate-300">{formatCurrency(latestRev, true)}</span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className={`text-sm font-mono font-bold ${
                        sub.altmanZ.zScore > 2.99 ? 'text-emerald-400' :
                        sub.altmanZ.zScore > 1.81 ? 'text-amber-400' : 'text-rose-400'
                      }`}>{sub.altmanZ.zScore}</span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <span className="text-sm text-slate-400">{sub.ownershipPercentage}٪</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-white/5 flex items-center justify-between text-xs text-slate-500">
          <span>{filtered.length} از {holdingData.subsidiaries.length} شرکت</span>
          <span>میانگین امتیاز: {(filtered.reduce((s, c) => s + c.overallScore, 0) / filtered.length || 0).toFixed(1)}</span>
        </div>
      </div>

      {selectedSubsidiary && (
        <SubsidiaryDetail sub={selectedSubsidiary} onClose={() => setSelectedSubsidiary(null)} />
      )}

      <ContextChat moduleId="subsidiaries" contextData={contextData} quickPrompts={QUICK_PROMPTS} title="دستیار تحلیل شرکت‌ها" />
    </div>
  );
}
