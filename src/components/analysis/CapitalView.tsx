'use client';
import { useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { Wallet, TrendingUp, Shield, Zap } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { getSectorColor, formatCurrency } from '@/utils';

export default function CapitalView() {
  const { capitalScenarios, holdingData } = useAppStore();
  const [selected, setSelected] = useState(capitalScenarios[1].id);

  if (!holdingData) return null;
  const { subsidiaries } = holdingData;
  const scenario = capitalScenarios.find((s) => s.id === selected)!;

  const pieData = scenario.allocations.map((a) => {
    const sub = subsidiaries.find((s) => s.id === a.subsidiaryId);
    return {
      name: sub?.name ?? a.subsidiaryId,
      value: a.percentage,
      amount: a.amount,
      color: getSectorColor(sub?.sector ?? 'technology'),
    };
  });

  const compData = capitalScenarios.map((s) => ({
    name: s.name.replace('سناریو ', ''),
    بازده: s.expectedReturn,
    ریسک: s.risk,
    'شارپ × ۱۰': parseFloat((s.sharpeRatio * 10).toFixed(1)),
  }));

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Scenario selector */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {capitalScenarios.map((sc) => (
          <button
            key={sc.id}
            onClick={() => setSelected(sc.id)}
            className={`p-4 rounded-2xl border text-right transition-all ${
              selected === sc.id
                ? 'bg-brand-600/20 border-brand-500/40 shadow-glow-brand'
                : 'glass border-white/10 hover:border-white/20'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-500">{sc.name}</span>
              {selected === sc.id && <div className="w-2 h-2 rounded-full bg-brand-400 animate-pulse" />}
            </div>
            <div className="grid grid-cols-3 gap-2 mt-2">
              <div className="text-center">
                <p className="text-sm font-bold text-emerald-400">{sc.expectedReturn}٪</p>
                <p className="text-xs text-slate-500">بازده</p>
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-amber-400">{sc.risk}٪</p>
                <p className="text-xs text-slate-500">ریسک</p>
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-cyan-400">{sc.sharpeRatio}</p>
                <p className="text-xs text-slate-500">شارپ</p>
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-2 line-clamp-2">{sc.description}</p>
          </button>
        ))}
      </div>

      {/* Active scenario details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass rounded-2xl p-5 card-glow">
          <h3 className="text-sm font-semibold text-white mb-4">توزیع سرمایه — {scenario.name}</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                {pieData.map((entry, i) => <Cell key={i} fill={entry.color} stroke="transparent" />)}
              </Pie>
              <Tooltip formatter={(v: any, n, props) => [`${v}٪ | ${formatCurrency(props.payload.amount, true)}`, props.payload.name]} contentStyle={{ background: '#111827', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '11px', color: '#f0f4ff' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {pieData.map((d) => (
              <div key={d.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                  <span className="text-slate-400">{d.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">{formatCurrency(d.amount, true)}</span>
                  <span className="text-white font-medium">{d.value}٪</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Scenario comparison */}
        <div className="glass rounded-2xl p-5 card-glow">
          <h3 className="text-sm font-semibold text-white mb-4">مقایسه سناریوها</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={compData} barCategoryGap="25%">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} />
              <Tooltip contentStyle={{ background: '#111827', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '11px', color: '#f0f4ff' }} />
              <Legend wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
              <Bar dataKey="بازده" fill="#00e5b0" radius={[3, 3, 0, 0]} unit="٪" />
              <Bar dataKey="ریسک" fill="#ff3d6e" radius={[3, 3, 0, 0]} unit="٪" />
              <Bar dataKey="شارپ × ۱۰" fill="#3d52ff" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Efficient frontier hint */}
      <div className="glass rounded-2xl p-5 card-glow">
        <h3 className="text-sm font-semibold text-white mb-3">
          <span className="flex items-center gap-2"><Zap className="w-4 h-4 text-amber-400" />توصیه بهینه‌سازی سرمایه</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: '📈', title: 'بالاترین بازده', val: `${Math.max(...capitalScenarios.map(s => s.expectedReturn))}٪`, sub: capitalScenarios.sort((a, b) => b.expectedReturn - a.expectedReturn)[0].name },
            { icon: '🛡️', title: 'کمترین ریسک', val: `${Math.min(...capitalScenarios.map(s => s.risk))}٪`, sub: capitalScenarios.sort((a, b) => a.risk - b.risk)[0].name },
            { icon: '⚖️', title: 'بهترین نسبت شارپ', val: `${Math.max(...capitalScenarios.map(s => s.sharpeRatio))}`, sub: capitalScenarios.sort((a, b) => b.sharpeRatio - a.sharpeRatio)[0].name },
          ].map(({ icon, title, val, sub }) => (
            <div key={title} className="p-4 rounded-xl bg-white/3 border border-white/5">
              <div className="text-2xl mb-2">{icon}</div>
              <p className="text-xl font-bold text-white">{val}</p>
              <p className="text-xs text-slate-400 mt-0.5">{title}</p>
              <p className="text-xs text-brand-400 mt-1">{sub}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
