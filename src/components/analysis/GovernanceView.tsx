'use client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar, Legend } from 'recharts';
import { Shield, AlertTriangle, CheckCircle, Users, TrendingUp, Award, ChevronRight } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import KPICard from '@/components/dashboard/KPICard';
import ContextChat from '@/components/ui/ContextChat';
import ExportMenu from '@/components/ui/ExportMenu';
import { FileSpreadsheet, FileText, Table } from 'lucide-react';
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

export default function GovernanceView() {
  const { holdingData } = useAppStore();
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

  const contextData = `
حاکمیت شرکتی گروه — میانگین امتیاز: ${avgGovernanceScore.toFixed(1)}
میانگین استقلال هیئت مدیره: ${avgBoardIndependence.toFixed(1)}٪
شرکت‌های با حاکمیت خوب (>75): ${highGovernance}
شرکت‌های با حاکمیت ضعیف (<60): ${lowGovernance}
${subsidiaries.map((s) => `${s.name}: ${s.governanceScore}`).join(' | ')}
  `.trim();

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

      <ContextChat moduleId="governance" contextData={contextData} quickPrompts={QUICK_PROMPTS} title="دستیار حاکمیت" />
    </div>
  );
}
