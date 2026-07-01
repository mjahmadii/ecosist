'use client';
import { useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { Wallet, TrendingUp, Shield, Zap, Info, Brain, Loader, Target } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import KPICard from '@/components/dashboard/KPICard';
import ContextChat from '@/components/ui/ContextChat';
import ExportMenu from '@/components/ui/ExportMenu';
import { FileSpreadsheet, FileText, Table } from 'lucide-react';
import { exportPortfolioExcel, exportSubsidiariesToCSV, exportToPDF } from '@/utils';
import { getSectorColor, getSectorLabel } from '@/utils';

const QUICK_PROMPTS = [
  'بهترین استراتژی تخصیص سرمایه کدام است؟',
  'مقایسه سناریوهای سرمایه‌گذاری',
  'نسبت شارپ را توضیح بده',
  'ریسک هر سناریو را تحلیل کن',
];

const PERSONA_LABELS: Record<string, string> = { conservative: 'محافظه‌کارانه', balanced: 'متوازن', aggressive: 'تهاجمی' };

async function callAICapital(prompt: string, system: string, provider: string, apiKey: string, model: string): Promise<string> {
  if (!apiKey) throw new Error('no-key');
  if (provider === 'openai') {
    const r = await fetch('https://api.openai.com/v1/chat/completions', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` }, body: JSON.stringify({ model: model || 'gpt-4o', messages: [{ role: 'system', content: system }, { role: 'user', content: prompt }], max_tokens: 1300 }) });
    return (await r.json()).choices?.[0]?.message?.content ?? '';
  } else if (provider === 'anthropic') {
    const r = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' }, body: JSON.stringify({ model: model || 'claude-opus-4-5', max_tokens: 1300, system, messages: [{ role: 'user', content: prompt }] }) });
    return (await r.json()).content?.[0]?.text ?? '';
  } else {
    const m = model || 'gemini-2.0-flash';
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${apiKey}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ system_instruction: { parts: [{ text: system }] }, contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: { maxOutputTokens: 1300 } }) });
    return (await r.json()).candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  }
}

export default function CapitalView() {
  const { capitalScenarios, holdingData, settings } = useAppStore();
  const [selectedScenario, setSelectedScenario] = useState(capitalScenarios[0]?.id ?? '');
  const [allocResult, setAllocResult] = useState('');
  const [allocLoading, setAllocLoading] = useState(false);

  const scenario = capitalScenarios.find((s) => s.id === selectedScenario);

  const sectorData = holdingData
    ? Object.entries(holdingData.portfolioSummary.sectorAllocation)
        .filter(([, v]) => v > 0)
        .map(([k, v]) => ({ name: getSectorLabel(k), value: v, color: getSectorColor(k) }))
    : [];

  const scenarioBar = capitalScenarios.map((s) => ({
    name: s.name,
    'بازده مورد انتظار': s.expectedReturn,
    'ریسک': s.risk,
    'نسبت شارپ': s.sharpeRatio,
  }));

  const handleAIAllocation = async () => {
    setAllocLoading(true); setAllocResult('');
    const system = 'شما یک مشاور ارشد سرمایه‌گذاری و مدیریت پرتفولیو هستید. تحلیل به فارسی.';
    const bestScenario = [...capitalScenarios].sort((a, b) => b.sharpeRatio - a.sharpeRatio)[0];
    const persona = PERSONA_LABELS[settings.riskPersona] ?? 'متوازن';
    const prompt = `با توجه به پروفایل ریسک "${persona}" و سناریوهای زیر، بهترین استراتژی تخصیص سرمایه را پیشنهاد بده:

سناریوها:
${capitalScenarios.map(s => `• ${s.name}: بازده ${s.expectedReturn}٪، ریسک ${s.risk}٪، شارپ ${s.sharpeRatio.toFixed(2)}`).join('\n')}

بهترین سناریو بر اساس شارپ: ${bestScenario?.name ?? '—'}

${holdingData ? `شرکت‌های تابعه: ${holdingData.subsidiaries.map(s => `${s.name}(امتیاز مالی: ${s.financialScore})`).join('، ')}` : ''}

لطفاً:
۱. توصیه نهایی با توجه به پروفایل ریسک
۲. توزیع پیشنهادی سرمایه بین سناریوها
۳. ریسک‌های احتمالی و راه‌های مدیریت آن
۴. مقایسه سناریوی انتخابی با بقیه گزینه‌ها`;
    try {
      setAllocResult(await callAICapital(prompt, system, settings.aiProvider, settings.apiKey ?? '', settings.aiModel ?? 'gemini-2.0-flash'));
    } catch {
      setAllocResult(`💡 توصیه تخصیص سرمایه هوشمند (آفلاین)

با توجه به پروفایل ریسک "${persona}":

${persona === 'محافظه‌کارانه'
  ? `✅ سناریوی پیشنهادی: محافظه‌کارانه
• تمرکز بر اوراق درآمد ثابت و صندوق‌های کم‌ریسک
• حداکثر ۲۰٪ در دارایی‌های پرریسک
• هدف: حفظ سرمایه با بازده تضمینی`
  : persona === 'تهاجمی'
  ? `🚀 سناریوی پیشنهادی: تهاجمی
• تمرکز بر سهام رشدمحور و فناوری
• ۶۰-۷۰٪ در دارایی‌های پرریسک-پربازده
• هدف: بازده بالاتر از ۲۵٪ در ۳ سال`
  : `⚖️ سناریوی پیشنهادی: متوازن
• ترکیب بهینه بازده/ریسک با نسبت شارپ بالا
• ۴۰٪ دارایی‌های ثابت، ۶۰٪ رشدمحور
• هدف: بازده ${bestScenario?.expectedReturn ?? 18}٪ با ریسک کنترل‌شده`}

اقدامات توصیه‌شده:
📌 بازنگری سبد هر سه ماه یکبار
📌 تنظیم مجدد در صورت انحراف بیش از ۵٪
📌 پوشش ریسک ارزی برای دارایی‌های ارزی`);
    }
    setAllocLoading(false);
  };

  const contextData = `تخصیص سرمایه — ${capitalScenarios.length} سناریو موجود
${capitalScenarios.map((s) => `${s.name}: بازده ${s.expectedReturn}٪ | ریسک ${s.risk}٪ | شارپ ${s.sharpeRatio}`).join('\n')}
پروفایل ریسک فعلی: ${PERSONA_LABELS[settings.riskPersona]}`;

  return (
    <div className="p-5 space-y-5 animate-fade-in" id="capital-content">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="section-title">بهینه‌سازی تخصیص سرمایه</h2>
          <p className="section-subtitle">سناریوهای سرمایه‌گذاری بر اساس مدل‌های بهینه‌سازی پرتفولیو</p>
        </div>
        <ExportMenu
          options={[
            { label: 'گزارش Excel', format: 'xlsx', icon: FileSpreadsheet, color: '#f59e0b', action: () => holdingData && exportPortfolioExcel(holdingData) },
            { label: 'CSV', format: 'csv', icon: Table, color: '#22d3ee', action: () => holdingData && exportSubsidiariesToCSV(holdingData.subsidiaries) },
            { label: 'PDF', format: 'pdf', icon: FileText, color: '#a78bfa', action: () => exportToPDF('capital-content', 'گزارش_سرمایه') },
          ]}
        />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {capitalScenarios.slice(0, 4).map((s, i) => {
          const colors: Array<'amber' | 'emerald' | 'rose' | 'brand'> = ['amber', 'emerald', 'rose', 'brand'];
          return (
            <KPICard key={s.id} title={s.name} value={s.expectedReturn.toFixed(1)} suffix="٪"
              icon={i === 0 ? Wallet : i === 1 ? TrendingUp : i === 2 ? Shield : Zap}
              color={colors[i] ?? 'brand'} subtitle={`ریسک: ${s.risk}٪ | شارپ: ${s.sharpeRatio.toFixed(2)}`} />
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card p-5">
          <h3 className="section-title mb-4">انتخاب سناریو</h3>
          <div className="space-y-2">
            {capitalScenarios.map((s) => {
              const isSelected = selectedScenario === s.id;
              const scenColor = s.sharpeRatio > 1.5 ? '#34d399' : s.sharpeRatio > 1 ? '#fbbf24' : '#fb7185';
              return (
                <button key={s.id} onClick={() => setSelectedScenario(s.id)}
                  className="w-full p-4 rounded-xl text-right transition-all"
                  style={isSelected
                    ? { background: `${scenColor}10`, border: `1px solid ${scenColor}30` }
                    : { background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold" style={{ color: isSelected ? scenColor : 'var(--text-1)' }}>{s.name}</p>
                    <div className="flex items-center gap-1 text-xs font-bold" style={{ color: scenColor }}>
                      شارپ: {s.sharpeRatio.toFixed(2)}
                    </div>
                  </div>
                  <p className="text-xs mb-2" style={{ color: 'var(--text-2)' }}>{s.description}</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="text-xs p-1.5 rounded-lg text-center" style={{ background: 'rgba(0,196,140,0.08)' }}>
                      <div className="font-bold text-emerald-400">{s.expectedReturn}٪</div>
                      <div style={{ color: 'var(--text-3)', fontSize: 10 }}>بازده</div>
                    </div>
                    <div className="text-xs p-1.5 rounded-lg text-center" style={{ background: 'rgba(244,63,94,0.08)' }}>
                      <div className="font-bold text-rose-400">{s.risk}٪</div>
                      <div style={{ color: 'var(--text-3)', fontSize: 10 }}>ریسک</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="card p-5">
          <h3 className="section-title mb-4">توزیع سرمایه فعلی</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={sectorData} cx="50%" cy="50%" innerRadius={45} outerRadius={72} paddingAngle={3} dataKey="value">
                {sectorData.map((entry, i) => <Cell key={i} fill={entry.color} stroke="none" />)}
              </Pie>
              <Tooltip formatter={(v: number) => [`${v}٪`, 'سهم']} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-3 space-y-1.5 max-h-32 overflow-y-auto">
            {sectorData.map((d) => (
              <div key={d.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                  <span style={{ color: 'var(--text-2)' }}>{d.name}</span>
                </div>
                <span className="font-semibold" style={{ color: 'var(--text-1)' }}>{d.value}٪</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <h3 className="section-title mb-4">مقایسه سناریوها</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={scenarioBar} barSize={10}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="بازده مورد انتظار" fill="#34d399" radius={[4, 4, 0, 0]} />
              <Bar dataKey="ریسک" fill="#fb7185" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {scenario && (
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Wallet className="w-4 h-4 text-amber-400" />
            <h3 className="section-title">جزئیات سناریو: {scenario.name}</h3>
          </div>
          <p className="section-subtitle mb-4">{scenario.description}</p>
          <div className="overflow-x-auto">
            <table className="tbl">
              <thead>
                <tr>
                  <th>شرکت</th>
                  <th>مبلغ تخصیصی (م.ت)</th>
                  <th>درصد سبد</th>
                  <th>نمودار تخصیص</th>
                </tr>
              </thead>
              <tbody>
                {scenario.allocations.map((alloc) => {
                  const sub = holdingData?.subsidiaries.find((s) => s.id === alloc.subsidiaryId);
                  const color = getSectorColor(sub?.sector ?? 'technology');
                  return (
                    <tr key={alloc.subsidiaryId}>
                      <td className="font-medium" style={{ color: 'var(--text-1)' }}>{sub?.name ?? alloc.subsidiaryId}</td>
                      <td className="font-mono">{alloc.amount.toLocaleString('fa-IR')}</td>
                      <td className="font-bold" style={{ color }}>{alloc.percentage}٪</td>
                      <td style={{ minWidth: 120 }}>
                        <div className="score-track">
                          <div className="score-fill" style={{ width: `${alloc.percentage}%`, background: color }} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="p-4 rounded-xl flex items-start gap-3"
        style={{ background: 'rgba(61,82,255,0.06)', border: '1px solid rgba(61,82,255,0.15)' }}>
        <Info className="w-4 h-4 text-brand-400 mt-0.5 flex-shrink-0" />
        <p className="text-sm" style={{ color: 'var(--text-2)' }}>
          <strong style={{ color: 'var(--text-1)' }}>توجه:</strong> سناریوهای تخصیص سرمایه بر اساس مدل بهینه‌سازی پرتفولیو مارکوویتز و نسبت شارپ محاسبه شده‌اند. 
          پروفایل ریسک فعلی: <strong style={{ color: '#6479ff' }}>{PERSONA_LABELS[settings.riskPersona]}</strong>
        </p>
      </div>

      {/* AI Capital Allocation */}
      <div className="card p-5" style={{ borderColor: 'rgba(245,158,11,0.2)' }}>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="section-title">توصیه هوشمند تخصیص سرمایه</h3>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>پیشنهاد بهینه بر اساس پروفایل ریسک و شرایط بازار</p>
            </div>
          </div>
          <button onClick={handleAIAllocation} disabled={allocLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
            style={{ background: 'rgba(245,158,11,0.12)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.25)' }}>
            {allocLoading ? <Loader className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
            دریافت توصیه هوشمند
          </button>
        </div>
        <div className="mb-3 flex items-center gap-2 text-xs" style={{ color: 'var(--text-3)' }}>
          <span>پروفایل ریسک فعلی:</span>
          <span className="font-bold" style={{ color: '#fbbf24' }}>{PERSONA_LABELS[settings.riskPersona]}</span>
        </div>
        {allocLoading && <div className="flex items-center gap-3 p-4 rounded-xl" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
          <Loader className="w-4 h-4 animate-spin text-amber-400" /><span className="text-sm" style={{ color: 'var(--text-2)' }}>در حال تحلیل سناریوها...</span>
        </div>}
        {allocResult && <div className="p-4 rounded-xl" style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)' }}>
          <p className="text-xs font-bold mb-2 text-amber-400">توصیه تخصیص سرمایه</p>
          <div className="text-sm leading-relaxed whitespace-pre-line" style={{ color: 'var(--text-2)' }}>{allocResult}</div>
        </div>}
      </div>

      <ContextChat moduleId="capital" contextData={contextData} quickPrompts={QUICK_PROMPTS} title="دستیار سرمایه" />
    </div>
  );
}
