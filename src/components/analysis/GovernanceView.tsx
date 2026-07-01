'use client';
import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar, Legend } from 'recharts';
import { Shield, AlertTriangle, CheckCircle, Users, Brain, Sparkles, Loader, FileSpreadsheet, FileText, Table } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import KPICard from '@/components/dashboard/KPICard';
import ContextChat from '@/components/ui/ContextChat';
import ExportMenu from '@/components/ui/ExportMenu';
import { exportPortfolioExcel, exportSubsidiariesToCSV, exportToPDF } from '@/utils';

const QUICK_PROMPTS = [
  'نقاط ضعف اصلی حاکمیتی گروه چیست؟',
  'مقایسه هیئت مدیره شرکت‌ها',
  'برنامه بهبود حاکمیت پیشنهاد بده',
  'ریسک‌های حاکمیتی بحرانی را شناسایی کن',
];

function ScoreBar({ value, color = '#3d52ff', height = 6 }: { value: number; color?: string; height?: number }) {
  return (
    <div className="score-track" style={{ height }}>
      <div className="score-fill" style={{ width: `${value}٪`, background: color }} />
    </div>
  );
}

const GOV_LABEL: Record<string, string> = {
  boardIndependence: 'استقلال هیئت مدیره',
  auditQuality: 'کیفیت حسابرسی',
  disclosureScore: 'شفافیت گزارشگری',
  shareholderRights: 'حقوق سهامداران',
  riskManagement: 'مدیریت ریسک',
  executiveCompensation: 'جبران خدمات مدیران',
  boardMeetingAttendance: 'حضور در جلسات',
};

