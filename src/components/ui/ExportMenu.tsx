'use client';
import { useState, useRef, useEffect } from 'react';
import { Download, FileSpreadsheet, FileText, Table, ChevronDown, Check } from 'lucide-react';
import { cn } from '@/utils';

interface ExportOption {
  label: string;
  format: string;
  icon: React.FC<{ className?: string }>;
  color: string;
  action: () => void;
}

interface Props {
  options: ExportOption[];
  label?: string;
  size?: 'sm' | 'md';
}

export default function ExportMenu({ options, label = 'صدور گزارش', size = 'md' }: Props) {
  const [open, setOpen] = useState(false);
  const [exported, setExported] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleExport = async (opt: ExportOption) => {
    opt.action();
    setExported(opt.format);
    setOpen(false);
    setTimeout(() => setExported(null), 2500);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn('btn btn-secondary flex items-center gap-2', size === 'sm' && 'btn-sm')}
      >
        {exported ? (
          <><Check className="w-4 h-4 text-emerald-400" /><span className="text-emerald-400">دانلود شد</span></>
        ) : (
          <><Download className={cn('w-4 h-4', size === 'sm' ? 'w-3.5 h-3.5' : '')} />{label}<ChevronDown className={cn('w-3.5 h-3.5 transition-transform', open && 'rotate-180')} /></>
        )}
      </button>

      {open && (
        <div
          className="absolute left-0 top-full mt-2 w-52 rounded-xl py-1.5 z-50 animate-scale-in"
          style={{ background: 'var(--modal-bg)', border: '1px solid var(--border-2)', boxShadow: '0 16px 48px rgba(0,0,0,0.35)' }}
        >
          {options.map((opt) => (
            <button
              key={opt.format}
              onClick={() => handleExport(opt)}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-right transition-colors"
              style={{ color: 'var(--text-1)', fontSize: '0.8125rem' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-2)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '')}
            >
              <opt.icon className="w-4 h-4 flex-shrink-0" style={{ color: opt.color } as React.CSSProperties} />
              <span>{opt.label}</span>
              <span className="mr-auto text-xs font-mono px-1.5 py-0.5 rounded" style={{ background: `${opt.color}18`, color: opt.color }}>
                .{opt.format}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export { FileSpreadsheet, FileText, Table };
