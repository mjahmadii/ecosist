'use client';
import { useState } from 'react';
import { Search, Filter, Download, Building2, Users, TrendingUp, ArrowUp, ArrowDown, X, ChevronDown } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import {
  formatCurrency, getStatusConfig, getSectorLabel, getSectorColor, getScoreColor, getScoreBg,
  calcDebtRatio, calcCurrentRatio, calcROE, calcNetMargin, exportDashboardReport,
} from '@/utils';
import type { Subsidiary } from '@/types';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar,
} from 'recharts';

function ScoreBadge({ score }: { score: number }) {
  return (
    <span className={`px-2.5 py-1 rounded-lg text-sm font-bold border ${getScoreBg(score)} ${getScoreColor(score)}`}>
      {score}
    </span>
  );
}

function SubsidiaryDetail({ sub, onClose }: { sub: Subsidiary; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<'financial' | 'governance' | 'esg' | 'board' | 'alerts'>('financial');
  const latest = sub.financials[sub.financials.length - 1];
  const tabs = [
    { id: 'financial', label: 'مالی' },
    { id: 'governance', label: 'حاکمیت' },
    { id: 'esg', label: 'ESG' },
    { id: 'board', label: 'هیئت مدیره' },
    { id: 'alerts', label: `هشدارها (${sub.alerts.filter(a => !a.acknowledged).length})` },
  ] as const;

  const { acknowledgeAlert } = useAppStore();

  const zConfig = {
    safe: { color: 'text-emerald-400', label: 'امن', bg: 'bg-emerald-500/10' },
    grey: { color: 'text-amber-400', label: 'خاکستری', bg: 'bg-amber-500/10' },
    distress: { color: 'text-rose-400', label: 'پریشان', bg: 'bg-rose-500/10' },
  }[sub.altmanZ.bankruptcyRisk];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-2xl h-full bg-[#0d1117] border-l border-white/10 overflow-y-auto animate-slide-in-right" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="sticky top-0 bg-[#0d1117]/95 backdrop-blur-md border-b border-white/10 p-5 z-10">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">{sub.name}</h2>
              <p className="text-sm text-slate-400 mt-0.5">{sub.nameEn}</p>
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
                <div className="text-center py-8 text-slate-500 text-sm">بدون هشدار فعال</div>
              ) : (
                sub.alerts.map((alert) => {
                  const sc = {
                    critical: { color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/20' },
                    warning: { color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
                    info: { color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
                  }[alert.severity];
                  return (
                    <div key={alert.id} className={`p-4 rounded-xl border ${sc.bg} ${alert.acknowledged ? 'opacity-40' : ''}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className={`text-sm font-medium ${sc.color}`}>{alert.title}</p>
                          <p className="text-xs text-slate-400 mt-1 leading-relaxed">{alert.description}</p>
                        </div>
                        {!alert.acknowledged && (
                          <button
                            onClick={() => acknowledgeAlert(sub.id, alert.id)}
                            className="text-xs text-slate-500 hover:text-slate-300 px-2 py-1 rounded-lg hover:bg-white/5 transition-all flex-shrink-0 mr-2"
                          >
                            تأیید
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
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

  return (
    <div className="p-6 space-y-5 animate-fade-in">
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
          onClick={() => exportDashboardReport(holdingData.subsidiaries)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600/20 border border-brand-500/30 text-brand-300 text-sm hover:bg-brand-600/30 transition-all"
        >
          <Download className="w-4 h-4" />
          خروجی Excel
        </button>
      </div>

      {/* Table */}
      <div className="glass rounded-2xl border border-white/5 overflow-hidden card-glow">
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
    </div>
  );
}
