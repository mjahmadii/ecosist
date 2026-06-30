'use client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { Shield, AlertTriangle, CheckCircle, Clock, Users } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { getScoreColor } from '@/utils';

export default function GovernanceView() {
  const { holdingData } = useAppStore();
  if (!holdingData) return null;
  const { subsidiaries } = holdingData;

  const govBarData = subsidiaries.map((s) => ({
    name: s.name,
    استقلال: s.governance.boardIndependence,
    حسابرسی: s.governance.auditQuality,
    شفافیت: s.governance.disclosureScore,
    ریسک: s.governance.riskManagement,
    حضور: s.governance.boardMeetingAttendance,
  }));

  const avgGov = {
    boardIndependence: Math.round(subsidiaries.reduce((s, c) => s + c.governance.boardIndependence, 0) / subsidiaries.length),
    auditQuality: Math.round(subsidiaries.reduce((s, c) => s + c.governance.auditQuality, 0) / subsidiaries.length),
    disclosureScore: Math.round(subsidiaries.reduce((s, c) => s + c.governance.disclosureScore, 0) / subsidiaries.length),
    shareholderRights: Math.round(subsidiaries.reduce((s, c) => s + c.governance.shareholderRights, 0) / subsidiaries.length),
    riskManagement: Math.round(subsidiaries.reduce((s, c) => s + c.governance.riskManagement, 0) / subsidiaries.length),
  };

  const radarData = [
    { subject: 'استقلال هیئت', value: avgGov.boardIndependence },
    { subject: 'کیفیت حسابرسی', value: avgGov.auditQuality },
    { subject: 'شفافیت', value: avgGov.disclosureScore },
    { subject: 'حقوق سهامداران', value: avgGov.shareholderRights },
    { subject: 'مدیریت ریسک', value: avgGov.riskManagement },
  ];

  const issues = subsidiaries.flatMap((s) => {
    const items = [];
    if (s.governance.boardIndependence < 60) items.push({ sub: s.name, issue: 'استقلال هیئت مدیره پایین', severity: 'critical' });
    if (s.governance.ceoTenureYears > 7) items.push({ sub: s.name, issue: `مدت تصدی مدیرعامل ${s.governance.ceoTenureYears} سال`, severity: 'warning' });
    if (s.governance.boardMeetingAttendance < 85) items.push({ sub: s.name, issue: 'نرخ حضور پایین در جلسات', severity: 'warning' });
    if (s.governance.femaleDirectors === 0) items.push({ sub: s.name, issue: 'فاقد عضو زن در هیئت مدیره', severity: 'info' });
    return items;
  });

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'میانگین استقلال هیئت', val: avgGov.boardIndependence, suffix: '٪', icon: Shield },
          { label: 'میانگین کیفیت حسابرسی', val: avgGov.auditQuality, icon: CheckCircle },
          { label: 'میانگین شفافیت', val: avgGov.disclosureScore, icon: AlertTriangle },
          { label: 'میانگین مدیریت ریسک', val: avgGov.riskManagement, icon: Clock },
        ].map(({ label, val, suffix = '', icon: Icon }) => (
          <div key={label} className="glass rounded-2xl p-4 border border-white/10 card-glow">
            <Icon className={`w-5 h-5 mb-3 ${getScoreColor(val)}`} />
            <p className={`text-2xl font-bold ${getScoreColor(val)}`}>{val}{suffix}</p>
            <p className="text-xs text-slate-400 mt-1">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar chart */}
        <div className="glass rounded-2xl p-5 card-glow">
          <h3 className="text-sm font-semibold text-white mb-4">مقایسه شاخص‌های حاکمیتی</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={govBarData} layout="vertical" barCategoryGap="15%">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} />
              <YAxis dataKey="name" type="category" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} width={90} />
              <Tooltip contentStyle={{ background: '#111827', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '11px', color: '#f0f4ff' }} />
              <Bar dataKey="استقلال" fill="#3d52ff" radius={[0, 3, 3, 0]} />
              <Bar dataKey="حسابرسی" fill="#00d4ff" radius={[0, 3, 3, 0]} />
              <Bar dataKey="شفافیت" fill="#00e5b0" radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Radar */}
        <div className="glass rounded-2xl p-5 card-glow">
          <h3 className="text-sm font-semibold text-white mb-4">پروفایل حاکمیتی گروه</h3>
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="rgba(255,255,255,0.08)" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#374151', fontSize: 8 }} />
              <Radar dataKey="value" stroke="#3d52ff" fill="#3d52ff" fillOpacity={0.2} strokeWidth={2} />
              <Tooltip contentStyle={{ background: '#111827', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', fontSize: '11px', color: '#f0f4ff' }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Issues */}
      <div className="glass rounded-2xl p-5 card-glow">
        <h3 className="text-sm font-semibold text-white mb-4">مسائل حاکمیتی شناسایی‌شده</h3>
        <div className="space-y-2">
          {issues.length === 0 ? (
            <div className="text-center py-6 text-slate-500">بدون مسئله حاکمیتی</div>
          ) : issues.map((item, i) => {
            const sc = { critical: 'bg-rose-500/10 border-rose-500/20 text-rose-400', warning: 'bg-amber-500/10 border-amber-500/20 text-amber-400', info: 'bg-blue-500/10 border-blue-500/20 text-blue-400' }[item.severity];
            return (
              <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border ${sc}`}>
                <div className={`w-2 h-2 rounded-full ${item.severity === 'critical' ? 'bg-rose-400' : item.severity === 'warning' ? 'bg-amber-400' : 'bg-blue-400'} flex-shrink-0`} />
                <span className="text-sm font-medium text-white">{item.sub}</span>
                <span className="text-xs text-slate-400">{item.issue}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
