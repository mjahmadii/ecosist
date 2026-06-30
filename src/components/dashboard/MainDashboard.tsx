'use client';
import {
  Building2, TrendingUp, Shield, Leaf, AlertTriangle,
  DollarSign, Users, Activity, Target, Zap, ArrowUp, ArrowDown,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend,
} from 'recharts';
import { useAppStore } from '@/store/appStore';
import KPICard from './KPICard';
import { formatCurrency, getStatusConfig, getSectorLabel, getSectorColor, formatPercent, getScoreColor } from '@/utils';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-strong rounded-xl p-3 border border-white/10 text-xs">
      <p className="text-slate-400 mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }} className="font-medium">
          {p.name}: {typeof p.value === 'number' ? p.value.toLocaleString('fa-IR') : p.value}
        </p>
      ))}
    </div>
  );
};

export default function MainDashboard() {
  const { holdingData, recommendations, marketAnomalies, setActiveView, setSelectedSubsidiary } = useAppStore();
  if (!holdingData) return null;

  const { subsidiaries, portfolioSummary } = holdingData;

  const totalAlerts = subsidiaries.flatMap((s) => s.alerts).filter((a) => !a.acknowledged).length;
  const criticalAlerts = subsidiaries.flatMap((s) => s.alerts).filter((a) => !a.acknowledged && a.severity === 'critical').length;

  const sectorData = Object.entries(portfolioSummary.sectorAllocation)
    .filter(([, v]) => v > 0)
    .map(([sector, value]) => ({
      name: getSectorLabel(sector),
      value,
      color: getSectorColor(sector),
    }));

  const radarData = [
    { subject: 'امتیاز مالی', value: portfolioSummary.avgFinancialScore },
    { subject: 'حاکمیت', value: portfolioSummary.avgGovernanceScore },
    { subject: 'ESG', value: portfolioSummary.avgESGScore },
    { subject: 'نقدینگی', value: 71 },
    { subject: 'رشد', value: 65 },
    { subject: 'سودآوری', value: 74 },
  ];

  const compareData = subsidiaries.map((s) => ({
    name: s.nameEn.split(' ').slice(0, 2).join(' '),
    مالی: s.financialScore,
    حاکمیتی: s.governanceScore,
    ESG: s.esg.overallScore,
  }));

  const avgScore = portfolioSummary.avgFinancialScore;

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Top KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="کل دارایی‌های گروه"
          value={formatCurrency(holdingData.totalAssets, true)}
          subtitle="میلیون تومان"
          change={8.4}
          changeLabel="رشد سالانه"
          icon={DollarSign}
          color="brand"
        />
        <KPICard
          title="درآمد کل گروه"
          value={formatCurrency(holdingData.totalRevenue, true)}
          subtitle="سال مالی ۱۴۰۲"
          change={14.2}
          changeLabel="رشد نسبت به پارسال"
          icon={TrendingUp}
          color="cyan"
        />
        <KPICard
          title="سود خالص گروه"
          value={formatCurrency(holdingData.totalNetIncome, true)}
          subtitle="حاشیه سود ۹.۸٪"
          change={22.1}
          changeLabel="رشد سود خالص"
          icon={Activity}
          color="emerald"
        />
        <KPICard
          title="شرکت‌های تابعه"
          value={`${portfolioSummary.totalSubsidiaries}`}
          subtitle={`${portfolioSummary.profitableSubsidiaries} سودده`}
          change={0}
          changeLabel={`${criticalAlerts} هشدار بحرانی`}
          icon={Building2}
          color={criticalAlerts > 0 ? 'rose' : 'violet'}
        />
      </div>

      {/* Second row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="میانگین امتیاز مالی" value={`${portfolioSummary.avgFinancialScore.toFixed(1)}`} subtitle="از ۱۰۰" change={2.3} icon={Target} color="amber" size="sm" />
        <KPICard title="میانگین امتیاز حاکمیتی" value={`${portfolioSummary.avgGovernanceScore.toFixed(1)}`} subtitle="از ۱۰۰" change={1.5} icon={Shield} color="brand" size="sm" />
        <KPICard title="میانگین امتیاز ESG" value={`${portfolioSummary.avgESGScore.toFixed(1)}`} subtitle="از ۱۰۰" change={5.8} icon={Leaf} color="emerald" size="sm" />
        <KPICard title="هشدارهای فعال" value={`${totalAlerts}`} subtitle={`${criticalAlerts} بحرانی`} icon={AlertTriangle} color={criticalAlerts > 0 ? 'rose' : 'amber'} size="sm" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Performance trend */}
        <div className="lg:col-span-2 glass rounded-2xl p-5 card-glow">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-semibold text-white">روند عملکرد پرتفولیو</h3>
              <p className="text-xs text-slate-500 mt-0.5">امتیاز ترکیبی ۱۲ ماه اخیر</p>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-400 text-sm font-medium">
              <ArrowUp className="w-4 h-4" />
              +۱۸ امتیاز
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={portfolioSummary.performanceTrend}>
              <defs>
                <linearGradient id="perfGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3d52ff" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3d52ff" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} domain={[55, 95]} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="value" name="امتیاز" stroke="#3d52ff" fill="url(#perfGrad)" strokeWidth={2.5} dot={false} activeDot={{ r: 5, fill: '#3d52ff' }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Sector allocation */}
        <div className="glass rounded-2xl p-5 card-glow">
          <h3 className="text-sm font-semibold text-white mb-1">توزیع بخشی</h3>
          <p className="text-xs text-slate-500 mb-4">بر اساس دارایی</p>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={sectorData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                {sectorData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} stroke="transparent" />
                ))}
              </Pie>
              <Tooltip formatter={(value: any) => [`${value}٪`, 'سهم']} contentStyle={{ background: '#111827', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '11px', color: '#f0f4ff' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
            {sectorData.slice(0, 5).map((s) => (
              <div key={s.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                  <span className="text-slate-400 truncate">{s.name}</span>
                </div>
                <span className="text-slate-300 font-medium">{s.value}٪</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Subsidiary comparison & radar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass rounded-2xl p-5 card-glow">
          <h3 className="text-sm font-semibold text-white mb-1">مقایسه امتیازات شرکت‌های تابعه</h3>
          <p className="text-xs text-slate-500 mb-4">مالی | حاکمیتی | ESG</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={compareData} barCategoryGap="25%">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 9 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} domain={[0, 100]} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '11px', color: '#94a3b8', paddingTop: '8px' }} />
              <Bar dataKey="مالی" fill="#3d52ff" radius={[4, 4, 0, 0]} />
              <Bar dataKey="حاکمیتی" fill="#00d4ff" radius={[4, 4, 0, 0]} />
              <Bar dataKey="ESG" fill="#00e5b0" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass rounded-2xl p-5 card-glow">
          <h3 className="text-sm font-semibold text-white mb-1">نمودار رادار گروه</h3>
          <p className="text-xs text-slate-500 mb-2">میانگین شاخص‌های کلیدی</p>
          <ResponsiveContainer width="100%" height={240}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="rgba(255,255,255,0.08)" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#374151', fontSize: 8 }} />
              <Radar name="گروه" dataKey="value" stroke="#3d52ff" fill="#3d52ff" fillOpacity={0.2} strokeWidth={2} />
              <Tooltip content={<CustomTooltip />} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Subsidiaries quick overview */}
      <div className="glass rounded-2xl p-5 card-glow">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-white">وضعیت شرکت‌های تابعه</h3>
            <p className="text-xs text-slate-500 mt-0.5">نمای سریع — بالاتر/پایین‌تر از میانگین گروه</p>
          </div>
          <button
            onClick={() => setActiveView('subsidiaries')}
            className="text-xs text-brand-400 hover:text-brand-300 transition-colors"
          >
            مشاهده همه ←
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          {subsidiaries.map((sub) => {
            const sc = getStatusConfig(sub.status);
            const isAboveAvg = sub.overallScore > avgScore;
            return (
              <button
                key={sub.id}
                onClick={() => { setSelectedSubsidiary(sub); setActiveView('subsidiaries'); }}
                className="text-right p-3.5 rounded-xl bg-white/3 border border-white/5 hover:border-white/15 hover:bg-white/5 transition-all group"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${sc.bg} ${sc.color}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                    {sc.label}
                  </div>
                  <div className={`flex items-center gap-0.5 text-xs font-medium ${isAboveAvg ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {isAboveAvg ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                    {Math.abs(sub.overallScore - avgScore).toFixed(0)}
                  </div>
                </div>
                <p className="text-sm font-medium text-white group-hover:text-brand-300 transition-colors truncate">{sub.name}</p>
                <p className="text-xs text-slate-500 mt-0.5 truncate">{sub.nameEn}</p>
                <div className="flex items-center gap-3 mt-2.5">
                  <div className="flex-1">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-500">امتیاز</span>
                      <span className={getScoreColor(sub.overallScore)}>{sub.overallScore}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-brand-600 to-cyan-500 transition-all"
                        style={{ width: `${sub.overallScore}%` }}
                      />
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Recent recommendations & anomalies */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top recommendations */}
        <div className="glass rounded-2xl p-5 card-glow">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white">توصیه‌های اولویت‌دار</h3>
              <p className="text-xs text-slate-500">هوش مصنوعی | نیاز به اقدام فوری</p>
            </div>
            <button onClick={() => setActiveView('ai-assistant')} className="text-xs text-brand-400 hover:text-brand-300">بیشتر ←</button>
          </div>
          <div className="space-y-2.5">
            {recommendations.slice(0, 3).map((rec) => {
              const priorityConfig = {
                critical: { color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/20', dot: 'bg-rose-400' },
                high: { color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', dot: 'bg-amber-400' },
                medium: { color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20', dot: 'bg-blue-400' },
                low: { color: 'text-slate-400', bg: 'bg-slate-500/10 border-slate-500/20', dot: 'bg-slate-400' },
              }[rec.priority];
              return (
                <div key={rec.id} className={`p-3 rounded-xl border ${priorityConfig.bg}`}>
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="text-sm font-medium text-white leading-tight">{rec.title}</p>
                    <span className={`text-xs font-bold flex-shrink-0 ${priorityConfig.color}`}>
                      {rec.confidence}٪
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">{rec.description}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                    <span>⏱ {rec.timeframe}</span>
                    <span>💡 {rec.estimatedImpact.slice(0, 30)}...</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Market anomalies */}
        <div className="glass rounded-2xl p-5 card-glow">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white">ناهنجاری‌های بازار</h3>
              <p className="text-xs text-slate-500">تشخیص خودکار الگوهای غیرعادی</p>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-rose-500/10 border border-rose-500/20">
              <Zap className="w-3 h-3 text-rose-400" />
              <span className="text-xs text-rose-400">{marketAnomalies.length} مورد</span>
            </div>
          </div>
          <div className="space-y-2.5">
            {marketAnomalies.map((anom) => {
              const sevConfig = {
                high: { color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/20' },
                medium: { color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
                low: { color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
              }[anom.severity];
              const typeLabels: Record<string, string> = {
                volume_spike: 'جهش حجم', price_deviation: 'انحراف قیمت',
                volatility_surge: 'افزایش نوسان', correlation_break: 'شکست همبستگی',
              };
              return (
                <div key={anom.id} className={`p-3 rounded-xl border ${sevConfig.bg}`}>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-white">{anom.subsidiaryName}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${sevConfig.bg} ${sevConfig.color} border`}>
                      {typeLabels[anom.type]}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{anom.description}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs">
                    <span className="text-slate-500">پایه: {anom.baseline.toLocaleString('fa-IR')}</span>
                    <span className={sevConfig.color}>جاری: {anom.current.toLocaleString('fa-IR')}</span>
                    <span className="font-bold text-white">{anom.deviation > 0 ? '+' : ''}{anom.deviation}٪</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
