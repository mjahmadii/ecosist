'use client';
import {
  Building2, TrendingUp, Shield, Leaf, AlertTriangle,
  DollarSign, Users, Activity, Target, Zap, Brain,
  ArrowUpRight, Clock, ChevronRight,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, Legend,
} from 'recharts';
import { useAppStore } from '@/store/appStore';
import KPICard from './KPICard';
import { formatCurrency, getStatusConfig, getSectorLabel, getSectorColor, calcDebtRatio, calcROE } from '@/utils';
import ContextChat from '@/components/ui/ContextChat';

const QUICK_PROMPTS = [
  'خلاصه وضعیت پرتفولیو را بده',
  'کدام شرکت‌ها نیاز به توجه فوری دارند؟',
  'فرصت‌های بهبود عملکرد کدامند؟',
  'تحلیل ریسک کلی گروه',
];

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="p-3 rounded-xl text-sm" style={{ background: 'var(--modal-bg)', border: '1px solid var(--border-2)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)', direction: 'rtl' }}>
      <p className="font-semibold mb-2" style={{ color: 'var(--text-1)' }}>{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: p.color }} />
          <span style={{ color: 'var(--text-2)' }}>{p.name}:</span>
          <span className="font-bold" style={{ color: 'var(--text-1)' }}>{typeof p.value === 'number' ? p.value.toLocaleString('fa-IR') : p.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function MainDashboard() {
  const { holdingData, recommendations, marketAnomalies, setActiveView } = useAppStore();

  if (!holdingData) {
    return (
      <div className="p-6 text-center py-20" style={{ color: 'var(--text-3)' }}>
        <Building2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p>داده‌ای یافت نشد. لطفاً از بخش «داده‌ها» اطلاعات را بارگذاری کنید.</p>
      </div>
    );
  }

  const { subsidiaries, portfolioSummary } = holdingData;
  const latestFinancials = subsidiaries.map((s) => s.financials[s.financials.length - 1]);
  const totalRevenue = latestFinancials.reduce((a, f) => a + f.revenue, 0);
  const totalProfit = latestFinancials.reduce((a, f) => a + f.netIncome, 0);
  const profitableCount = latestFinancials.filter((f) => f.netIncome > 0).length;
  const criticalCount = subsidiaries.filter((s) => s.status === 'critical').length;
  const avgDebtRatio = subsidiaries.reduce((a, s) => a + calcDebtRatio(s), 0) / subsidiaries.length;
  const avgROE = subsidiaries.reduce((a, s) => a + calcROE(s), 0) / subsidiaries.length;

  const sectorData = Object.entries(portfolioSummary.sectorAllocation)
    .filter(([, v]) => v > 0)
    .map(([k, v]) => ({ name: getSectorLabel(k), value: v, color: getSectorColor(k) }));

  const radarData = [
    { subject: 'مالی', value: portfolioSummary.avgFinancialScore },
    { subject: 'حاکمیت', value: portfolioSummary.avgGovernanceScore },
    { subject: 'ESG', value: portfolioSummary.avgESGScore },
    { subject: 'نقدینگی', value: 72 },
    { subject: 'رشد', value: 65 },
  ];

  const perfTrend = portfolioSummary.performanceTrend.slice(-8);
  const barData = subsidiaries.slice(0, 6).map((s) => ({
    name: s.name.split(' ').slice(0, 2).join(' '),
    مالی: s.financialScore,
    حاکمیتی: s.governanceScore,
    ESG: s.esg.overallScore,
  }));

  const contextData = `
گروه: ${holdingData.name}
تعداد شرکت: ${subsidiaries.length} | سودآور: ${profitableCount}
کل دارایی: ${formatCurrency(holdingData.totalAssets)} | درآمد: ${formatCurrency(totalRevenue)}
میانگین امتیاز مالی: ${portfolioSummary.avgFinancialScore.toFixed(1)} | حاکمیتی: ${portfolioSummary.avgGovernanceScore.toFixed(1)} | ESG: ${portfolioSummary.avgESGScore.toFixed(1)}
نسبت بدهی میانگین: ${avgDebtRatio.toFixed(1)}٪ | ROE میانگین: ${avgROE.toFixed(1)}٪
وضعیت بحرانی: ${criticalCount} شرکت
  `.trim();

  return (
    <div className="p-5 space-y-5 animate-fade-in">
      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="کل دارایی‌های گروه" value={formatCurrency(holdingData.totalAssets, true)} suffix="م.ت"
          icon={DollarSign} color="brand" change={8.3} subtitle="مجموع دارایی‌های تلفیقی" />
        <KPICard title="درآمد کل" value={formatCurrency(totalRevenue, true)} suffix="م.ت"
          icon={TrendingUp} color="cyan" change={12.1} subtitle={`${profitableCount} از ${subsidiaries.length} شرکت سودآور`} />
        <KPICard title="سود خالص گروه" value={formatCurrency(totalProfit, true)} suffix="م.ت"
          icon={Activity} color="emerald" change={5.7} subtitle="سود خالص تلفیقی" />
        <KPICard title="میانگین امتیاز مالی" value={portfolioSummary.avgFinancialScore.toFixed(0)} suffix="/۱۰۰"
          icon={Target} color="amber" subtitle="امتیاز میانگین پرتفولیو" badge="ارزیابی AI" />
        <KPICard title="امتیاز حاکمیتی" value={portfolioSummary.avgGovernanceScore.toFixed(0)} suffix="/۱۰۰"
          icon={Shield} color="violet" change={3.2} subtitle="میانگین گروه" />
        <KPICard title="امتیاز ESG" value={portfolioSummary.avgESGScore.toFixed(0)} suffix="/۱۰۰"
          icon={Leaf} color="emerald" change={7.8} subtitle="پایداری شرکتی" />
        <KPICard title="شرکت‌های بحرانی" value={criticalCount} suffix="شرکت"
          icon={AlertTriangle} color={criticalCount > 0 ? 'rose' : 'emerald'} subtitle="نیازمند توجه فوری" />
        <KPICard title="کارکنان گروه" value={(subsidiaries.reduce((a, s) => a + s.employeeCount, 0) / 1000).toFixed(1)} suffix="هزار نفر"
          icon={Users} color="cyan" change={2.1} subtitle="نیروی انسانی گروه" />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Performance trend */}
        <div className="lg:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="section-title">روند عملکرد پرتفولیو</h3>
              <p className="section-subtitle">تغییرات ارزش کل گروه در ماه‌های اخیر</p>
            </div>
            <span className="badge badge-emerald">
              <ArrowUpRight className="w-3 h-3" />
              رشد مثبت
            </span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={perfTrend}>
              <defs>
                <linearGradient id="perfGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3d52ff" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#3d52ff" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="perfGrad2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00d4ff" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#00d4ff" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="value" name="ارزش پرتفولیو" stroke="#3d52ff" strokeWidth={2.5} fill="url(#perfGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Sector allocation */}
        <div className="card p-5">
          <h3 className="section-title mb-1">توزیع بخشی</h3>
          <p className="section-subtitle mb-4">ترکیب صنایع پرتفولیو</p>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={sectorData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                {sectorData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} stroke="none" />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => [`${v}٪`, 'سهم']} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-3 space-y-1.5 max-h-36 overflow-y-auto">
            {sectorData.map((d) => (
              <div key={d.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: d.color }} />
                  <span style={{ color: 'var(--text-2)' }}>{d.name}</span>
                </div>
                <span className="font-semibold" style={{ color: 'var(--text-1)' }}>{d.value}٪</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Bar comparison */}
        <div className="lg:col-span-2 card p-5">
          <h3 className="section-title mb-1">مقایسه امتیازات شرکت‌ها</h3>
          <p className="section-subtitle mb-5">ارزیابی مالی، حاکمیتی و ESG شرکت‌های تابعه</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={barData} barSize={10}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12, direction: 'rtl' }} />
              <Bar dataKey="مالی" fill="#3d52ff" radius={[4, 4, 0, 0]} />
              <Bar dataKey="حاکمیتی" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="ESG" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Radar */}
        <div className="card p-5">
          <h3 className="section-title mb-1">پروفایل گروه</h3>
          <p className="section-subtitle mb-4">نمای کلی ابعاد عملکردی</p>
          <ResponsiveContainer width="100%" height={200}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="var(--chart-grid)" />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: 'var(--text-3)' }} />
              <Radar name="گروه" dataKey="value" stroke="#3d52ff" fill="#3d52ff" fillOpacity={0.2} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Subsidiaries quick view */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-title">وضعیت شرکت‌های تابعه</h3>
            <button onClick={() => setActiveView('subsidiaries')} className="btn btn-ghost btn-sm">
              مشاهده همه <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="space-y-2">
            {subsidiaries.slice(0, 5).map((s) => {
              const cfg = getStatusConfig(s.status);
              return (
                <div key={s.id} className="flex items-center gap-3 p-2.5 rounded-xl transition-colors"
                  style={{ border: '1px solid var(--border)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-2)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = '')}>
                  <div className={`w-2 h-2 rounded-full flex-shrink-0`} style={{ background: cfg.dot }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--text-1)' }}>{s.name}</p>
                    <p className="text-xs" style={{ color: 'var(--text-3)' }}>{getSectorLabel(s.sector)}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-sm font-bold" style={{ color: 'var(--text-1)' }}>{s.overallScore}</span>
                    <span className={`badge`} style={{
                      background: cfg.bg + '33',
                      color: cfg.color,
                      border: `1px solid ${cfg.bg}55`,
                      fontSize: 10, padding: '2px 7px',
                    }}>{cfg.label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recommendations + Anomalies */}
        <div className="space-y-3">
          {/* Top Recs */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-brand-400" />
                <h3 className="section-title">توصیه‌های هوشمند</h3>
              </div>
              <button onClick={() => setActiveView('ai-assistant')} className="btn btn-ghost btn-sm">
                دستیار AI <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="space-y-2">
              {recommendations.slice(0, 3).map((rec) => (
                <div key={rec.id} className="flex items-start gap-3 p-2.5 rounded-xl"
                  style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                  <Zap className="w-3.5 h-3.5 mt-0.5 flex-shrink-0"
                    style={{ color: rec.priority === 'critical' ? '#fb7185' : rec.priority === 'high' ? '#fbbf24' : '#34d399' }} />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold truncate" style={{ color: 'var(--text-1)' }}>{rec.title}</p>
                    <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-3)' }}>{rec.description.slice(0, 60)}...</p>
                  </div>
                  <span className={`badge flex-shrink-0 ${rec.priority === 'critical' ? 'badge-rose' : rec.priority === 'high' ? 'badge-amber' : 'badge-emerald'}`} style={{ fontSize: 10 }}>
                    {rec.priority === 'critical' ? 'فوری' : rec.priority === 'high' ? 'بالا' : 'متوسط'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Market anomalies */}
          {marketAnomalies.length > 0 && (
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-3">
                <Activity className="w-4 h-4 text-amber-400" />
                <h3 className="section-title">ناهنجاری‌های بازار</h3>
              </div>
              <div className="space-y-2">
                {marketAnomalies.slice(0, 2).map((a) => (
                  <div key={a.id} className="flex items-center gap-3 p-2.5 rounded-xl"
                    style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)' }}>
                    <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 text-amber-400" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold" style={{ color: 'var(--text-1)' }}>{a.subsidiaryName}</p>
                      <p className="text-xs" style={{ color: 'var(--text-3)' }}>{a.description.slice(0, 50)}...</p>
                    </div>
                    <span className="text-xs font-bold text-amber-400">+{a.deviation.toFixed(0)}٪</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <ContextChat moduleId="dashboard" contextData={contextData} quickPrompts={QUICK_PROMPTS} title="دستیار داشبورد" />
    </div>
  );
}
