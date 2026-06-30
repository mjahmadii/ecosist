'use client';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/utils';

interface KPICardProps {
  title: string;
  value: string;
  subtitle?: string;
  change?: number;
  changeLabel?: string;
  icon: React.ElementType;
  color?: 'brand' | 'cyan' | 'emerald' | 'amber' | 'rose' | 'violet';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const colorMap = {
  brand: { bg: 'from-brand-600/20 to-brand-800/10', icon: 'bg-brand-600/30 text-brand-300', border: 'border-brand-500/20' },
  cyan: { bg: 'from-cyan-600/20 to-cyan-800/10', icon: 'bg-cyan-600/30 text-cyan-300', border: 'border-cyan-500/20' },
  emerald: { bg: 'from-emerald-600/20 to-emerald-800/10', icon: 'bg-emerald-600/30 text-emerald-300', border: 'border-emerald-500/20' },
  amber: { bg: 'from-amber-600/20 to-amber-800/10', icon: 'bg-amber-600/30 text-amber-300', border: 'border-amber-500/20' },
  rose: { bg: 'from-rose-600/20 to-rose-800/10', icon: 'bg-rose-600/30 text-rose-300', border: 'border-rose-500/20' },
  violet: { bg: 'from-violet-600/20 to-violet-800/10', icon: 'bg-violet-600/30 text-violet-300', border: 'border-violet-500/20' },
};

export default function KPICard({
  title, value, subtitle, change, changeLabel,
  icon: Icon, color = 'brand', size = 'md', className,
}: KPICardProps) {
  const c = colorMap[color];
  const isPositive = (change ?? 0) > 0;
  const isNeutral = change === 0 || change === undefined;

  return (
    <div className={cn(
      `relative overflow-hidden rounded-2xl border bg-gradient-to-br p-5 card-glow transition-all duration-300 cursor-default`,
      c.bg, c.border, className
    )}>
      {/* Subtle glow top right */}
      <div className={cn('absolute -top-6 -right-6 w-24 h-24 rounded-full blur-2xl opacity-20 bg-gradient-to-br', c.bg)} />

      <div className="relative">
        <div className="flex items-start justify-between mb-3">
          <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', c.icon)}>
            <Icon className="w-5 h-5" />
          </div>
          {change !== undefined && (
            <div className={cn(
              'flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
              isNeutral ? 'bg-slate-500/20 text-slate-400' :
              isPositive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
            )}>
              {isNeutral ? <Minus className="w-3 h-3" /> : isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {Math.abs(change).toFixed(1)}٪
            </div>
          )}
        </div>

        <div className={cn(
          'font-bold text-white',
          size === 'lg' ? 'text-3xl' : size === 'sm' ? 'text-xl' : 'text-2xl'
        )}>
          {value}
        </div>

        <div className="mt-1 text-sm text-slate-400">{title}</div>

        {(subtitle || changeLabel) && (
          <div className="mt-2 text-xs text-slate-500">
            {changeLabel ?? subtitle}
          </div>
        )}
      </div>
    </div>
  );
}
