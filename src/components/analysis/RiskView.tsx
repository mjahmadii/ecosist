'use client';
import { useAppStore } from '@/store/appStore';
import { AlertTriangle, TrendingDown, Shield, Activity, CheckCircle, Zap } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';
import KPICard from '@/components/dashboard/KPICard';
import ContextChat from '@/components/ui/ContextChat';
import ExportMenu from '@/components/ui/ExportMenu';
import { FileSpreadsheet, FileText, Table } from 'lucide-react';
import { exportPortfolioExcel, exportSubsidiariesToCSV, exportToPDF } from '@/utils';

const QUICK_PROMPTS = [
  'کدام شرکت‌ها در معرض بیشترین ریسک ورشکستگی هستند؟',
  'تحلیل Z-Score پرتفولیو',
  'استراتژی کاهش ریسک پیشنهاد بده',
  'هشدارهای فعال را اولویت‌بندی کن',
];

const RISK_COLORS = { safe: '#34d399', grey: '#fbbf24', distress: '#fb7185' };
const RISK_LABELS = { safe: 'ایمن', grey: 'خاکستری', distress: 'بحرانی' };

export default function RiskView() {
  const { holdingData, marketAnomalies } = useAppStore();
  if (!holdingData) return <div className="p-6 text-center py-20" style={{ color: 'var(--text-3)' }}>داده‌ای موجود نیست</div>;

  const { subsidiaries } = holdingData;
  const distressCount = subsidiaries.filter((s) => s.altmanZ.bankruptcyRisk === 'distress').length;
  const greyCount = subsidiaries.filter((s) => s.altmanZ.bankruptcyRisk === 'grey').length;
  const safeCount = subsidiaries.filter((s) => s.altmanZ.bankruptcyRisk === 'safe').length;
  const criticalAlerts = subsidiaries.flatMap((s) => s.alerts).filter((a) => !a.acknowledged && a.severity === 'critical');
  const avgZScore = subsidiaries.reduce((a, s) => a + s.altmanZ.zScore, 0) / subsidiaries.length;

  const barData = [...subsidiaries]
    .sort((a, b) => b.altmanZ.bankruptcyProbability - a.altmanZ.bankruptcyProbability)
    .map((s) => ({
      name: s.name.split(' ').slice(0, 2).join(' '),
      احتمال: s.altmanZ.bankruptcyProbability,
      risk: s.altmanZ.bankruptcyRisk,
    }));

  const contextData = `ریسک پرتفولیو — میانگین Z-Score: ${avgZScore.toFixed(2)}
ایمن: ${safeCount} | خاکستری: ${greyCount} | بحرانی: ${distressCount}
هشدارهای بحرانی فعال: ${criticalAlerts.length}
${subsidiaries.map((s) => `${s.name}: Z=${s.altmanZ.zScore.toFixed(2)}(${RISK_LABELS[s.altmanZ.bankruptcyRisk]})`).join(' | ')}`;

  return (
    <div className="p-5 space-y-5 animate-fade-in" id="risk-content">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="section-title">مدیریت ریسک</h2>
          <p className="section-subtitle">پایش ریسک ورشکستگی، هشدارهای بازار و تحلیل Altman Z-Score</p>
        </div>
        <ExportMenu
          options={[
            { label: 'گزارش Excel', format: 'xlsx', icon: FileSpreadsheet, color: '#f43f5e', action: () => exportPortfolioExcel(holdingData) },
            { label: 'CSV', format: 'csv', icon: Table, color: '#22d3ee', action: () => exportSubsidiariesToCSV(subsidiaries) },
            { label: 'PDF', format: 'pdf', icon: FileText, color: '#a78bfa', action: () => exportToPDF('risk-content', 'گزارش_ریسک') },
          ]}
        />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="شرکت‌های ایمن" value={safeCount} suffix="شرکت" icon={Shield} color="emerald" subtitle="Z-Score بالای ۲.۹۹" />
        <KPICard title="منطقه خاکستری" value={greyCount} suffix="شرکت" icon={Activity} color="amber" subtitle="Z-Score بین ۱.۸ تا ۲.۹۹" />
        <KPICard title="منطقه بحرانی" value={distressCount} suffix="شرکت" icon={TrendingDown} color={distressCount > 0 ? 'rose' : 'emerald'} subtitle="Z-Score زیر ۱.۸" />
        <KPICard title="هشدارهای بحرانی" value={criticalAlerts.length} suffix="هشدار" icon={AlertTriangle} color={criticalAlerts.length > 0 ? 'rose' : 'emerald'} subtitle="نیازمند اقدام فوری" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <h3 className="section-title mb-1">احتمال ورشکستگی شرکت‌ها</h3>
          <p className="section-subtitle mb-5">بر اساس مدل Altman Z-Score</p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={barData} layout="vertical" barSize={14}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" domain={[0, 60]} tick={{ fontSize: 11 }} unit="٪" />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={90} />
              <Tooltip formatter={(v: number) => [`${v}٪`, 'احتمال ورشکستگی']} />
              <ReferenceLine x={30} stroke="#fbbf24" strokeDasharray="4 2" label={{ value: 'آستانه', fill: '#fbbf24', fontSize: 11 }} />
              <Bar dataKey="احتمال" radius={[0, 4, 4, 0]}>
                {barData.map((entry, i) => (
                  <Cell key={i} fill={RISK_COLORS[entry.risk as keyof typeof RISK_COLORS]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h3 className="section-title mb-4">رتبه‌بندی Z-Score</h3>
          <div className="space-y-3">
            {[...subsidiaries].sort((a, b) => b.altmanZ.zScore - a.altmanZ.zScore).map((s) => {
              const color = RISK_COLORS[s.altmanZ.bankruptcyRisk];
              const pct = Math.min(100, (s.altmanZ.zScore / 5) * 100);
              return (
                <div key={s.id}>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                      <span className="font-medium" style={{ color: 'var(--text-1)' }}>{s.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold" style={{ color }}>{s.altmanZ.zScore.toFixed(2)}</span>
                      <span className="badge" style={{ background: `${color}15`, color, border: `1px solid ${color}25`, fontSize: 10 }}>
                        {RISK_LABELS[s.altmanZ.bankruptcyRisk]}
                      </span>
                    </div>
                  </div>
                  <div className="score-track">
                    <div className="score-fill" style={{ width: `${pct}%`, background: color }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 p-3 rounded-xl text-xs" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
            <p className="font-semibold mb-1" style={{ color: 'var(--text-1)' }}>راهنمای Altman Z-Score:</p>
            <div className="space-y-1" style={{ color: 'var(--text-2)' }}>
              <p><span className="font-bold text-emerald-400">{'> 2.99'}</span> — منطقه ایمن، ریسک ورشکستگی پایین</p>
              <p><span className="font-bold text-amber-400">1.81 – 2.99</span> — منطقه خاکستری، نیاز به پایش</p>
              <p><span className="font-bold text-rose-400">{'< 1.81'}</span> — منطقه بحرانی، ریسک بالا</p>
            </div>
          </div>
        </div>
      </div>

      {criticalAlerts.length > 0 && (
        <div className="card p-5" style={{ borderColor: 'rgba(244,63,94,0.2)' }}>
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            <h3 className="section-title">هشدارهای بحرانی فعال</h3>
          </div>
          <div className="space-y-2">
            {criticalAlerts.map((alert) => (
              <div key={alert.id} className="flex items-start gap-3 p-3 rounded-xl"
                style={{ background: 'rgba(244,63,94,0.06)', border: '1px solid rgba(244,63,94,0.18)' }}>
                <Zap className="w-4 h-4 text-rose-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-semibold" style={{ color: '#fb7185' }}>{alert.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-2)' }}>{alert.description}</p>
                </div>
                <span className="badge badge-rose flex-shrink-0">بحرانی</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {marketAnomalies.length > 0 && (
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4 text-amber-400" />
            <h3 className="section-title">ناهنجاری‌های بازار</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {marketAnomalies.map((a) => (
              <div key={a.id} className="p-4 rounded-xl"
                style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.18)' }}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>{a.subsidiaryName}</p>
                  <span className={`badge ${a.severity === 'high' ? 'badge-rose' : a.severity === 'medium' ? 'badge-amber' : 'badge-brand'}`}>
                    {a.severity === 'high' ? 'بالا' : a.severity === 'medium' ? 'متوسط' : 'پایین'}
                  </span>
                </div>
                <p className="text-xs" style={{ color: 'var(--text-2)' }}>{a.description}</p>
                <div className="flex items-center gap-3 mt-3 text-xs">
                  <div style={{ color: 'var(--text-3)' }}>پایه: <span style={{ color: 'var(--text-1)' }}>{a.baseline.toLocaleString('fa-IR')}</span></div>
                  <div style={{ color: 'var(--text-3)' }}>فعلی: <span className="font-bold text-amber-400">{a.current.toLocaleString('fa-IR')}</span></div>
                  <div className="mr-auto font-bold text-amber-400">+{a.deviation.toFixed(0)}٪</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <ContextChat moduleId="risk" contextData={contextData} quickPrompts={QUICK_PROMPTS} title="دستیار ریسک" />
    </div>
  );
}
