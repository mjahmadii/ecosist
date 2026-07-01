'use client';
import { Bell, RefreshCw, Clock, User } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { useState } from 'react';
import ThemeToggle from '@/components/ui/ThemeToggle';

const viewTitles: Record<string, string> = {
  dashboard: 'داشبورد اجرایی',
  subsidiaries: 'شرکت‌های تابعه',
  analysis: 'تحلیل مالی پیشرفته',
  'ai-assistant': 'دستیار هوشمند AI',
  governance: 'حاکمیت شرکتی',
  esg: 'گزارش ESG و پایداری',
  risk: 'مدیریت ریسک',
  capital: 'بهینه‌سازی سرمایه',
  data: 'داده‌ها و گزارش‌ها',
  settings: 'تنظیمات سیستم',
  'prompt-manager': 'مدیریت پرامپت‌های AI',
};

export default function Header() {
  const { activeView, holdingData } = useAppStore();
  const [refreshing, setRefreshing] = useState(false);
  const [showAlerts, setShowAlerts] = useState(false);

  const allAlerts = holdingData?.subsidiaries.flatMap((s) => s.alerts).filter((a) => !a.acknowledged) ?? [];

  const handleRefresh = async () => {
    setRefreshing(true);
    await new Promise((r) => setTimeout(r, 1000));
    setRefreshing(false);
  };

  const now = new Date();
  const dateStr = now.toLocaleDateString('fa-IR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <header
      className="h-14 flex items-center justify-between px-5 sticky top-0 z-30 no-print"
      style={{ background: 'var(--header-bg)', borderBottom: '1px solid var(--border)', backdropFilter: 'blur(16px)' }}
    >
      {/* Title */}
      <div className="flex items-center gap-3">
        <h2 className="text-[0.9375rem] font-semibold" style={{ color: 'var(--text-1)' }}>
          {viewTitles[activeView] ?? activeView}
        </h2>
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full"
          style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs" style={{ color: 'var(--text-3)' }}>زنده</span>
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        {/* Date */}
        <div className="hidden lg:flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full"
          style={{ background: 'var(--surface-2)', color: 'var(--text-3)', border: '1px solid var(--border)' }}>
          <Clock className="w-3.5 h-3.5" />
          {dateStr}
        </div>

        {/* Theme toggle */}
        <ThemeToggle />

        {/* Refresh */}
        <button
          onClick={handleRefresh}
          className="btn btn-ghost btn-icon"
          title="بروزرسانی"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} style={{ color: 'var(--text-2)' }} />
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowAlerts((v) => !v)}
            className="btn btn-ghost btn-icon"
            title="اعلان‌ها"
          >
            <Bell className="w-4 h-4" style={{ color: 'var(--text-2)' }} />
          </button>
          {allAlerts.length > 0 && (
            <span className="notif-badge">{allAlerts.length > 9 ? '9+' : allAlerts.length}</span>
          )}

          {showAlerts && allAlerts.length > 0 && (
            <div
              className="absolute left-0 top-full mt-2 w-80 rounded-2xl overflow-hidden z-50 animate-scale-in"
              style={{ background: 'var(--modal-bg)', border: '1px solid var(--border-2)', boxShadow: '0 16px 48px rgba(0,0,0,0.4)' }}
            >
              <div className="p-3 border-b" style={{ borderColor: 'var(--border)' }}>
                <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>
                  اعلان‌های فعال
                </p>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {allAlerts.slice(0, 6).map((alert) => (
                  <div key={alert.id} className="p-3 border-b last:border-0 hover:bg-[var(--surface-2)] transition-colors"
                    style={{ borderColor: 'var(--border)' }}>
                    <div className="flex items-start gap-2.5">
                      <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${alert.severity === 'critical' ? 'bg-rose-400' : alert.severity === 'warning' ? 'bg-amber-400' : 'bg-blue-400'}`} />
                      <div>
                        <p className="text-xs font-medium" style={{ color: 'var(--text-1)' }}>{alert.title}</p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>{alert.description.slice(0, 60)}...</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {allAlerts.length > 6 && (
                <div className="p-2 text-center text-xs" style={{ color: 'var(--text-3)' }}>
                  +{allAlerts.length - 6} اعلان دیگر
                </div>
              )}
            </div>
          )}
        </div>

        {/* User */}
        <div className="flex items-center gap-2 pr-2" style={{ borderRight: '1px solid var(--border)' }}>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-sm font-bold"
            style={{ background: 'linear-gradient(135deg, #3d52ff, #00d4ff)' }}>
            م
          </div>
          <div className="hidden md:block">
            <p className="text-xs font-semibold leading-tight" style={{ color: 'var(--text-1)' }}>مدیرعامل</p>
            <p className="text-xs leading-tight" style={{ color: 'var(--text-3)' }}>Ehsan</p>
          </div>
        </div>
      </div>
    </header>
  );
}