async function callAIGovernance(prompt: string, system: string, apiKey: string, provider: string, model: string): Promise<string> {
  if (!apiKey || apiKey === 'demo-mode') return '';
  if (provider === 'openai') {
    const r = await fetch('https://api.openai.com/v1/chat/completions', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` }, body: JSON.stringify({ model: model || 'gpt-4o', messages: [{ role: 'system', content: system }, { role: 'user', content: prompt }], max_tokens: 1200 }) });
    return (await r.json()).choices?.[0]?.message?.content ?? '';
  }
  if (provider === 'anthropic') {
    const r = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' }, body: JSON.stringify({ model: model || 'claude-opus-4-8', max_tokens: 1200, system, messages: [{ role: 'user', content: prompt }] }) });
    return (await r.json()).content?.[0]?.text ?? '';
  }
  const gm = model || 'gemini-2.0-flash';
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${gm}:generateContent?key=${apiKey}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ system_instruction: { parts: [{ text: system }] }, contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: { maxOutputTokens: 1200 } }) });
  return (await r.json()).candidates?.[0]?.content?.parts?.[0]?.text ?? '';
}

export default function GovernanceView() {
  const { holdingData, apiKey, aiProvider, settings } = useAppStore();
  const [auditResult, setAuditResult] = useState('');
  const [auditLoading, setAuditLoading] = useState(false);
  const [actionPlanResult, setActionPlanResult] = useState('');
  const [actionPlanLoading, setActionPlanLoading] = useState(false);

  if (!holdingData) return <div className="p-6 text-center py-20" style={{ color: 'var(--text-3)' }}>داده‌ای موجود نیست</div>;

  const { subsidiaries } = holdingData;
  const avgBoardIndependence = subsidiaries.reduce((a, s) => a + s.governance.boardIndependence, 0) / subsidiaries.length;
  const avgGovernanceScore = subsidiaries.reduce((a, s) => a + s.governanceScore, 0) / subsidiaries.length;
  const highGovernance = subsidiaries.filter((s) => s.governanceScore >= 75).length;
  const lowGovernance = subsidiaries.filter((s) => s.governanceScore < 60).length;

  const barData = subsidiaries.map((s) => ({
    name: s.name.split(' ').slice(0, 2).join(' '),
    امتیاز: s.governanceScore,
    استقلال: s.governance.boardIndependence,
    شفافیت: s.governance.disclosureScore,
  }));

  const radarData = Object.entries(GOV_LABEL).map(([key, label]) => ({
    subject: label,
    value: subsidiaries.reduce((a, s) => a + (s.governance[key as keyof typeof s.governance] as number ?? 0), 0) / subsidiaries.length,
  }));

  const contextData = `حاکمیت گروه — امتیاز: ${avgGovernanceScore.toFixed(1)} | استقلال: ${avgBoardIndependence.toFixed(1)}٪ | خوب: ${highGovernance} | ضعیف: ${lowGovernance} | ${subsidiaries.map((s) => `${s.name}:${s.governanceScore}`).join('|')}`;

  const govSystem = `شما حسابرس انطباق حاکمیت شرکتی برای گروه ${holdingData.name} هستید. بر اساس استانداردهای OECD و کدهای حاکمیتی ایران تحلیل کنید. پاسخ به فارسی باشد.`;

  const handleAudit = async () => {
    setAuditLoading(true);
    const govData = subsidiaries.map((s) => `${s.name}: استقلال ${s.governance.boardIndependence}٪، شفافیت ${s.governance.disclosureScore}، مدیریت ریسک ${s.governance.riskManagement}، امتیاز کلی ${s.governanceScore}`).join('\n');
    const prompt = `حسابرسی انطباق حاکمیت شرکتی برای شرکت‌های زیر انجام دهید:\n${govData}\n\nانحرافات از استانداردها را شناسایی و راهکارهای اصلاحی اولویت‌بندی‌شده ارائه دهید.`;
    try {
      const res = await callAIGovernance(prompt, govSystem, apiKey, aiProvider, settings.aiModel);
      setAuditResult(res || `**حسابرسی انطباق حاکمیتی:**\n\n${subsidiaries.filter(s=>s.governance.boardIndependence<65).map(s=>`• ${s.name}: استقلال ${s.governance.boardIndependence}٪ — نیاز به افزایش اعضای مستقل`).join('\n')}\n\n**توصیه کلی:** بهبود ساختار هیئت مدیره و افزایش شفافیت گزارشگری در اولویت`);
    } catch { setAuditResult('خطا در تحلیل. لطفاً دوباره تلاش کنید.'); }
    setAuditLoading(false);
  };

  const handleActionPlan = async () => {
    setActionPlanLoading(true);
    const worstSub = [...subsidiaries].sort((a,b) => a.governanceScore - b.governanceScore).slice(0,3);
    const prompt = `برنامه اقدام ۱۲ ماهه برای بهبود حاکمیت شرکتی گروه ${holdingData.name} (میانگین ${avgGovernanceScore.toFixed(0)}/۱۰۰) تدوین کنید. ضعیف‌ترین شرکت‌ها: ${worstSub.map(s=>`${s.name}(${s.governanceScore})`).join('، ')}. برنامه با مراحل مشخص، مسئولیت‌ها و شاخص‌های سنجش باشد.`;
    try {
      const res = await callAIGovernance(prompt, govSystem, apiKey, aiProvider, settings.aiModel);
      setActionPlanResult(res || `**برنامه بهبود حاکمیت ۱۲ ماهه:**\n\n**سه ماه اول:**\n• ارزیابی جامع ساختار هیئت مدیره\n• تدوین منشور هیئت مدیره\n\n**سه ماه دوم:**\n• جذب اعضای مستقل جدید\n• بهبود گزارشگری مالی\n\n**شش ماه آخر:**\n• اجرای سیستم ارزیابی عملکرد هیئت\n• پیاده‌سازی کد رفتاری حاکمیتی`);
    } catch { setActionPlanResult('خطا در تولید برنامه. لطفاً دوباره تلاش کنید.'); }
    setActionPlanLoading(false);
  };

  return (
    <div className="p-5 space-y-5 animate-fade-in" id="governance-content">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="section-title">حاکمیت شرکتی</h2>
          <p className="section-subtitle">ارزیابی جامع ساختار حاکمیتی شرکت‌های تابعه</p>
        </div>
        <ExportMenu
          options={[
            { label: 'گزارش Excel', format: 'xlsx', icon: FileSpreadsheet, color: '#34d399', action: () => exportPortfolioExcel(holdingData) },
            { label: 'CSV', format: 'csv', icon: Table, color: '#22d3ee', action: () => exportSubsidiariesToCSV(subsidiaries) },
            { label: 'PDF', format: 'pdf', icon: FileText, color: '#a78bfa', action: () => exportToPDF('governance-content', 'گزارش_حاکمیت') },
          ]}
        />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="میانگین امتیاز حاکمیتی" value={avgGovernanceScore.toFixed(0)} suffix="/۱۰۰"
          icon={Shield} color="violet" change={3.5} subtitle="امتیاز کلی گروه" />
        <KPICard title="استقلال هیئت مدیره" value={avgBoardIndependence.toFixed(0)} suffix="٪"
          icon={Users} color="brand" change={2.1} subtitle="میانگین درصد استقلال" />
        <KPICard title="حاکمیت قوی" value={highGovernance} suffix="شرکت"
          icon={CheckCircle} color="emerald" subtitle="امتیاز بالاتر از ۷۵" />
        <KPICard title="نیاز به بهبود" value={lowGovernance} suffix="شرکت"
          icon={AlertTriangle} color={lowGovernance > 0 ? 'rose' : 'emerald'} subtitle="امتیاز زیر ۶۰" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 card p-5">
          <h3 className="section-title mb-1">مقایسه امتیازات حاکمیتی</h3>
          <p className="section-subtitle mb-5">امتیاز کلی، استقلال هیئت و شفافیت شرکت‌های تابعه</p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={barData} barSize={10}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="امتیاز" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="استقلال" fill="#3d52ff" radius={[4, 4, 0, 0]} />
              <Bar dataKey="شفافیت" fill="#00c48c" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h3 className="section-title mb-1">پروفایل حاکمیتی</h3>
          <p className="section-subtitle mb-4">میانگین ابعاد حاکمیتی گروه</p>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="var(--chart-grid)" />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 9, fill: 'var(--text-3)' }} />
              <Radar dataKey="value" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.2} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed scores */}
      <div className="card p-5">
        <h3 className="section-title mb-4">تحلیل تفصیلی ابعاد حاکمیتی</h3>
        <div className="overflow-x-auto">
          <table className="tbl">
            <thead>
              <tr>
                <th>شرکت</th>
                {Object.values(GOV_LABEL).map((l) => <th key={l}>{l}</th>)}
                <th>امتیاز کلی</th>
              </tr>
            </thead>
            <tbody>
              {subsidiaries.map((s) => (
                <tr key={s.id}>
                  <td className="font-medium" style={{ color: 'var(--text-1)', whiteSpace: 'nowrap' }}>{s.name}</td>
                  {Object.keys(GOV_LABEL).map((key) => {
                    const val = s.governance[key as keyof typeof s.governance] as number ?? 0;
                    return (
                      <td key={key}>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold w-7 text-left" style={{ color: val >= 75 ? '#34d399' : val >= 60 ? '#fbbf24' : '#fb7185' }}>
                            {val}
                          </span>
                          <div className="flex-1 min-w-[60px]">
                            <ScoreBar value={val} color={val >= 75 ? '#34d399' : val >= 60 ? '#fbbf24' : '#fb7185'} />
                          </div>
                        </div>
                      </td>
                    );
                  })}
                  <td>
                    <span className="font-bold text-sm" style={{ color: s.governanceScore >= 75 ? '#34d399' : s.governanceScore >= 60 ? '#fbbf24' : '#fb7185' }}>
                      {s.governanceScore}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Issues */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          <h3 className="section-title">مسائل حاکمیتی شناسایی‌شده</h3>
        </div>
        <div className="space-y-2">
          {subsidiaries
            .filter((s) => s.governance.boardIndependence < 65)
            .map((s) => (
              <div key={s.id} className="flex items-start gap-3 p-3 rounded-xl"
                style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)' }}>
                <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>
                    {s.name} — استقلال هیئت مدیره پایین
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-2)' }}>
                    استقلال: {s.governance.boardIndependence}٪ — پیشنهاد: افزایش به حداقل ۶۵٪ با جذب اعضای مستقل بیشتر
                  </p>
                </div>
              </div>
            ))}
          {subsidiaries.filter((s) => s.governance.disclosureScore < 70).map((s) => (
            <div key={s.id + '-dis'} className="flex items-start gap-3 p-3 rounded-xl"
              style={{ background: 'rgba(244,63,94,0.06)', border: '1px solid rgba(244,63,94,0.15)' }}>
              <AlertTriangle className="w-4 h-4 text-rose-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>
                  {s.name} — شفافیت گزارشگری ضعیف
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-2)' }}>
                  امتیاز افشا: {s.governance.disclosureScore} — نیازمند بهبود سیاست‌های افشای اطلاعات
                </p>
              </div>
            </div>
          ))}
          {subsidiaries.filter((s) => s.governance.boardIndependence >= 65 && s.governance.disclosureScore >= 70).length === subsidiaries.length && (
            <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: 'rgba(0,196,140,0.06)', border: '1px solid rgba(0,196,140,0.15)' }}>
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <p className="text-sm" style={{ color: 'var(--text-2)' }}>مسئله حاکمیتی بحرانی شناسایی نشد</p>
            </div>
          )}
        </div>
      </div>

      {/* AI Compliance Auditor */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,rgba(139,92,246,0.2),rgba(61,82,255,0.15))', border:'1px solid rgba(139,92,246,0.25)' }}>
              <Brain className="w-4 h-4" style={{ color: '#a78bfa' }} />
            </div>
            <div>
              <h3 className="section-title">حسابرس خودکار انطباق</h3>
              <p className="section-subtitle">تحلیل انحرافات حاکمیتی توسط هوش مصنوعی</p>
            </div>
          </div>
          <button onClick={handleAudit} disabled={auditLoading} className="btn btn-violet btn-sm w-full mb-3">
            {auditLoading ? <><Loader className="w-3 h-3 animate-spin" />در حال بررسی...</> : <><Sparkles className="w-3 h-3" />اجرای حسابرسی انطباق</>}
          </button>
          {auditResult && (
            <div className="ai-result-card animate-slide-up text-sm leading-7" style={{ color: 'var(--text-1)', whiteSpace: 'pre-line' }}>
              {auditResult.split('\n').map((l,i) => {
                const isH = l.startsWith('**') && l.endsWith('**');
                if (isH) return <p key={i} className="font-bold mt-1" style={{color:'#a78bfa'}}>{l.replace(/\*\*/g,'')}</p>;
                const parts = l.split(/(\*\*[^*]+\*\*)/g);
                return <p key={i}>{parts.map((p,j)=>p.startsWith('**')?<strong key={j}>{p.replace(/\*\*/g,'')}</strong>:p)}</p>;
              })}
            </div>
          )}
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,rgba(0,196,140,0.2),rgba(61,82,255,0.1))', border:'1px solid rgba(0,196,140,0.25)' }}>
              <CheckCircle className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h3 className="section-title">تدوین برنامه بهبود حاکمیت</h3>
              <p className="section-subtitle">Action Plan هوشمند برای ارتقای رتبه حاکمیتی</p>
            </div>
          </div>
          <button onClick={handleActionPlan} disabled={actionPlanLoading} className="btn btn-emerald btn-sm w-full mb-3">
            {actionPlanLoading ? <><Loader className="w-3 h-3 animate-spin" />در حال تدوین...</> : <><Brain className="w-3 h-3" />تولید برنامه اقدام ۱۲ ماهه</>}
          </button>
          {actionPlanResult && (
            <div className="ai-result-card animate-slide-up text-sm leading-7" style={{ color: 'var(--text-1)', whiteSpace: 'pre-line' }}>
              {actionPlanResult.split('\n').map((l,i) => {
                const isH = l.startsWith('**') && l.endsWith('**');
                if (isH) return <p key={i} className="font-bold mt-1" style={{color:'#34d399'}}>{l.replace(/\*\*/g,'')}</p>;
                const parts = l.split(/(\*\*[^*]+\*\*)/g);
                return <p key={i}>{parts.map((p,j)=>p.startsWith('**')?<strong key={j}>{p.replace(/\*\*/g,'')}</strong>:p)}</p>;
              })}
            </div>
          )}
        </div>
      </div>

      <ContextChat moduleId="governance" contextData={contextData} quickPrompts={QUICK_PROMPTS} title="دستیار حاکمیت" />
    </div>
  );
}
