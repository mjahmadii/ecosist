import React, { useState, useEffect } from 'react';
import { Subsidiary, RiskPersona, RiskThresholds, BoardResolutionSimulation } from './types';
import { INITIAL_SUBSIDIARIES, DEFAULT_MEETINGS, calculateScores } from './mockData';
import Login from './components/Login';
import ApiKeyConfig from './components/ApiKeyConfig';
import HoldingDashboard from './components/HoldingDashboard';
import SubsidiariesTable from './components/SubsidiariesTable';
import CompanyDetailView from './components/CompanyDetailView';
import SmartAssistantView from './components/SmartAssistantView';
import StressTesterView from './components/StressTesterView';
import MarketAnomalyMonitor from './components/MarketAnomalyMonitor';
import DataManagementView from './components/DataManagementView';
import RiskSettingsView from './components/RiskSettingsView';
import FloatingAssistant from './components/FloatingAssistant';
import GovernanceComplianceView from './components/GovernanceComplianceView';
import StrategicPortfolioView from './components/StrategicPortfolioView';

import { 
  Building2, Sliders, Database, Activity, Cpu, Award, 
  LogOut, ShieldCheck, Key, User, TrendingUp, HelpCircle, AlertOctagon, Sun, Moon, MessageSquare, Wallet2, Menu, X
} from 'lucide-react';

