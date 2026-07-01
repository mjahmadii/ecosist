import React from 'react';
import { Subsidiary } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, ScatterChart, Scatter, ZAxis
} from 'recharts';
import { 
  Building2, Wallet2, TrendingUp, ShieldCheck, Activity, Award, Scale, HelpCircle, Bot, Sparkles
} from 'lucide-react';

interface HoldingDashboardProps {
  subsidiaries: Subsidiary[];
  onSelectCompany: (id: string) => void;
  theme?: 'light' | 'dark';
}

const COLORS = ['#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#6366F1'];

export default function HoldingDashboard({ subsidiaries, onSelectCompany, theme = 'dark' }: HoldingDashboardProps) {
  const [simulated, setSimulated] = React.useState(false);

  // Aggregate Metrics
  const totalRevenue = subsidiaries.reduce((sum, sub) => sum + sub.financialData.revenue, 0);
  const totalNetProfit = subsidiaries.reduce((sum, sub) => sum + sub.financialData.netProfit, 0);
  const totalAssets = subsidiaries.reduce((sum, sub) => sum + sub.financialData.totalAssets, 0);
  
  const avgHealthScore = Math.round(
    subsidiaries.reduce((sum, sub) => sum + sub.healthScore, 0) / subsidiaries.length
  );
  
  const avgGovScore = Math.round(
    subsidiaries.reduce((sum, sub) => sum + sub.governanceScore, 0) / subsidiaries.length
  );

  const avgEsgScore = Math.round(
    subsidiaries.reduce((sum, sub) => sum + sub.esgData.totalEsgScore, 0) / subsidiaries.length
  );

  // Sector Weights Data
  const sectorMap: { [key: string]: number } = {};
  subsidiaries.forEach(sub => {
    sectorMap[sub.sector] = (sectorMap[sub.sector] || 0) + sub.financialData.revenue;
  });
  const sectorData = Object.keys(sectorMap).map(key => ({
    name: key,
    value: sectorMap[key]
  }));

  // Bar Chart Data (Revenue vs Profit)
  const barChartData = subsidiaries.map(sub => ({
    name: sub.name,
    'درآمد (میلیارد)': sub.financialData.revenue,
    'سود خالص (میلیارد)': sub.financialData.netProfit,
    id: sub.id
  }));

  // Scatter Plot Data (Health vs Governance)
  const scatterData = subsidiaries.map(sub => ({
    x: sub.healthScore,
    y: sub.governanceScore,
    z: sub.financialData.revenue,
    name: sub.name,
    id: sub.id,
    sector: sub.sector
  }));

  return (
    <div className="space-y-6 text-neutral-100 font-sans" id="holding-overview-tab">
      {/* Executive Welcome Hero & Guidance Desktop */}
      <div className="bg-gradient-to-r from-blue-900/25 via-indigo-900/10 to-transparent border border-blue-500/15 p-6 rounded-2xl relative overflow-hidden" dir="rtl">
        <div className="absolute top-0 left-0 p-6 opacity-10 text-blue-400 pointer-events-none hidden md:block">
          <Bot size={120} className="animate-pulse" />
        </div>
        <div className="relative z-10 max-w-4xl space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold rounded-full">
            <Sparkles size={12} />
            <span>سامانه نظارت عالیه و هوشمند بانک سپه (طرح جامع ۱۴۰۵)</span>
          </div>
          <h1 className="text-xl md:text-2xl font-black text-white tracking-tight">
            داشبورد عالیه راهبری و حاکمیت شرکتی شرکت‌های تابعه بانک سپه
          </h1>
          <p className="text-xs md:text-sm text-neutral-300 leading-relaxed max-w-3xl">
            به پیشخوان جامع نظارت مکتوب، ارزیابی ریسک و دستیار هوشمند تصمیم‌گیری خوش آمدید. این سامانه با هدف پایش یکپارچه ترازنامه‌ها، انطباق لحظه‌ای با معیارهای حاکمیت شرکتی، مدیریت پرتفوی تابعه‌ها و شبیه‌سازی استرس‌تست‌های اقتصادی طراحی گردیده است.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-4 border-t border-white/5">
            <div className="p-3 bg-[#16161a]/60 border border-white/5 rounded-xl text-right">
              <span className="text-[10px] text-neutral-500 block mb-1">ساختار پورتفوی</span>
              <span className="text-xs font-bold text-neutral-200 block">۵ شرکت تابعه بورسی</span>
            </div>
            <div className="p-3 bg-[#16161a]/60 border border-white/5 rounded-xl text-right">
              <span className="text-[10px] text-neutral-500 block mb-1">دستیار هوشمند مالی</span>
              <span className="text-xs font-bold text-blue-400 block">پاسخ‌های چندلحنه فعال</span>
            </div>
            <div className="p-3 bg-[#16161a]/60 border border-white/5 rounded-xl text-right">
              <span className="text-[10px] text-neutral-500 block mb-1">وضعیت سلامت عمومی</span>
              <span className="text-xs font-bold text-emerald-400 block">پایدار و با حاشیه امن</span>
            </div>
            <div className="p-3 bg-[#16161a]/60 border border-white/5 rounded-xl text-right">
              <span className="text-[10px] text-neutral-500 block mb-1">وضعیت حاکمیت تابعه‌ها</span>
              <span className="text-xs font-bold text-indigo-400 block">منطبق با ضوابط بورس</span>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="bg-[#16161a] border border-white/10 p-5 rounded-xl shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 text-blue-500 group-hover:scale-110 transition-transform">
            <Building2 size={80} />
          </div>
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs text-neutral-400 font-mono tracking-wider">TOTAL ASSETS (AUM)</span>
            <span className="p-1.5 bg-blue-500/10 text-blue-400 rounded-lg">
              <Building2 size={16} />
            </span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold tracking-tight">
              {totalAssets.toLocaleString('fa-IR')}
            </span>
            <span className="text-xs text-neutral-400">میلیارد تومان</span>
          </div>
          <p className="text-[10px] text-neutral-500 mt-2">مجموع دارایی‌های تحت مدیریت شرکت‌های فرعی هلدینگ</p>
        </div>

        {/* KPI 2 */}
        <div className="bg-[#16161a] border border-white/10 p-5 rounded-xl shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 text-emerald-500 group-hover:scale-110 transition-transform">
            <TrendingUp size={80} />
          </div>
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs text-neutral-400 font-mono tracking-wider">AGGREGATE REVENUE</span>
            <span className="p-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg">
              <TrendingUp size={16} />
            </span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold tracking-tight text-emerald-400">
              {totalRevenue.toLocaleString('fa-IR')}
            </span>
            <span className="text-xs text-neutral-400">میلیارد تومان</span>
          </div>
          <p className="text-[10px] text-neutral-500 mt-2">مجموع درآمد کل شرکت‌های تابعه در سال مالی جاری</p>
        </div>

        {/* KPI 3 */}
        <div className="bg-[#16161a] border border-white/10 p-5 rounded-xl shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 text-blue-500 group-hover:scale-110 transition-transform">
            <Wallet2 size={80} />
          </div>
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs text-neutral-400 font-mono tracking-wider">NET PORTFOLIO PROFIT</span>
            <span className="p-1.5 bg-blue-500/10 text-blue-400 rounded-lg">
              <Wallet2 size={16} />
            </span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold tracking-tight text-blue-400">
              {totalNetProfit.toLocaleString('fa-IR')}
            </span>
            <span className="text-xs text-neutral-400">میلیارد تومان</span>
          </div>
          <p className="text-[10px] text-neutral-500 mt-2">سود خالص تلفیقی هلدینگ (مجموع سودآوری بخش فرعی)</p>
        </div>

        {/* KPI 4 */}
        <div className="bg-[#16161a] border border-white/10 p-5 rounded-xl shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 text-indigo-500 group-hover:scale-110 transition-transform">
            <ShieldCheck size={80} />
          </div>
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs text-neutral-400 font-mono tracking-wider">AVERAGE HEALTH / GOV</span>
            <span className="p-1.5 bg-indigo-500/10 text-indigo-500 rounded-lg">
              <ShieldCheck size={16} />
            </span>
          </div>
          <div className="flex items-baseline gap-3">
            <div>
              <span className="text-2xl font-bold tracking-tight text-indigo-400">{avgHealthScore}%</span>
              <span className="text-[10px] text-neutral-400 block" dir="rtl">سلامت مالی</span>
            </div>
            <div className="h-8 w-px bg-white/10" />
            <div>
              <span className="text-2xl font-bold tracking-tight text-purple-400">{avgGovScore}%</span>
              <span className="text-[10px] text-neutral-400 block" dir="rtl">حاکمیت شرکتی</span>
            </div>
          </div>
          <p className="text-[10px] text-neutral-500 mt-2">شاخص وزنی عملکرد و شفافیت حاکمیتی تابعه</p>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Financial Comparison Bar Chart */}
        <div className="bg-[#16161a] border border-white/10 p-5 rounded-xl shadow-lg lg:col-span-2 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-4">
            <span className="text-xs font-mono text-neutral-500">SUBSIDIARY REVENUE vs PROFIT</span>
            <h3 className="text-sm font-bold text-neutral-300" dir="rtl">مقایسه عملکرد مالی شرکت‌های فرعی</h3>
          </div>
          <div className="w-full relative overflow-hidden flex-1 flex flex-col justify-end">
            <div className="absolute top-1 left-[10px] text-[10px] font-bold text-neutral-400 font-sans pointer-events-none z-10" style={{ direction: 'rtl' }}>
              (میلیارد تومان)
            </div>
            <div className="w-full overflow-x-auto custom-scrollbar pb-1 pt-6">
              <div style={{ minWidth: `${Math.max(700, barChartData.length * 130)}px`, height: '245px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={barChartData}
                    margin={{ top: 20, right: 15, left: 10, bottom: 5 }}
                    onClick={(state: any) => {
                      if (state && state.activePayload && state.activePayload.length > 0) {
                        const id = state.activePayload[0].payload.id;
                        onSelectCompany(id);
                      }
                    }}
                  >
                    <defs>
                      <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.85}/>
                        <stop offset="95%" stopColor="#1d4ed8" stopOpacity={0.25}/>
                      </linearGradient>
                      <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.85}/>
                        <stop offset="95%" stopColor="#047857" stopOpacity={0.25}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={theme === 'light' ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.05)'} vertical={false} />
                    <XAxis dataKey="name" interval={0} stroke={theme === 'light' ? '#4b5563' : '#9ca3af'} fontSize={10} tickLine={false} />
                    <YAxis stroke={theme === 'light' ? '#4b5563' : '#9ca3af'} fontSize={10} tickLine={false} width={65} tickMargin={5} orientation="left" tick={{ textAnchor: 'end', dx: -4 }} />
                    <Tooltip 
                      contentStyle={theme === 'light' ? { backgroundColor: '#ffffff', borderColor: '#e4e4e7', borderRadius: '8px', color: '#18181b' } : { backgroundColor: '#0f0f12', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', color: '#f4f4f5' }}
                      labelClassName={theme === 'light' ? 'text-neutral-900 font-bold font-sans' : 'text-neutral-200 font-bold font-sans'}
                      itemStyle={theme === 'light' ? { color: '#27272a' } : { color: '#e4e4e7' }}
                    />
                    <Legend iconSize={10} wrapperStyle={{ fontSize: '11px', paddingTop: 10 }} />
                    <Bar dataKey="درآمد (میلیارد)" fill="url(#revenueGrad)" radius={[4, 4, 0, 0]} barSize={24} cursor="pointer" />
                    <Bar dataKey="سود خالص (میلیارد)" fill="url(#profitGrad)" radius={[4, 4, 0, 0]} barSize={24} cursor="pointer" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Sector Weighting Pie Chart */}
        <div className="bg-[#16161a] border border-white/10 p-5 rounded-xl shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <span className="text-xs font-mono text-neutral-500">SECTOR ALLOCATION (REVENUE)</span>
              <h3 className="text-sm font-bold text-neutral-300" dir="rtl">توزیع بخشی سبد هلدینگ</h3>
            </div>
            <div className="h-52 w-full flex items-center justify-center relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sectorData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {sectorData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={theme === 'light' ? { backgroundColor: '#ffffff', borderColor: '#e4e4e7', borderRadius: '8px', color: '#18181b' } : { backgroundColor: '#0f0f12', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', color: '#f4f4f5' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="space-y-2 mt-2 pt-2 border-t border-white/5">
            {sectorData.map((entry, index) => (
              <div key={entry.name} className="flex items-center justify-between text-[11px]" dir="rtl">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span className="font-medium text-neutral-300" title={entry.name}>{entry.name}</span>
                </div>
                <span className="text-neutral-300 font-sans" dir="rtl">
                  <span className="font-bold text-neutral-100">{entry.value.toLocaleString('fa-IR')}</span>{' '}
                  <span className="text-neutral-500 text-[10px]">میلیارد تومان</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Advanced Scatter Plot: Health vs Governance matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-[#16161a] border border-white/10 p-5 rounded-xl shadow-lg lg:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <span className="text-xs font-mono text-neutral-500">HEALTH & GOVERNANCE MATRIX</span>
            <h3 className="text-sm font-bold text-neutral-300" dir="rtl">ماتریس سلامت مالی و کیفیت حاکمیت شرکتی</h3>
          </div>
          <div className="h-72 w-full relative">
            {/* Quadrant backgrounds */}
            <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-indigo-500/[0.01] border-r border-b border-white/5 pointer-events-none" />
            <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-emerald-500/[0.02] border-b border-white/5 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-red-500/[0.02] border-r border-white/5 pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-amber-500/[0.02] pointer-events-none" />
            
            <div className="absolute top-[45px] left-[75px] text-[10px] text-neutral-500 font-medium z-10 pointer-events-none">حاکمیت بالا / سلامت پایین</div>
            <div className="absolute top-[45px] right-[25px] text-[10px] text-emerald-500/60 font-medium z-10 pointer-events-none">بخش ممتاز (ستاره‌ها)</div>
            <div className="absolute bottom-[35px] left-[75px] text-[10px] text-red-500/60 font-medium z-10 pointer-events-none">بخش بحرانی (ریسک بالا)</div>
            <div className="absolute bottom-[35px] right-[25px] text-[10px] text-amber-500/60 font-medium z-10 pointer-events-none">سلامت بالا / حاکمیت نیازمند بهبود</div>
            
            <div className="absolute top-2 left-[50px] text-[10px] font-bold text-neutral-400 font-sans pointer-events-none z-10" style={{ direction: 'rtl' }}>
              (حاکمیت شرکتی %)
            </div>

            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 35, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={theme === 'light' ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.05)'} />
                <XAxis 
                  type="number" 
                  dataKey="x" 
                  name="سلامت مالی" 
                  unit="%" 
                  domain={[30, 100]} 
                  stroke={theme === 'light' ? '#4b5563' : '#9ca3af'} 
                  fontSize={10} 
                />
                <YAxis 
                  type="number" 
                  dataKey="y" 
                  name="حاکمیت شرکتی" 
                  unit="%" 
                  domain={[30, 100]} 
                  stroke={theme === 'light' ? '#4b5563' : '#9ca3af'} 
                  fontSize={10} 
                  width={60}
                  tickMargin={10}
                  orientation="left"
                  tick={{ textAnchor: 'end', dx: -8 }}
                />
                <ZAxis type="number" dataKey="z" range={[120, 500]} />
                <Tooltip 
                  cursor={{ strokeDasharray: '3 3' }} 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className={`p-3 rounded-lg text-xs space-y-1.5 font-sans shadow-xl border ${theme === 'light' ? 'bg-white border-zinc-200 text-zinc-800' : 'bg-[#0f0f12] border-white/10 text-neutral-100'}`}>
                          <p className={`font-bold ${theme === 'light' ? 'text-zinc-900' : 'text-neutral-100'}`} dir="rtl">{data.name}</p>
                          <p className={theme === 'light' ? 'text-zinc-600' : 'text-neutral-400'} dir="rtl">سلامت مالی: <span className="text-emerald-500 font-bold">{data.x}%</span></p>
                          <p className={theme === 'light' ? 'text-zinc-600' : 'text-neutral-400'} dir="rtl">حاکمیت شرکتی: <span className="text-indigo-500 font-bold">{data.y}%</span></p>
                          <p className={theme === 'light' ? 'text-zinc-400 text-[10px]' : 'text-neutral-500 text-[10px] font-mono'}>کلیک برای مشاهده مشخصات شرکت</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Scatter 
                  name="Subsidiaries" 
                  data={scatterData} 
                  fill="#60a5fa" 
                  cursor="pointer"
                  onClick={(node: any) => onSelectCompany(node.id)}
                >
                  {scatterData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.x > 80 && entry.y > 80 ? '#10b981' : entry.x < 60 || entry.y < 60 ? '#f43f5e' : '#f59e0b'}
                      stroke={theme === 'light' ? '#ffffff' : '#16161a'}
                      strokeWidth={2}
                    />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ESG Overview Widget */}
        <div className="bg-[#16161a] border border-white/10 p-5 rounded-xl shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-6">
              <span className="text-xs font-mono text-neutral-500">ESG PERFORMANCE</span>
              <h3 className="text-sm font-bold text-neutral-300" dir="rtl">شاخص پایداری و حاکمیت (ESG)</h3>
            </div>
            
            <div className="text-center py-4 bg-[#0a0a0b]/40 rounded-xl border border-white/5 mb-6">
              <div className="text-3xl font-extrabold text-emerald-400 font-mono">{avgEsgScore}%</div>
              <p className="text-[10px] text-neutral-500 mt-1 uppercase tracking-wider font-mono">Holding ESG Index</p>
            </div>

            <div className="space-y-4">
              {/* E */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-mono text-emerald-400">Environmental (E)</span>
                  <span className="text-neutral-300">۷۲٪</span>
                </div>
                <div className="h-1.5 w-full bg-[#0a0a0b] rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-400 rounded-full" style={{ width: '72%' }} />
                </div>
              </div>
              {/* S */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-mono text-blue-400">Social Responsibility (S)</span>
                  <span className="text-neutral-300">۷۹٪</span>
                </div>
                <div className="h-1.5 w-full bg-[#0a0a0b] rounded-full overflow-hidden">
                  <div className="h-full bg-blue-400 rounded-full" style={{ width: '79%' }} />
                </div>
              </div>
              {/* G */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-mono text-indigo-400">Corporate Governance (G)</span>
                  <span className="text-neutral-300">۷۸٪</span>
                </div>
                <div className="h-1.5 w-full bg-[#0a0a0b] rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-400 rounded-full" style={{ width: '78%' }} />
                </div>
              </div>
            </div>
          </div>

          <div className="text-neutral-500 text-[10px] text-center pt-4 border-t border-white/5 mt-4 leading-relaxed" dir="rtl">
            گزارش تطبیق محیطی بر اساس حجم کربن‌ دی‌اکسید تولیدی، استانداردهای کارگری و میزان اثربخشی ساختار شفافیت مجامع تابعه به صورت فصلی ممیزی می‌گردد.
          </div>
        </div>
      </div>

      {/* AI Smart Executive Advisory - Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Left Bento: AI Capital Reallocation simulator */}
        <div className="bg-[#16161a] border border-white/10 p-6 rounded-xl shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <span className="text-xs font-mono text-blue-400 font-bold flex items-center gap-1" dir="rtl">
                💡 PORTFOLIO OPTIMIZATION SIMULATOR
              </span>
              <h3 className="text-sm font-bold text-neutral-200" dir="rtl">شبیه‌ساز هوشمند بهینه‌سازی سبد سرمایه</h3>
            </div>
            
            <p className="text-xs text-neutral-400 mb-4 leading-relaxed" dir="rtl">
              هوش مصنوعی بانک سپه با بررسی ترازنامه شرکت‌های تابعه پیشنهاد می‌کند بخشی از نقدینگی را از بخش سیمانی (پرریسک بر اساس آلتمن) خارج کرده و به عنوان افزایش سرمایه در بخش فناوری اطلاعات و داروسازی تزریق نمایید.
            </p>

            {/* Interactive Stats comparisons */}
            <div className="bg-[#0a0a0b]/50 border border-white/5 p-4 rounded-lg mb-4 space-y-3" dir="rtl">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="p-2.5 bg-slate-950/40 rounded-lg border border-white/5">
                  <span className="text-[10px] text-neutral-500 block">میانگین شاخص Z آلتمن هلدینگ</span>
                  <span className={`text-sm font-extrabold font-mono block mt-1 transition-all duration-300 ${simulated ? 'text-emerald-400 scale-105' : 'text-amber-400'}`}>
                    {simulated ? '۲.۸۵ (امنیت بالا)' : '۲.۰۵ (ریسک متوسط)'}
                  </span>
                </div>
                <div className="p-2.5 bg-slate-950/40 rounded-lg border border-white/5">
                  <span className="text-[10px] text-neutral-500 block">پیش‌بینی بازدهی ناخالص سالیانه</span>
                  <span className={`text-sm font-extrabold font-mono block mt-1 transition-all duration-300 ${simulated ? 'text-emerald-400 scale-105' : 'text-blue-400'}`}>
                    {simulated ? '۲۴.۸٪ (ارتقا یافته)' : '۱۹.۲٪ (وضعیت جاری)'}
                  </span>
                </div>
              </div>

              {/* Detail list before/after */}
              <div className="space-y-2 text-[11px] text-neutral-400">
                <div className="flex justify-between border-b border-white/5 pb-1.5" dir="rtl">
                  <span className="text-right">سهم تخصیصی سیمان سپهر (ریسک بالا)</span>
                  <span className={`font-sans font-bold text-left ${simulated ? 'text-emerald-400' : 'text-neutral-300'}`}>
                    {simulated ? '۳۷۰ میلیارد تومان' : '۶۲۰ میلیارد تومان'}
                  </span>
                </div>
                <div className="flex justify-between" dir="rtl">
                  <span className="text-right">سهم تخصیصی دارو و فناوری اطلاعات (جریان پایدار)</span>
                  <span className={`font-sans font-bold text-left ${simulated ? 'text-emerald-400' : 'text-neutral-300'}`}>
                    {simulated ? '۵۹۰ میلیارد تومان' : '۳۴۰ میلیارد تومان'}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setSimulated(!simulated)}
              className={`w-full py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                simulated 
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20' 
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {simulated ? 'بازنشانی سناریوی شبیه‌سازی' : 'اعمال شبیه‌سازی هوشمند و بازتخصیص سرمایه هلدینگ'}
            </button>
          </div>
        </div>

        {/* Right Bento: Early Warning AI Ticker */}
        <div className="bg-[#16161a] border border-white/10 p-6 rounded-xl shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <span className="text-xs font-mono text-red-400 font-bold flex items-center gap-1" dir="rtl">
                ⚠️ REAL-TIME RISK ALERTS
              </span>
              <h3 className="text-sm font-bold text-neutral-200" dir="rtl">سیگنال‌ها و هشدارهای زودهنگام هوشمند</h3>
            </div>

            <p className="text-xs text-neutral-400 mb-4 leading-relaxed" dir="rtl">
              سیستم پایش مستمر حاکمیت شرکتی هلدینگ، موارد نقض آستانه ریسک مصوب را به صورت زیر شناسایی کرده است:
            </p>

            <div className="space-y-2.5 max-h-[170px] overflow-y-auto custom-scrollbar">
              {/* Dynamic Warning Alerts based on actual subsidiaries array */}
              {subsidiaries.map(sub => {
                const alerts = [];
                if (sub.riskMetrics.altmanZScore < 1.8) {
                  alerts.push({
                    type: 'آلتمن بحرانی',
                    desc: `ریسک ورشکستگی بالا (Z-Score: ${sub.riskMetrics.altmanZScore.toFixed(2)})`,
                    severity: 'HIGH'
                  });
                }
                if (sub.governanceData.independentDirectorsRatio < 0.2) {
                  alerts.push({
                    type: 'ضعف ساختار حاکمیت',
                    desc: `نسبت اعضای مستقل هیئت مدیره (${Math.round(sub.governanceData.independentDirectorsRatio * 100)}٪) زیر حد نصاب است.`,
                    severity: 'MEDIUM'
                  });
                }
                if (sub.riskMetrics.currentRatio < 1.1) {
                  alerts.push({
                    type: 'ریسک نقدینگی',
                    desc: `نسبت جاری (${sub.riskMetrics.currentRatio.toFixed(2)}) کمتر از آستانه حاکمیتی است.`,
                    severity: 'HIGH'
                  });
                }

                return alerts.map((alert, i) => (
                  <div key={`${sub.id}-${i}`} className="bg-[#0a0a0b]/60 border border-white/5 px-3 py-2.5 rounded-lg flex items-center justify-between gap-3 text-xs" dir="rtl">
                    <div className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${alert.severity === 'HIGH' ? 'bg-red-400 animate-pulse' : 'bg-amber-400'}`} />
                      <div>
                        <span className="font-bold text-neutral-200 text-[11px]">{sub.name} ({sub.ticker})</span>
                        <span className="text-neutral-500 text-[10px] block mt-0.5">{alert.desc}</span>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                      alert.severity === 'HIGH' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}>
                      {alert.type}
                    </span>
                  </div>
                ));
              })}
            </div>
          </div>

          <div className="text-[10px] text-neutral-500 mt-4 pt-3 border-t border-white/5" dir="rtl">
            توصیه سیستمی: مدیر هلدینگ موظف است طی حداکثر ۳۰ روز کاری موضوعات فوق را در دستور کار جلسه فوق‌العاده هیئت مدیره شرکت‌های مذکور قرار دهد.
          </div>
        </div>
      </div>
    </div>
  );
}
