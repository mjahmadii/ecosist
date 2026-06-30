'use client';
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { Leaf, Wind, Users, Shield, Award, TrendingUp } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { getScoreColor } from '@/utils';

const RATING_COLORS: Record<string, string> = {
  AAA: '#00e5b0', AA: '#10b981', A: '#34d399', BBB: '#60a5fa', BB: '#f59e0b', B: '#f97316', CCC: '#ff3d6e',
};

export default function ESGView() {
  const { holdingData } = useAppStore();
  if (!holdingData) return null;

  const { subsidiaries } = holdingData;
  const avgESG = {
    environmental: Math.round(subsidiaries.reduce((s, c) => s + Object.values(c.esg.environmental).reduce((a, b) => a + b, 0) / 5, 0) / subsidiaries.length),
    social: Math.round(subsidiaries.reduce((s, c) => s + Object.values(c.esg.social).reduce((a, b) => a + b, 0) / 5, 0) / subsidiaries.length),
    governance: Math.round(subsidiaries.reduce((s, c) => s + Object.values(c.esg.governance).reduce((a, b) => a + b, 0) / 5, 0) / subsidiaries.length),
    overall: Math.round(subsidiaries.reduce((s, c) => s + c.esg.overallScore, 0) / subsidiaries.length),
  };

  const radarData = [
    { subject: 'انتشار کربن', value: Math.round(subsidiaries.reduce((s, c) => s + c.esg.environmental.carbonEmissions, 0) / subsidiaries.length) },
    { subject: 'بهره‌وری انرژی', value: Math.round(subsidiaries.reduce((s, c) => s + c.esg.environmental.energyEfficiency, 0) / subsidiaries.length) },
    { subject: 'رضایت کارکنان', value: Math.round(subsidiaries.reduce((s, c) => s + c.esg.social.employeeSatisfaction, 0) / subsidiaries.length) },
    { subject: 'تنوع جنسیتی', value: Math.round(subsidiaries.reduce((s, c) => s + c.esg.social.genderDiversityRatio, 0) / subsidiaries.length) },
    { subject: 'شفافیت', value: Math.round(subsidiaries.reduce((s, c) => s + c.esg.governance.transparencyScore, 0) / subsidiaries.length) },
    { subject: 'مبارزه با فساد', value: Math.round(subsidiaries.reduce((s, c) => s + c.esg.governance.anticorruptionMeasures, 0) / subsidiaries.length) },
  ];

  const esgBarData = subsidiaries.map((s) => ({
    name: s.name,
    محیط: Math.round(Object.values(s.esg.environmental).reduce((a, b) => a + b, 0) / 5),
    اجتماعی: Math.round(Object.values(s.esg.social).slice(0, 5).reduce((a, b) => a + b, 0) / 5),
    حاکمیت: Math.round(Object.values(s.esg.governance).reduce((a, b) => a + b, 0) / 5),
    کلی: s.esg.overallScore,
  }));

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'امتیاز کلی ESG', value: avgESG.overall, icon: Leaf, color: 'text-emerald-400', bg: 'from-emerald-600/20 to-emerald-900/10 border-emerald-500/20' },
          { label: 'محیط زیست', value: avgESG.environmental, icon: Wind, color: 'text-cyan-400', bg: 'from-cyan-600/20 to-cyan-900/10 border-cyan-500/20' },
          { label: 'اجتماعی', value: avgESG.social, icon: Users, color: 'text-violet-400', bg: 'from-violet-600/20 to-violet-900/10 border-violet-500/20' },
          { label: 'حاکمیتی', value: avgESG.governance, icon: Shield, color: 'text-brand-400', bg: 'from-brand-600/20 to-brand-900/10 border-brand-500/20' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className={`rounded-2xl p-5 bg-gradient-to-br border ${bg} card-glow`}>
            <div className="flex items-center justify-between mb-3">
              <Icon className={`w-5 h-5 ${color}`} />
              <span className={`text-xs px-2 py-0.5 rounded-full ${value >= 70 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                {value >= 80 ? 'عالی' : value >= 65 ? 'خوب' : value >= 50 ? 'متوسط' : 'ضعیف'}
              </span>
            </div>
            <p className={`text-3xl font-bold ${color}`}>{value}</p>
            <p className="text-sm text-slate-400 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* ESG ratings + radar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ratings table */}
        <div className="glass rounded-2xl p-5 card-glow">
          <h3 className="text-sm font-semibold text-white mb-4">رتبه‌بندی ESG شرکت‌های تابعه</h3>
          <div className="space-y-3">
            {[...subsidiaries].sort((a, b) => b.esg.overallScore - a.esg.overallScore).map((sub) => (
              <div key={sub.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/3 border border-white/5">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
                  style={{ background: RATING_COLORS[sub.esg.rating] + '25', color: RATING_COLORS[sub.esg.rating] }}
                >
                  {sub.esg.rating}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{sub.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-1.5 rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${sub.esg.overallScore}%`,
                          background: `linear-gradient(to right, ${RATING_COLORS[sub.esg.rating]}, ${RATING_COLORS[sub.esg.rating]}88)`,
                        }}
                      />
                    </div>
                    <span className={`text-xs font-bold ${getScoreColor(sub.esg.overallScore)}`}>{sub.esg.overallScore}</span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="flex gap-1 text-xs">
                    <span className="text-cyan-400" title="محیط">
                      🌱{Math.round(Object.values(sub.esg.environmental).reduce((a, b) => a + b, 0) / 5)}
                    </span>
                    <span className="text-violet-400" title="اجتماعی">
                      👥{Math.round(Object.values(sub.esg.social).slice(0, 5).reduce((a, b) => a + b, 0) / 5)}
                    </span>
                    <span className="text-brand-400" title="حاکمیت">
                      🏛{Math.round(Object.values(sub.esg.governance).reduce((a, b) => a + b, 0) / 5)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Radar */}
        <div className="glass rounded-2xl p-5 card-glow">
          <h3 className="text-sm font-semibold text-white mb-1">نمودار رادار ESG گروه</h3>
          <p className="text-xs text-slate-500 mb-2">میانگین شاخص‌های محیط زیستی، اجتماعی و حاکمیتی</p>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="rgba(255,255,255,0.08)" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#374151', fontSize: 9 }} />
              <Radar name="میانگین گروه" dataKey="value" stroke="#00e5b0" fill="#00e5b0" fillOpacity={0.15} strokeWidth={2.5} />
              <Tooltip contentStyle={{ background: '#111827', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '11px', color: '#f0f4ff' }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ESG Bar comparison */}
      <div className="glass rounded-2xl p-5 card-glow">
        <h3 className="text-sm font-semibold text-white mb-1">مقایسه سه‌گانه ESG</h3>
        <p className="text-xs text-slate-500 mb-4">محیط زیست | اجتماعی | حاکمیت — همه شرکت‌های تابعه</p>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={esgBarData} barCategoryGap="25%">
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} domain={[0, 100]} />
            <Tooltip contentStyle={{ background: '#111827', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '11px', color: '#f0f4ff' }} />
            <Legend wrapperStyle={{ fontSize: '11px', color: '#94a3b8', paddingTop: '8px' }} />
            <Bar dataKey="محیط" fill="#00d4ff" radius={[3, 3, 0, 0]} />
            <Bar dataKey="اجتماعی" fill="#8b5cf6" radius={[3, 3, 0, 0]} />
            <Bar dataKey="حاکمیت" fill="#3d52ff" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ESG Improvement Opportunities */}
      <div className="glass rounded-2xl p-5 card-glow">
        <h3 className="text-sm font-semibold text-white mb-4">
          <span className="flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-400" />
            فرصت‌های بهبود ESG
          </span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              title: 'کاهش انتشار کربن',
              target: 'معادن سپه و ساختمانی سپه',
              action: 'سرمایه‌گذاری در تجهیزات کم‌کربن',
              impact: '+۱۵ امتیاز E',
              color: 'border-cyan-500/20 bg-cyan-500/5',
              icon: '🌱',
            },
            {
              title: 'افزایش تنوع جنسیتی',
              target: 'معادن سپه (۱۵٪) و ساختمانی (۱۸٪)',
              action: 'برنامه جذب و ارتقای زنان',
              impact: '+۱۲ امتیاز S',
              color: 'border-violet-500/20 bg-violet-500/5',
              icon: '👥',
            },
            {
              title: 'گزارش‌دهی یکپارچه ESG',
              target: 'همه شرکت‌های تابعه',
              action: 'پیاده‌سازی استاندارد GRI',
              impact: '+۸ امتیاز G',
              color: 'border-brand-500/20 bg-brand-500/5',
              icon: '📋',
            },
          ].map(({ title, target, action, impact, color, icon }) => (
            <div key={title} className={`p-4 rounded-xl border ${color}`}>
              <div className="text-2xl mb-2">{icon}</div>
              <p className="text-sm font-semibold text-white mb-1">{title}</p>
              <p className="text-xs text-slate-400 mb-2">{target}</p>
              <p className="text-xs text-slate-300 mb-3">{action}</p>
              <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">{impact}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
