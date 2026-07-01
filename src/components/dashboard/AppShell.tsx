'use client';
import { useAppStore } from '@/store/appStore';
import Sidebar from './Sidebar';
import Header from './Header';
import MainDashboard from './MainDashboard';
import SubsidiariesView from './SubsidiariesView';
import FinancialAnalysis from '@/components/analysis/FinancialAnalysis';
import AIAssistant from '@/components/ai/AIAssistant';
import GovernanceView from '@/components/analysis/GovernanceView';
import ESGView from '@/components/esg/ESGView';
import RiskView from '@/components/analysis/RiskView';
import CapitalView from '@/components/analysis/CapitalView';
import DataView from '@/components/analysis/DataView';
import SettingsView from '@/components/settings/SettingsView';
import PromptManager from '@/components/admin/PromptManager';

const viewMap: Record<string, React.FC> = {
  dashboard: MainDashboard,
  subsidiaries: SubsidiariesView,
  analysis: FinancialAnalysis,
  'ai-assistant': AIAssistant,
  governance: GovernanceView,
  esg: ESGView,
  risk: RiskView,
  capital: CapitalView,
  data: DataView,
  settings: SettingsView,
  'prompt-manager': PromptManager,
};

export default function AppShell() {
  const activeView = useAppStore((s) => s.activeView);
  const ActiveView = viewMap[activeView] ?? MainDashboard;

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg)' }}>
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto" style={{ background: 'var(--bg)' }}>
          <ActiveView />
        </main>
      </div>
    </div>
  );
}
