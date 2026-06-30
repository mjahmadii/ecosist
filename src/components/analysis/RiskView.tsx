'use client';
import { useAppStore } from '@/store/appStore';
import { AlertTriangle, TrendingDown, Zap, Shield } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter, ReferenceLine } from 'recharts';

export default function RiskView() {
  const { holdingData, marketAnomalies, settings } = useAppStore();
  if (!holdingData) return null;
  const { subsidiaries } = holdingData;

  const bankruptcyData = subsidiaries.map((s) => ({
    name: s.name,
    احتمال: s.altmanZ.bankruptcyProbability,
    zScore: s.altmanZ.zScore,
    risk: s.altmanZ.bankruptcyRisk,
  })).sort((a, b) => b.احتمال - a.احتمال);

  const riskMatrix = subsidiaries.map((s) => ({
    x: 100 - s.financialScore,
    y: 100 - s.governanceScore,
    name: s.name,
    z: s.altmanZ.bankruptcyProbability / 10,
    color: s.altmanZ.bankruptcyRisk === 'distress' ? '#ff3d6e' : s.altmanZ.bankruptcyRisk === 'grey' ? '#ffb020' : '#00e5b0',
  }));

  const allAlerts = subsidiaries.flatMap((s) => s.alerts.map((a) => ({ ...a, subName: s.name }))).filter((a) => !a.acknowledged).sort((a, b) => {
    const order = { critical: 0, warning: 1, info: 2 };
    return order[a.severity] - order[b.severity];
  });

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'شرکت در ناحیه بحران', val: subsidiaries.filter(s => s.altmanZ.bankruptcyRisk === 'distress').length, color: 'text-rose-400', icon: TrendingDown },
          { label: 'شرکت در ناحیه خاکستری', val: subsidiaries.filter(s => s.altmanZ.bankruptcyRisk === 'grey').length, color: 'text-amber-400', icon: AlertTriangle },
          { label: 'شرکت ایمن', val: subsidiaries.filter(s => s.altmanZ.bankruptcyRisk === 'safe').length, color: 'text-emerald-400', icon: Shield },
          { label: 'هشدارهای فعال', val: allAlerts.length, color: 'text-violet-400', icon: Zap },
        ].map(({ label, val, color, icon: Icon }) => (
          <div key={label} className="glass rounded-2xl p-4 border border-white/10 card-glow">
            <Icon className={`w-5 h-5 mb-2 ${color}`} />
            <p className={`text-3xl font-bold ${color}`}>{val}</p>
            <p className="text-xs text-slate-400 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Bankruptcy probability */}
      <div className="glass rounded-2xl p-5 card-glow">
        <h3 className="text-sm font-semibold text-white mb-1">احتمال ورشکستگی — مدل Altman Z-Score</h3>
        <p className="text-xs text-slate-500 mb-4">احتمال ورشکستگی در ۲ سال آینده بر اساس مدل چندمتغیره آلتمن</p>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={bankruptcyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} domain={[0, 80]} unit="٪" />
            <Tooltip contentStyle={{ background: '#111827', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '11px', color: '#f0f4ff' }} formatter={(v: any) => [`${v}٪`, 'احتمال ورشکستگی']} />
            <ReferenceLine y={settings.thresholds.maxBankruptcyProbability} stroke="#ff3d6e" strokeDasharray="4 4" label={{ value: 'آستانه', fill: '#ff3d6e', fontSize: 10 }} />
            <Bar dataKey="احتمال" radius={[4, 4, 0, 0]}>
              {bankruptcyData.map((entry, i) => (
                <cell key={i} fill={entry.risk === 'distress' ? '#ff3d6e' : entry.risk === 'grey' ? '#ffb020' : '#00e5b0'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Risk Matrix + Anomalies */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Z Scores */}
        <div className="glass rounded-2xl p-5 card-glow">
          <h3 className="text-sm font-semibold text-white mb-4">Z-Score همه شرکت‌ها</h3>
          <div className="space-y-3">
            {[...subsidiaries].sort((a, b) => a.altmanZ.zScore - b.altmanZ.zScore).map((sub) => {
              const z = sub.altmanZ;
              const width = Math.min(100, (z.zScore / 5) * 100);
              return (
                <div key={sub.id} className="p-3 rounded-xl bg-white/3 border border-white/5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-200">{sub.name}</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-mono font-bold ${z.zScore > 2.99 ? 'text-emerald-400' : z.zScore > 1.81 ? 'text-amber-400' : 'text-rose-400'}`}>
                        {z.zScore}
                      </span>
                      <span className={`text-xs px-1.5 py-0.5 rounded ${z.bankruptcyRisk === 'safe' ? 'bg-emerald-500/20 text-emerald-400' : z.bankruptcyRisk === 'grey' ? 'bg-amber-500/20 text-amber-400' : 'bg-rose-500/20 text-rose-400'}`}>
                        {z.bankruptcyRisk === 'safe' ? 'امن' : z.bankruptcyRisk === 'grey' ? 'خاکستری' : 'پریشان'}
                      </span>
                    </div>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/10">
                    <div
                      className={`h-full rounded-full ${z.zScore > 2.99 ? 'bg-emerald-500' : z.zScore > 1.81 ? 'bg-amber-500' : 'bg-rose-500'}`}
                      style={{ width: `${width}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-slate-600 mt-1">
                    <span>۰ — بحران</span>
                    <span>۱.۸۱ — خاکستری</span>
                    <span>۲.۹۹ — امن</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Active alerts */}
        <div className="glass rounded-2xl p-5 card-glow">
          <h3 className="text-sm font-semibold text-white mb-4">هشدارهای فعال</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {allAlerts.length === 0 ? (
              <div className="text-center py-8 text-slate-500">بدون هشدار فعال 🎉</div>
            ) : allAlerts.map((alert) => {
              const sc = {
                critical: 'bg-rose-500/10 border-rose-500/20 text-rose-400',
                warning: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
                info: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
              }[alert.severity];
              return (
                <div key={alert.id} className={`p-3 rounded-xl border ${sc}`}>
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs text-slate-400">{(alert as any).subName}</span>
                    <span className={`text-xs font-bold capitalize`}>{alert.severity === 'critical' ? 'بحرانی' : alert.severity === 'warning' ? 'هشدار' : 'اطلاع'}</span>
                  </div>
                  <p className="text-sm font-medium text-white">{alert.title}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{alert.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Market anomalies */}
      <div className="glass rounded-2xl p-5 card-glow">
        <h3 className="text-sm font-semibold text-white mb-4">ناهنجاری‌های بازار — تشخیص خودکار</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {useAppStore.getState().marketAnomalies.map((anom) => {
            const sc = { high: 'border-rose-500/30 bg-rose-500/5', medium: 'border-amber-500/30 bg-amber-500/5', low: 'border-blue-500/30 bg-blue-500/5' }[anom.severity];
            const typeLabel = { volume_spike: 'جهش حجم', price_deviation: 'انحراف قیمت', volatility_surge: 'افزایش نوسان', correlation_break: 'شکست همبستگی' }[anom.type];
            return (
              <div key={anom.id} className={`p-4 rounded-xl border ${sc}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-400">{typeLabel}</span>
                  <span className={`text-xs font-bold ${anom.severity === 'high' ? 'text-rose-400' : anom.severity === 'medium' ? 'text-amber-400' : 'text-blue-400'}`}>
                    {anom.severity === 'high' ? 'بالا' : anom.severity === 'medium' ? 'متوسط' : 'پایین'}
                  </span>
                </div>
                <p className="text-sm font-semibold text-white mb-1">{anom.subsidiaryName}</p>
                <p className="text-xs text-slate-400 leading-relaxed">{anom.description}</p>
                <div className="mt-2 text-xs font-mono">
                  <span className="text-slate-500">انحراف: </span>
                  <span className={anom.deviation > 0 ? 'text-rose-400' : 'text-emerald-400'}>
                    {anom.deviation > 0 ? '+' : ''}{anom.deviation}٪
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