export default function App() {
  // Session States
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem('ehsan_logged') === 'true';
  });
  
  const [apiKey, setApiKey] = useState<string | null>(() => {
    return localStorage.getItem('ehsan_api_key') || null;
  });

  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('holding_theme') as 'dark' | 'light') || 'dark';
  });

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('holding_theme', nextTheme);
  };

  // Active View Tab State
  const [activeTab, setActiveTab] = useState<'holding' | 'subsidiaries' | 'assistant' | 'stress' | 'anomalies' | 'compliance' | 'portfolio' | 'data' | 'risk'>('holding');
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Core Holding States
  const [subsidiaries, setSubsidiaries] = useState<Subsidiary[]>(() => {
    const saved = localStorage.getItem('holding_subsidiaries');
    return saved ? JSON.parse(saved) : INITIAL_SUBSIDIARIES;
  });

  const [riskPersona, setRiskPersona] = useState<RiskPersona>(() => {
    const saved = localStorage.getItem('holding_risk_persona');
    return (saved as RiskPersona) || 'BALANCED';
  });

  const [riskThresholds, setRiskThresholds] = useState<RiskThresholds>(() => {
    const saved = localStorage.getItem('holding_risk_thresholds');
    if (saved) return JSON.parse(saved);
    // Default Balanced Thresholds
    return {
      maxDebtToEquity: 1.8,
      minCurrentRatio: 1.1,
      minTransparencyScore: 65,
      minAttendanceRate: 0.85,
      minEsgScore: 60
    };
  });

  const [meetings, setMeetings] = useState<BoardResolutionSimulation[]>(() => {
    const saved = localStorage.getItem('holding_meetings');
    return saved ? JSON.parse(saved) : DEFAULT_MEETINGS;
  });

  // Save states to LocalStorage on updates
  useEffect(() => {
    localStorage.setItem('holding_subsidiaries', JSON.stringify(subsidiaries));
  }, [subsidiaries]);

  useEffect(() => {
    localStorage.setItem('holding_risk_persona', riskPersona);
  }, [riskPersona]);

  useEffect(() => {
    localStorage.setItem('holding_risk_thresholds', JSON.stringify(riskThresholds));
  }, [riskThresholds]);

  useEffect(() => {
    localStorage.setItem('holding_meetings', JSON.stringify(meetings));
  }, [meetings]);

  // Recalculate dynamic health & governance scores whenever thresholds are updated
  useEffect(() => {
    setSubsidiaries(prev => 
      prev.map(sub => {
        const scores = calculateScores(sub, riskThresholds);
        return {
          ...sub,
          healthScore: scores.healthScore,
          governanceScore: scores.governanceScore
        };
      })
    );
  }, [riskThresholds]);

  // Session Handlers
  const handleLoginSuccess = () => {
    localStorage.setItem('ehsan_logged', 'true');
    setIsLoggedIn(true);
  };

  const handleConfigComplete = (key: string) => {
    localStorage.setItem('ehsan_api_key', key);
    setApiKey(key);
  };

  const handleLogout = () => {
    localStorage.removeItem('ehsan_logged');
    setIsLoggedIn(false);
    setSelectedCompanyId(null);
    setActiveTab('holding');
  };

  // Data Actions
  const handleImportSuccess = (newSubs: Subsidiary[]) => {
    setSubsidiaries(prev => {
      const filteredPrev = prev.filter(p => !newSubs.some(n => n.id === p.id));
      return [...filteredPrev, ...newSubs];
    });
  };

  const handleResetToDefault = () => {
    if (window.confirm('آیا مایلید پایگاه داده هلدینگ به تنظیمات اولیه کارخانه ریست شود؟ این عمل غیرقابل بازگشت است.')) {
      setSubsidiaries(INITIAL_SUBSIDIARIES);
      setMeetings(DEFAULT_MEETINGS);
      setRiskPersona('BALANCED');
      setRiskThresholds({
        maxDebtToEquity: 1.8,
        minCurrentRatio: 1.1,
        minTransparencyScore: 65,
        minAttendanceRate: 0.85,
        minEsgScore: 60
      });
      setSelectedCompanyId(null);
    }
  };

  const handleUpdateCompanyFinancials = (id: string, updatedData: any) => {
    setSubsidiaries(prev => 
      prev.map(sub => {
        if (sub.id === id) {
          const mergedFinancial = {
            ...sub.financialData,
            revenue: updatedData.revenue,
            netProfit: updatedData.netProfit,
            totalAssets: updatedData.totalAssets,
            totalLiabilities: updatedData.totalLiabilities,
            currentAssets: updatedData.currentAssets,
            currentLiabilities: updatedData.currentLiabilities,
            retainedEarnings: updatedData.retainedEarnings,
            stockEquity: updatedData.stockEquity
          };

          const mergedMetrics = {
            ...sub.riskMetrics,
            altmanZScore: updatedData.altmanZScore,
            bankruptcyRisk: updatedData.bankruptcyRisk,
            debtToEquity: updatedData.debtToEquity,
            currentRatio: updatedData.currentRatio
          };

          return {
            ...sub,
            financialData: mergedFinancial,
            riskMetrics: mergedMetrics,
            healthScore: updatedData.healthScore,
            governanceScore: updatedData.governanceScore
          };
        }
        return sub;
      })
    );
  };

  const handleAddMeeting = (newMeeting: BoardResolutionSimulation) => {
    setMeetings(prev => [newMeeting, ...prev]);
  };

  // Render Logic
  if (!isLoggedIn) {
    return (
      <div className={theme === 'light' ? 'light-theme' : ''}>
        <Login onLoginSuccess={handleLoginSuccess} />
      </div>
    );
  }

  if (!apiKey) {
    return (
      <div className={theme === 'light' ? 'light-theme' : ''}>
        <ApiKeyConfig onConfigComplete={handleConfigComplete} />
      </div>
    );
  }

  // Active Company Object helper
  const activeCompany = selectedCompanyId 
    ? subsidiaries.find(s => s.id === selectedCompanyId) || null 
    : null;

  return (
    <div id="app-root-layout" className={`min-h-screen bg-[#0a0a0b] flex flex-col relative overflow-hidden font-sans text-neutral-200 ${theme === 'light' ? 'light-theme' : ''}`}>
      {/* Upper Brand Header */}
      <header className="bg-[#0f0f12] border-b border-white/10 px-4 md:px-6 py-3 md:py-4 flex items-center justify-between gap-2 md:gap-4 z-20" id="header-root">
        {/* Left Side: Buttons & User Profile */}
        <div className="flex items-center gap-1.5 md:gap-3">
          {/* Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-1.5 md:p-2 md:hidden bg-[#0a0a0b]/80 border border-white/10 rounded-lg text-neutral-400 hover:text-blue-400 transition-all cursor-pointer flex items-center justify-center"
            title="منوی ناوبری"
          >
            {isMenuOpen ? <X size={15} /> : <Menu size={15} />}
          </button>
          
          {/* Logout Button */}
          <button
            onClick={handleLogout}
            title="خروج از سیستم"
            className="hidden md:flex p-1.5 md:p-2 bg-[#0a0a0b] border border-white/10 rounded-lg text-neutral-400 hover:text-red-400 hover:border-red-500/30 transition-all cursor-pointer items-center justify-center"
          >
            <LogOut size={14} className="md:w-4 md:h-4" />
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? 'تغییر به تم روشن' : 'تغییر به تم تاریک'}
            className="hidden md:flex p-1.5 md:p-2 bg-[#0a0a0b] border border-white/10 rounded-lg text-neutral-400 hover:text-amber-400 hover:border-amber-500/30 transition-all cursor-pointer items-center justify-center"
          >
            {theme === 'dark' ? <Sun size={14} className="md:w-4 md:h-4" /> : <Moon size={14} className="md:w-4 md:h-4" />}
          </button>
          
          <div className="hidden md:block h-5 w-px bg-white/10" />

          {/* User Profile */}
          <div className="flex items-center gap-1.5 md:gap-2">
            <div className="text-right font-sans hidden sm:block">
              <span className="text-[10px] md:text-[11px] text-neutral-100 font-bold block whitespace-nowrap">جناب دکتر احسان رضایی</span>
              <span className="text-[8px] md:text-[9px] text-neutral-500 block text-left font-mono">Senior Director</span>
            </div>
            <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow shadow-blue-500/10">
              <User size={14} className="md:w-4 md:h-4" />
            </div>
          </div>
        </div>

        {/* Right Side: Title & Strategy Indicator */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Strategy Badge */}
          <span className={`hidden sm:inline-block px-2 md:px-2.5 py-0.5 md:py-1 rounded-full border text-[9px] md:text-[11px] font-bold ${
            riskPersona === 'CONSERVATIVE' 
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              : riskPersona === 'BALANCED'
              ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
              : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
          }`} dir="rtl">
            {riskPersona === 'CONSERVATIVE' ? 'بسیار محافظه‌کار' : riskPersona === 'BALANCED' ? 'متعادل' : 'تهاجمی'}
          </span>
          <div className="h-5 w-px bg-white/10 hidden sm:block" />
          
          <div className="text-right">
            <h1 className="text-xs sm:text-sm md:text-base font-extrabold text-white flex items-center justify-end gap-1 md:gap-2 whitespace-nowrap" dir="rtl">
              هلدینگ سرمایه‌گذاری سپه
              <span className="inline-block w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            </h1>
            <p className="text-[7px] sm:text-[9px] md:text-[10px] text-neutral-500 font-mono tracking-wider mt-0.5 uppercase whitespace-nowrap">
              Sepah Smart Assistant
            </p>
          </div>
        </div>
      </header>

      {/* Main Framework Grid */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0 relative">
        
        {/* Mobile Sidebar Backdrop */}
        {isMenuOpen && (
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden" 
            onClick={() => setIsMenuOpen(false)}
          />
        )}

        {/* Sidebar Navigation */}
        <aside className={`
          fixed md:relative top-0 bottom-0 left-0 w-64 h-full md:h-auto bg-[#0f0f12] md:bg-[#0a0a0b]/40 border-r border-white/10 md:border-white/5 p-4 space-y-2 flex flex-col justify-between z-40 md:z-auto transition-transform duration-300
          ${isMenuOpen ? 'translate-x-0 flex shadow-2xl' : '-translate-x-full md:translate-x-0 hidden md:flex'}
        `}>
          <div className="space-y-1.5">
            {/* User Profile Card - specially for Dr. Ehsan Rezaei */}
            <div className="bg-[#16161a] border border-white/5 rounded-xl p-3 mb-3 text-right" dir="rtl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-sm shadow-blue-500/10">
                  <User size={18} />
                </div>
                <div className="text-right">
                  <span className="text-xs text-white font-bold block">جناب دکتر احسان رضایی</span>
                  <span className="text-[9px] text-neutral-400 block font-mono">Senior Board Member</span>
                </div>
              </div>

              {/* Mobile Quick Utility Actions inside sidebar */}
              <div className="grid grid-cols-2 gap-1.5 mt-3 pt-3 border-t border-white/5 md:hidden">
                <button
                  onClick={toggleTheme}
                  className="py-1.5 bg-[#0a0a0b] border border-white/10 rounded-lg text-neutral-400 hover:text-amber-400 hover:border-amber-500/20 transition-all text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer"
                >
                  {theme === 'dark' ? <Sun size={12} /> : <Moon size={12} />}
                  <span>{theme === 'dark' ? 'روز' : 'شب'}</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="py-1.5 bg-[#0a0a0b] border border-white/10 rounded-lg text-neutral-400 hover:text-red-400 hover:border-red-500/20 transition-all text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer"
                >
                  <LogOut size={11} />
                  <span>خروج</span>
                </button>
              </div>
            </div>

            <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block px-3.5 mb-2 font-mono">
              System Console
            </span>

            {/* Link 1 */}
            <button
              onClick={() => { setActiveTab('holding'); setSelectedCompanyId(null); setIsMenuOpen(false); }}
              className={`w-full px-3.5 py-2.5 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                activeTab === 'holding' && !selectedCompanyId
                  ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                  : 'text-neutral-400 hover:bg-[#16161a] hover:text-white border border-transparent'
              }`}
            >
              <Building2 size={15} />
              <span className="font-medium" dir="rtl">داشبورد کلان هلدینگ</span>
            </button>

            {/* Link 2 */}
            <button
              onClick={() => { setActiveTab('subsidiaries'); setSelectedCompanyId(null); setIsMenuOpen(false); }}
              className={`w-full px-3.5 py-2.5 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                activeTab === 'subsidiaries' && !selectedCompanyId
                  ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                  : 'text-neutral-400 hover:bg-[#16161a] hover:text-white border border-transparent'
              }`}
            >
              <Database size={15} />
              <span className="font-medium" dir="rtl">ماتریس شرکت‌های تابعه</span>
            </button>

            {/* Link 3 */}
            <button
              onClick={() => { setActiveTab('assistant'); setSelectedCompanyId(null); setIsMenuOpen(false); }}
              className={`w-full px-3.5 py-2.5 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                activeTab === 'assistant'
                  ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                  : 'text-neutral-400 hover:bg-[#16161a] hover:text-white border border-transparent'
              }`}
            >
              <Cpu size={15} />
              <span className="font-medium" dir="rtl">دستیار و شبیه‌ساز مجمع</span>
            </button>

            {/* Link 4 */}
            <button
              onClick={() => { setActiveTab('stress'); setSelectedCompanyId(null); setIsMenuOpen(false); }}
              className={`w-full px-3.5 py-2.5 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                activeTab === 'stress'
                  ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                  : 'text-neutral-400 hover:bg-[#16161a] hover:text-white border border-transparent'
              }`}
            >
              <Activity size={15} />
              <span className="font-medium" dir="rtl">شبیه‌ساز بحران و استرس‌تست</span>
            </button>

            {/* Link 5 (Market anomaly) */}
            <button
              onClick={() => { setActiveTab('anomalies'); setSelectedCompanyId(null); setIsMenuOpen(false); }}
              className={`w-full px-3.5 py-2.5 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                activeTab === 'anomalies'
                  ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                  : 'text-neutral-400 hover:bg-[#16161a] hover:text-white border border-transparent'
              }`}
            >
              <AlertOctagon size={15} />
              <span className="font-medium" dir="rtl">پایش آنومالی تابلوی بورس</span>
            </button>

            {/* Link 6 (Corporate Governance) - NEW */}
            <button
              onClick={() => { setActiveTab('compliance'); setSelectedCompanyId(null); setIsMenuOpen(false); }}
              className={`w-full px-3.5 py-2.5 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                activeTab === 'compliance'
                  ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                  : 'text-neutral-400 hover:bg-[#16161a] hover:text-white border border-transparent'
              }`}
            >
              <ShieldCheck size={15} />
              <span className="font-medium" dir="rtl">ممیزی حاکمیت شرکتی و انطباق</span>
            </button>

            {/* Link 7 (Strategic Portfolio Allocator) - NEW */}
            <button
              onClick={() => { setActiveTab('portfolio'); setSelectedCompanyId(null); setIsMenuOpen(false); }}
              className={`w-full px-3.5 py-2.5 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                activeTab === 'portfolio'
                  ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                  : 'text-neutral-400 hover:bg-[#16161a] hover:text-white border border-transparent'
              }`}
            >
              <Wallet2 size={15} />
              <span className="font-medium" dir="rtl">طرح‌ریزی پورتفوی و جریان نقدی</span>
            </button>

            {/* Link 8 */}
            <button
              onClick={() => { setActiveTab('data'); setSelectedCompanyId(null); setIsMenuOpen(false); }}
              className={`w-full px-3.5 py-2.5 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                activeTab === 'data'
                  ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                  : 'text-neutral-400 hover:bg-[#16161a] hover:text-white border border-transparent'
              }`}
            >
              <TrendingUp size={15} />
              <span className="font-medium" dir="rtl">مدیریت ترازنامه‌ها (CSV)</span>
            </button>

            {/* Link 9 */}
            <button
              onClick={() => { setActiveTab('risk'); setSelectedCompanyId(null); setIsMenuOpen(false); }}
              className={`w-full px-3.5 py-2.5 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                activeTab === 'risk'
                  ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                  : 'text-neutral-400 hover:bg-[#16161a] hover:text-white border border-transparent'
              }`}
            >
              <Sliders size={15} />
              <span className="font-medium" dir="rtl">تنظیمات اشتهای ریسک</span>
            </button>
          </div>

          {/* Quick status bar at sidebar bottom with strict RTL order */}
          <div className="bg-[#16161a]/60 border border-white/5 p-3 rounded-xl text-[10px] space-y-1.5 leading-normal" dir="rtl">
            <div className="flex justify-between items-center text-neutral-500 font-sans">
              <span className="text-right">رکوردهای فعال:</span>
              <span className="text-neutral-400 font-bold text-left select-all">{subsidiaries.length.toLocaleString('fa-IR')} شرکت</span>
            </div>
            <div className="flex justify-between items-center text-neutral-500 font-sans">
              <span className="text-right">دستیار هوشمند:</span>
              <span className="text-blue-400 font-bold text-left select-all">فعال و برخط</span>
            </div>
            <div className="text-[9px] text-neutral-600 border-t border-white/5 pt-1.5 text-center font-mono">
              BANK SEPAH SECURE PORTAL &bull; 2026
            </div>
          </div>
        </aside>

        {/* Content viewport area */}
        <main className="flex-1 p-6 overflow-y-auto max-h-[calc(100vh-80px)] bg-gradient-to-b from-[#0f0f12] to-[#0a0a0b] custom-scrollbar">
          
          {/* Overwrite Overlay: Company Deep-dive view */}
          {selectedCompanyId && activeCompany ? (
            <CompanyDetailView 
              company={activeCompany}
              thresholds={riskThresholds}
              onBack={() => setSelectedCompanyId(null)}
              onUpdateCompanyFinancials={handleUpdateCompanyFinancials}
            />
          ) : (
            <>
              {activeTab === 'holding' && (
                <HoldingDashboard 
                  subsidiaries={subsidiaries}
                  onSelectCompany={setSelectedCompanyId}
                  theme={theme}
                />
              )}

              {activeTab === 'subsidiaries' && (
                <SubsidiariesTable 
                  subsidiaries={subsidiaries}
                  onSelectCompany={setSelectedCompanyId}
                  apiKey={apiKey}
                  theme={theme}
                  riskPersona={riskPersona}
                  riskThresholds={riskThresholds}
                />
              )}

              {activeTab === 'assistant' && (
                <SmartAssistantView 
                  subsidiaries={subsidiaries}
                  activeCompany={null}
                  persona={riskPersona}
                  thresholds={riskThresholds}
                  apiKey={apiKey}
                  meetings={meetings}
                  onAddMeeting={handleAddMeeting}
                />
              )}

              {activeTab === 'stress' && (
                <StressTesterView subsidiaries={subsidiaries} />
              )}

              {activeTab === 'anomalies' && (
                <MarketAnomalyMonitor subsidiaries={subsidiaries} />
              )}

              {activeTab === 'compliance' && (
                <GovernanceComplianceView 
                  subsidiaries={subsidiaries}
                  thresholds={riskThresholds}
                  apiKey={apiKey}
                />
              )}

              {activeTab === 'portfolio' && (
                <StrategicPortfolioView 
                  subsidiaries={subsidiaries}
                  thresholds={riskThresholds}
                  apiKey={apiKey}
                />
              )}

              {activeTab === 'data' && (
                <DataManagementView 
                  thresholds={riskThresholds}
                  onImportSuccess={handleImportSuccess}
                  onResetToDefault={handleResetToDefault}
                  subsidiariesCount={subsidiaries.length}
                />
              )}

              {activeTab === 'risk' && (
                <RiskSettingsView 
                  activePersona={riskPersona}
                  thresholds={riskThresholds}
                  onChangePersona={setRiskPersona}
                  onChangeThresholds={setRiskThresholds}
                  apiKey={apiKey}
                  onUpdateApiKey={handleConfigComplete}
                />
              )}
            </>
          )}

        </main>

      </div>
      <FloatingAssistant 
        subsidiaries={subsidiaries}
        persona={riskPersona}
        thresholds={riskThresholds}
        apiKey={apiKey}
      />
    </div>
  );
}
