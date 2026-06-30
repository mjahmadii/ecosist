'use client';
import {
  LayoutDashboard, Building2, TrendingUp, Brain, Shield, Leaf,
  Settings, LogOut, Bell, BarChart3, AlertTriangle, Wallet, ChevronRight,
} from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { cn } from '@/utils';

const navItems = [
  { id: 'dashboard', label: 'داشبورد اجرایی', icon: LayoutDashboard },
  { id: 'subsidiaries', label: 'شرکت‌های تابعه', icon: Building2 },
  { id: 'analysis', label: 'تحلیل مالی', icon: TrendingUp },
  { id: 'ai-assistant', label: 'دستیار هوشمند', icon: Brain },
  { id: 'governance', label: 'حاکمیت شرکتی', icon: Shield },
  { id: 'esg', label: 'گزارش ESG', icon: Leaf },
  { id: 'risk', label: 'مدیریت ریسک', icon: AlertTriangle },
  { id: 'capital', label: 'تخصیص سرمایه', icon: Wallet },
  { id: 'data', label: 'داده‌ها و گزارش‌ها', icon: BarChart3 },
  { id: 'settings', label: 'تنظیمات', icon: Settings },
];

export default function Sidebar() {
  const { activeView, setActiveView, logout, holdingData, recommendations } = useAppStore();

  const criticalAlerts = holdingData?.subsidiaries.flatMap((s) => s.alerts).filter((a) => !a.acknowledged && a.severity === 'critical').length ?? 0;
  const highPrioRecs = recommendations.filter((r) => r.priority === 'critical').length;

  return (
    <aside className="w-64 flex-shrink-0 bg-[#0d1117] border-l border-white/5 flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="p-5 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-600 to-cyan-500 flex items-center justify-center flex-shrink-0">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-xs font-bold text-white leading-tight">دستیار حاکمیت</div>
            <div className="text-xs text-slate-500 leading-tight">شرکتی هوشمند</div>
          </div>
        </div>
        {holdingData && (
          <div className="mt-3 p-2.5 rounded-lg bg-white/3 border border-white/5">
            <p className="text-xs font-medium text-slate-300 leading-tight">{holdingData.name}</p>
            <p className="text-xs text-slate-500 mt-0.5">{holdingData.subsidiaries.length} شرکت تابعه</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.map(({ id, label, icon: Icon }) => {
          const isActive = activeView === id;
          const badge =
            id === 'risk' ? criticalAlerts :
            id === 'ai-assistant' ? highPrioRecs : 0;

          return (
            <button
              key={id}
              onClick={() => setActiveView(id)}
              className={cn('sidebar-link w-full', isActive && 'active')}
            >
              <Icon className={cn('w-4 h-4 flex-shrink-0', isActive ? 'text-brand-400' : 'text-slate-500')} />
              <span className="flex-1 text-right">{label}</span>
              {badge > 0 && (
                <span className="ml-auto px-1.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                  {badge}
                </span>
              )}
              {isActive && <ChevronRight className="w-3 h-3 text-brand-400 flex-shrink-0" />}
            </button>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="p-3 border-t border-white/5 space-y-1">
        <button
          onClick={logout}
          className="sidebar-link w-full text-rose-400/80 hover:text-rose-400 hover:bg-rose-500/10"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          <span>خروج از سیستم</span>
        </button>
      </div>
    </aside>
  );
}
