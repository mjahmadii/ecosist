'use client';
import { Bell, Search, RefreshCw, Clock } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { useState } from 'react';

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
};

export default function Header() {
  const { activeView, holdingData } = useAppStore();
  const [refreshing, setRefreshing] = useState(false);

  const alerts = holdingData?.subsidiaries.flatMap((s) => s.alerts).filter((a) => !a.acknowledged) ?? [];

  const handleRefresh = async () => {
    setRefreshing(true);
    await new Promise((r) => setTimeout(r, 1000));
    setRefreshing(false);
  };

  const now = new Date();
  const dateStr = now.toLocaleDateString('fa-IR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <header className="h-16 border-b border-white/5 bg-[#0d1117]/80 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-semibold text-white">{viewTitles[activeView] ?? activeView}</h2>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-slate-400">زنده</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <Clock className="w-3.5 h-3.5" />
          <span>{dateStr}</span>
        </div>

        <button
          onClick={handleRefresh}
          className="p-2 rounded-xl hover:bg-white/5 text-slate-400 hover:text-slate-200 transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
        </button>

        <div className="relative">
          <button className="p-2 rounded-xl hover:bg-white/5 text-slate-400 hover:text-slate-200 transition-all">
            <Bell className="w-4 h-4" />
          </button>
          {alerts.length > 0 && (
            <span className="notification-badge">{alerts.length}</span>
          )}
        </div>

        <div className="flex items-center gap-2.5 pr-3 border-r border-white/10">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-600 to-cyan-500 flex items-center justify-center text-white text-sm font-bold">
            م
          </div>
          <div className="hidden sm:block">
            <p className="text-xs font-medium text-white">مدیرعامل گروه</p>
            <p className="text-xs text-slate-500">Ehsan</p>
          </div>
        </div>
      </div>
    </header>
  );
}
