'use client';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/utils';

type Color = 'brand' | 'cyan' | 'emerald' | 'amber' | 'rose' | 'violet' | 'gold';

interface Props {
  title: string;
  value: string | number;
  subtitle?: string;
  change?: number;
  changeLabel?: string;
  icon?: React.FC<{ className?: string }>;
  color?: Color;
  size?: 'sm' | 'md' | 'lg';
  suffix?: string;
  badge?: string;
  loading?: boolean;
}

const colorMap: Record<Color, { accent: string; bg: string; border: string; glow: string }> = {
  brand:   { accent: '#6479ff', bg: 'rgba(61,82,255,0.1)',  border: 'rgba(61,82,255,0.18)',  glow: 'rgba(61,82,255,0.12)' },
  cyan:    { accent: '#22d3ee', bg: 'rgba(0,212,255,0.1)',  border: 'rgba(0,212,255,0.18)',  glow: 'rgba(0,212,255,0.1)' },
  emerald: { accent: '#34d399', bg: 'rgba(0,196,140,0.1)',  border: 'rgba(0,196,140,0.18)',  glow: 'rgba(0,196,140,0.1)' },
  amber:   { accent: '#fbbf24', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.18)', glow: 'rgba(245,158,11,0.08)' },
  rose:    { accent: '#fb7185', bg: 'rgba(244,63,94,0.1)',  border: 'rgba(244,63,94,0.18)',  glow: 'rgba(244,63,94,0.08)' },
  violet:  { accent: '#a78bfa', bg: 'rgba(139,92,246,0.1)', border: 'rgba(139,92,246,0.18)', glow: 'rgba(139,92,246,0.08)' },
  gold:    { accent: '#fde68a', bg: 'rgba(217,119,6,0.1)',  border: 'rgba(217,119,6,0.18)',  glow: 'rgba(217,119,6,0.08)' },
};

export default function KPICard({ title, value, subtitle, change, changeLabel, icon: Icon, color = 'brand', size = 'md', suffix, badge, loading }: Props) {
  const c = colorMap[color];

  if (loading) {
    return (
      <div className="card p-5">
        <div className="shimmer h-4 w-24 rounded mb-3" style={{ height: 14, marginBottom: 12 }} />
        <div className="shimmer h-8 w-32 rounded mb-2" style={{ height: 32, marginBottom: 8 }} />
        <div className="shimmer h-3 w-20 rounded" style={{ height: 12 }} />
      </div>
    );
  }

  const changeDir = change === undefined ? null : change > 0 ? 'up' : change < 0 ? 'down' : 'flat';

  return (
    <div
      className="card card-hover p-5 relative overflow-hidden group"
      style={{ borderColor: c.border }}
    >
      <div
        className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ background: `radial-gradient(circle at 75% 15%, ${c.glow} 0%, transparent 60%)` }}
      />
      <div className="relative">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-3)', letterSpacing: '0.08em' }}>
              {title}
            </p>
            {badge && (
              <span className="inline-block mt-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: c.bg, color: c.accent, border: `1px solid ${c.border}` }}>
                {badge}
              </span>
            )}
          </div>
          {Icon && (
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: c.bg, border: `1px solid ${c.border}` }}>
              <Icon className="w-[18px] h-[18px]" style={{ color: c.accent } as React.CSSProperties} />
            </div>
          )}
        </div>

        <div className="flex items-end gap-2 mb-2.5">
          <span
            className={cn('font-bold tabular-nums leading-none', size === 'lg' ? 'text-3xl' : size === 'sm' ? 'text-xl' : 'text-[1.625rem]')}
            style={{ color: 'var(--text-1)' }}
          >
            {value}
          </span>
          {suffix && <span className="text-sm mb-0.5" style={{ color: 'var(--text-3)' }}>{suffix}</span>}
        </div>

        <div className="flex items-center justify-between gap-2">
          {subtitle && <p className="text-xs leading-relaxed" style={{ color: 'var(--text-2)' }}>{subtitle}</p>}
          {change !== undefined && (
            <div
              className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold flex-shrink-0"
              style={
                changeDir === 'up'
                  ? { background: 'rgba(0,196,140,0.12)', color: '#34d399', border: '1px solid rgba(0,196,140,0.2)' }
                  : changeDir === 'down'
                  ? { background: 'rgba(244,63,94,0.12)', color: '#fb7185', border: '1px solid rgba(244,63,94,0.2)' }
                  : { background: 'var(--surface-2)', color: 'var(--text-3)', border: '1px solid var(--border)' }
              }
            >
              {changeDir === 'up' ? <TrendingUp className="w-3 h-3" /> : changeDir === 'down' ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
              {Math.abs(change ?? 0).toFixed(1)}٪
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
