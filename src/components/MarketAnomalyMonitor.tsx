import React, { useState, useEffect } from 'react';
import { Subsidiary } from '../types';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import { AlertOctagon, TrendingDown, TrendingUp, RefreshCw, Zap, Bell, CheckCircle } from 'lucide-react';

interface MarketAnomalyMonitorProps {
  subsidiaries: Subsidiary[];
}

interface TickerAlert {
  id: string;
  companyName: string;
  ticker: string;
  type: 'PRICE_CRASH' | 'VOLUME_SPIKE' | 'BETA_DEVIATION';
  severity: 'high' | 'medium' | 'low';
  message: string;
  time: string;
  resolved: boolean;
}

export default function MarketAnomalyMonitor({ subsidiaries }: MarketAnomalyMonitorProps) {
  const [activeAlerts, setActiveAlerts] = useState<TickerAlert[]>([
    {
      id: 'alert-1',
      companyName: 'پتروشیمی سپاهان انرژی',
      ticker: 'پتروسپاهان',
      type: 'VOLUME_SPIKE',
      severity: 'high',
      message: 'افزایش مشکوک ۴۲۰ درصدی حجم معاملات روزانه در آستانه مجمع سالیانه.',
      time: '15:32',
      resolved: false
    },
    {
      id: 'alert-2',
      companyName: 'سیمان سپهر کویر',
      ticker: 'سکاویر',
      type: 'PRICE_CRASH',
      severity: 'high',
      message: 'ریزش صف خرید و افت ناگهانی ۴.۸٪ قیمت پایانی به دلیل گزارش حسابرسی درجه C.',
      time: '14:15',
      resolved: false
    },
    {
      id: 'alert-3',
      companyName: 'امید دارو سپهر',
      ticker: 'وامیددارو',
      type: 'BETA_DEVIATION',
      severity: 'low',
      message: 'کاهش مقطعی بتای سهام به زیر ۰.۴ که حاکی از ثبات بیشتر داروسازی در تلاطم بازار است.',
      time: '11:05',
      resolved: true
    }
  ]);

  // Generate synthetic high-frequency trading data for charts
  const [tickerPrices, setTickerPrices] = useState<{ [key: string]: number[] }>({});
  const [tickCount, setTickCount] = useState(0);

  useEffect(() => {
    // Seed initial price history (20 ticks each)
    const initial: { [key: string]: number[] } = {};
    subsidiaries.forEach(sub => {
      const base = sub.financialData.revenue / 10;
      initial[sub.id] = Array.from({ length: 15 }, () => base + (Math.random() - 0.5) * (base * 0.1));
    });
    setTickerPrices(initial);
  }, [subsidiaries]);

  // Tick simulation to fluctuate prices and occasionally trigger live anomalies
  useEffect(() => {
    const interval = setInterval(() => {
      setTickerPrices(prev => {
        const next = { ...prev };
        let triggeredAnomaly = false;

        Object.keys(next).forEach(key => {
          const prices = [...(next[key] || [])];
          if (prices.length === 0) return;

          const lastPrice = prices[prices.length - 1];
          // Occasionally inject huge crashes or spikes
          let change = (Math.random() - 0.5) * (lastPrice * 0.02); // normal fluctuation
          
          if (Math.random() > 0.95) {
            // Anomaly spike or crash
            const direction = Math.random() > 0.4 ? -1 : 1;
            change = direction * (lastPrice * 0.08); // 8% massive spike/crash
            
            const sub = subsidiaries.find(s => s.id === key);
            if (sub && !triggeredAnomaly) {
              triggeredAnomaly = true;
              const type = direction === -1 ? 'PRICE_CRASH' : 'VOLUME_SPIKE';
              const timeStr = new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
              
              const newAlert: TickerAlert = {
                id: `live-alert-${Date.now()}`,
                companyName: sub.name,
                ticker: sub.ticker,
                type: type,
                severity: 'high',
                message: direction === -1 
                  ? `انحراف قیمتی ناگهانی: افت ۸.۲٪ سهام در اثر فشار عرضه مشکوک حقوقی.`
                  : `جهش حجم معاملات: افزایش معاملات هماهنگ‌شده به ارزش ۲۵ میلیارد تومان در تابلوی بورس.`,
                time: timeStr,
                resolved: false
              };
              setActiveAlerts(curr => [newAlert, ...curr.slice(0, 5)]);
            }
          }

          prices.push(Math.max(1, lastPrice + change));
          if (prices.length > 20) prices.shift();
          next[key] = prices;
        });
        return next;
      });
      setTickCount(c => c + 1);
    }, 4000);

    return () => clearInterval(interval);
  }, [subsidiaries]);

  // Market Panic Button
  const handleTriggerPanic = () => {
    setTickerPrices(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(key => {
        const prices = [...(next[key] || [])];
        if (prices.length === 0) return;
        const lastPrice = prices[prices.length - 1];
        prices.push(lastPrice * 0.85); // immediate 15% drop
        if (prices.length > 20) prices.shift();
        next[key] = prices;
      });
      return next;
    });

    const timeStr = new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
    const panicAlert: TickerAlert = {
      id: `panic-${Date.now()}`,
      companyName: 'کل سبد هلدینگ بورس',
      ticker: 'سهم‌سپه',
      type: 'PRICE_CRASH',
      severity: 'high',
      message: 'هشدار سراسری بازار: شوک سیستمیک و ریزش ناگهانی شاخص کل به دلیل نااطمینانی‌های بازار سرمایه.',
      time: timeStr,
      resolved: false
    };

    setActiveAlerts(curr => [panicAlert, ...curr]);
  };

  const handleResolveAlert = (id: string) => {
    setActiveAlerts(curr => 
      curr.map(alert => alert.id === id ? { ...alert, resolved: true } : alert)
    );
  };

  return (
    <div className="bg-[#16161a] border border-white/10 rounded-xl shadow-lg p-5 text-neutral-200" id="market-anomalies-tab">
      
      {/* Header controls */}
      <div className="flex flex-col md:flex-row justify-between items-center pb-5 border-b border-white/10 mb-6 gap-4">
        <div className="flex items-center gap-2.5 w-full md:w-auto justify-end order-1 md:order-2">
          <div className="text-right">
            <h3 className="text-sm font-bold text-white flex items-center justify-end gap-1.5" dir="rtl">
              سامانه پایش آنومالی و نوسانات مشکوک تابلوی بورس
              <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-ping" />
            </h3>
            <p className="text-[10px] text-neutral-500 font-mono">Real-time Stock Trading & Valuation Anomaly Detector</p>
          </div>
          <span className="p-2.5 bg-red-500/10 text-red-400 rounded-xl border border-red-500/20">
            <AlertOctagon size={18} />
          </span>
        </div>

        {/* Action panic button */}
        <button
          onClick={handleTriggerPanic}
          className="px-4 py-2 bg-red-950/25 hover:bg-red-900/40 border border-red-900/30 text-red-400 font-bold text-xs rounded-lg transition-all flex items-center gap-1.5 cursor-pointer self-start md:self-center order-2 md:order-1 hover:shadow-lg hover:shadow-red-950/10"
        >
          <Zap size={13} />
          <span dir="rtl">تست واکنش به بحران (شوک بازار)</span>
        </button>
      </div>

      {/* Main Grid: Left real-time tickers, Right active warnings list */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Real-time Ticker Mini-charts */}
        <div className="lg:col-span-2 space-y-4">
          <h4 className="text-xs font-bold text-neutral-400 mb-3 text-right font-sans" dir="rtl">نمودار نوسانات زنده سهام هلدینگ (تعداد دفعات پایش: {tickCount})</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {subsidiaries.map(sub => {
              const prices = tickerPrices[sub.id] || [];
              if (prices.length === 0) return null;
              
              const currentPrice = prices[prices.length - 1];
              const prevPrice = prices[prices.length - 2] || currentPrice;
              const changePct = ((currentPrice - prevPrice) / prevPrice) * 100;
              const isUp = changePct >= 0;

              const chartData = prices.map((p, idx) => ({ tick: idx, price: Math.round(p * 10) / 10 }));

              return (
                <div key={sub.id} className="bg-[#0a0a0b]/40 border border-white/5 p-4 rounded-xl flex flex-col justify-between h-44">
                  <div className="flex justify-between items-start mb-2">
                    <div className="text-left font-mono">
                      <span className={`text-xs font-bold flex items-center gap-1 ${isUp ? 'text-emerald-400' : 'text-red-400'}`}>
                        {isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                        {isUp ? '+' : ''}{changePct.toFixed(2)}%
                      </span>
                      <span className="text-[11px] text-neutral-300 font-bold mt-0.5 block">{Math.round(currentPrice).toLocaleString('fa-IR')} ریال</span>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-bold text-white block" dir="rtl">{sub.name}</span>
                      <span className="text-[9px] text-neutral-500 font-semibold font-mono">{sub.ticker}</span>
                    </div>
                  </div>

                  {/* Micro Area Chart */}
                  <div className="h-20 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 0, right: 0, left: -40, bottom: 0 }}>
                        <defs>
                          <linearGradient id={`grad-${sub.id}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={isUp ? '#10B981' : '#EF4444'} stopOpacity={0.2}/>
                            <stop offset="95%" stopColor={isUp ? '#10B981' : '#EF4444'} stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="tick" hide />
                        <YAxis hide domain={['dataMin - 1', 'dataMax + 1']} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#0a0a0b', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '6px', fontSize: '10px' }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="price" 
                          stroke={isUp ? '#10B981' : '#EF4444'} 
                          strokeWidth={1.5}
                          fillOpacity={1} 
                          fill={`url(#grad-${sub.id})`} 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Security Notifications List */}
        <div className="bg-[#0a0a0b]/40 border border-white/10 rounded-xl p-4.5 flex flex-col justify-between h-[375px]">
          <div>
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-white/10">
              <span className="text-[10px] bg-red-500/10 text-red-400 border border-red-500/15 px-2 py-0.5 rounded-md font-mono flex items-center gap-1">
                <Bell size={10} />
                <span>Live Feed</span>
              </span>
              <h4 className="text-xs font-bold text-neutral-300" dir="rtl">هشدارهای پایش نظارتی بازار</h4>
            </div>

            <div className="space-y-3 max-h-[250px] overflow-y-auto no-scrollbar">
              {activeAlerts.map(alert => (
                <div 
                  key={alert.id} 
                  className={`p-3 rounded-lg border text-right text-xs relative overflow-hidden transition-opacity ${
                    alert.resolved 
                      ? 'bg-white/[0.02] border-white/5 opacity-60' 
                      : alert.severity === 'high'
                      ? 'bg-red-950/20 border-red-900/20 shadow-sm'
                      : 'bg-[#16161a] border-white/10'
                  }`}
                  dir="rtl"
                >
                  <div className="flex justify-between items-center mb-1 text-[10px]">
                    <span className="font-mono text-neutral-500">{alert.time}</span>
                    <span className={`font-bold ${alert.resolved ? 'text-neutral-500' : 'text-blue-400'}`}>{alert.ticker}</span>
                  </div>
                  <p className="text-[11px] text-neutral-300 leading-relaxed font-medium mb-2 pr-0.5">{alert.message}</p>
                  
                  {!alert.resolved && (
                    <button
                      onClick={() => handleResolveAlert(alert.id)}
                      className="px-2 py-0.5 bg-[#0a0a0b] hover:bg-white/[0.05] border border-white/10 text-emerald-400 rounded transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <CheckCircle size={10} />
                      <span>تایید و رفع هشدار</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <p className="text-[10px] text-neutral-500 text-center leading-relaxed font-mono" dir="rtl">
            * الگوریتم پایش با محاسبه شاخص‌های نوسان غیرعادی (Z-Score حجمی) سهام شرکت‌های فرعی در تالارهای بورس فعال است.
          </p>
        </div>
      </div>
    </div>
  );
}
