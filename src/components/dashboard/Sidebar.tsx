'use client';
import {
  LayoutDashboard, Building2, TrendingUp, Brain, Shield, Leaf,
  Settings, LogOut, Bell, BarChart3, AlertTriangle, Wallet,
  ChevronLeft, Settings2, Database,
} from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { cn } from '@/utils';

const navItems = [
  { id: 'dashboard', label: 'داشبورد اجرایی', icon: LayoutDashboard, group: 'main' },
  { id: 'subsidiaries', label: 'شرکت‌های تابعه', icon: Building2, group: 'main' },
  { id: 'analysis', label: 'تحلیل مالی', icon: TrendingUp, group: 'main' },
  { id: 'governance', label: 'حاکمیت شرکتی', icon: Shield, group: 'main' },
  { id: 'esg', label: 'گزارش ESG', icon: Leaf, group: 'main' },
  { id: 'risk', label: 'مدیریت ریسک', icon: AlertTriangle, group: 'main' },
  { id: 'capital', label: 'تخصیص سرمایه', icon: Wallet, group: 'main' },
  { id: 'data', label: 'داده‌ها و گزارش‌ها', icon: BarChart3, group: 'main' },
  { id: 'ai-assistant', label: 'دستیار هوشمند', icon: Brain, group: 'ai' },
  { id: 'prompt-manager', label: 'مدیریت پرامپت‌ها', icon: Settings2, group: 'ai' },
  { id: 'settings', label: 'تنظیمات', icon: Settings, group: 'settings' },
];

const groups: { id: string; label: string }[] = [
  { id: 'main', label: 'مدیریت پرتفولیو' },
  { id: 'ai', label: 'هوش مصنوعی' },
  { id: 'settings', label: 'سیستم' },
];

export default function Sidebar() {
  const { activeView, setActiveView, logout, holdingData, recommendations } = useAppStore();

  const criticalAlerts = holdingData?.subsidiaries.flatMap((s) => s.alerts).filter((a) => !a.acknowledged && a.severity === 'critical').length ?? 0;
  const highPrioRecs = recommendations.filter((r) => r.priority === 'critical').length;

  const getBadge = (id: string) => {
    if (id === 'risk') return criticalAlerts;
    if (id === 'ai-assistant') return highPrioRecs;
    return 0;
  };

  return (
    <aside
      className="w-[220px] flex-shrink-0 flex flex-col h-screen sticky top-0 overflow-hidden"
      style={{ background: 'var(--sidebar-bg)', borderLeft: '1px solid var(--border)' }}
    >
      {/* Logo */}
      <div className="p-4 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #3d52ff, #00d4ff)', boxShadow: '0 4px 14px rgba(61,82,255,0.4)' }}>
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold leading-tight" style={{ color: 'var(--text-1)' }}>دستیار هوشمند</div>
            <div className="text-xs leading-tight truncate" style={{ color: 'var(--text-3)' }}>حاکمیت شرکتی</div>
          </div>
        </div>

        {holdingData && (
          <div className="mt-3 p-2.5 rounded-xl" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
            <p className="text-xs font-semibold leading-tight truncate" style={{ color: 'var(--text-1)' }}>
              {holdingData.name}
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>
              {holdingData.subsidiaries.length} شرکت تابعه
            </p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2.5 space-y-4">
        {groups.map((group) => {
          const items = navItems.filter((n) => n.group === group.id);
          return (
            <div key={group.id}>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5 px-2" style={{ color: 'var(--text-3)' }}>
                {group.label}
              </p>
              <div className="space-y-0.5">
                {items.map(({ id, label, icon: Icon }) => {
                  const isActive = activeView === id;
                  const badge = getBadge(id);
                  return (
                    <button
                      key={id}
                      onClick={() => setActiveView(id)}
                      className={cn('sidebar-link', isActive && 'active')}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      <span className="flex-1 truncate text-right">{label}</span>
                      {badge > 0 && (
                        <span className="flex-shrink-0 min-w-[18px] h-[18px] rounded-full text-[10px] font-bold flex items-center justify-center"
                          style={{ background: 'rgba(244,63,94,0.2)', color: '#fb7185', border: '1px solid rgba(244,63,94,0.3)', paddingInline: 4 }}>
                          {badge}
                        </span>
                      )}
                      {isActive && <ChevronLeft className="w-3 h-3 flex-shrink-0 text-brand-400" />}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="p-2.5 flex-shrink-0" style={{ borderTop: '1px solid var(--border)' }}>
        <button
          onClick={logout}
          className="sidebar-link w-full"
          style={{ color: 'rgba(244,63,94,0.75)' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#fb7185')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(244,63,94,0.75)')}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          <span>خروج از سیستم</span>
        </button>
      </div>
    </aside>
  );
}
