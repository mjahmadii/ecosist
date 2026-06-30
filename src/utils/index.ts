import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import * as XLSX from 'xlsx';
import type { Subsidiary, AppSettings } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number, short = false): string {
  if (short) {
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}T`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(1)}B`;
    return `${value.toFixed(0)}M`;
  }
  return new Intl.NumberFormat('fa-IR').format(value) + ' م.ت';
}

export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}٪`;
}

export function getScoreColor(score: number): string {
  if (score >= 80) return 'text-emerald-400';
  if (score >= 65) return 'text-blue-400';
  if (score >= 50) return 'text-amber-400';
  return 'text-rose-400';
}

export function getScoreBg(score: number): string {
  if (score >= 80) return 'bg-emerald-500/20 border-emerald-500/30';
  if (score >= 65) return 'bg-blue-500/20 border-blue-500/30';
  if (score >= 50) return 'bg-amber-500/20 border-amber-500/30';
  return 'bg-rose-500/20 border-rose-500/30';
}

export function getStatusConfig(status: string) {
  const configs = {
    excellent: { label: 'عالی', color: 'text-emerald-400', bg: 'bg-emerald-500/20', dot: 'bg-emerald-400' },
    good: { label: 'خوب', color: 'text-blue-400', bg: 'bg-blue-500/20', dot: 'bg-blue-400' },
    warning: { label: 'هشدار', color: 'text-amber-400', bg: 'bg-amber-500/20', dot: 'bg-amber-400' },
    critical: { label: 'بحرانی', color: 'text-rose-400', bg: 'bg-rose-500/20', dot: 'bg-rose-400' },
  };
  return configs[status as keyof typeof configs] ?? configs.good;
}

export function getSectorLabel(sector: string): string {
  const labels: Record<string, string> = {
    technology: 'فناوری اطلاعات',
    realestate: 'مسکن و ساختمان',
    manufacturing: 'تولید و صنعت',
    energy: 'انرژی',
    banking: 'بانکداری',
    insurance: 'بیمه',
    leasing: 'لیزینگ',
    petrochemical: 'پتروشیمی',
    mining: 'معدن',
    healthcare: 'داروسازی و بهداشت',
  };
  return labels[sector] ?? sector;
}

export function getSectorColor(sector: string): string {
  const colors: Record<string, string> = {
    technology: '#3d52ff',
    realestate: '#f59e0b',
    manufacturing: '#8b5cf6',
    energy: '#10b981',
    banking: '#06b6d4',
    insurance: '#ec4899',
    leasing: '#f97316',
    petrochemical: '#6366f1',
    mining: '#84cc16',
    healthcare: '#14b8a6',
  };
  return colors[sector] ?? '#64748b';
}

export function calcDebtRatio(sub: Subsidiary): number {
  const latest = sub.financials[sub.financials.length - 1];
  return parseFloat(((latest.totalLiabilities / latest.totalAssets) * 100).toFixed(1));
}

export function calcCurrentRatio(sub: Subsidiary): number {
  const latest = sub.financials[sub.financials.length - 1];
  return parseFloat((latest.currentAssets / latest.currentLiabilities).toFixed(2));
}

export function calcROE(sub: Subsidiary): number {
  const latest = sub.financials[sub.financials.length - 1];
  return parseFloat(((latest.netIncome / latest.equity) * 100).toFixed(1));
}

export function calcROA(sub: Subsidiary): number {
  const latest = sub.financials[sub.financials.length - 1];
  return parseFloat(((latest.netIncome / latest.totalAssets) * 100).toFixed(1));
}

export function calcNetMargin(sub: Subsidiary): number {
  const latest = sub.financials[sub.financials.length - 1];
  return parseFloat(((latest.netIncome / latest.revenue) * 100).toFixed(1));
}

export function applyPersonaThresholds(score: number, settings: AppSettings): number {
  const persona = settings.riskPersona;
  const multiplier = persona === 'conservative' ? 0.9 : persona === 'aggressive' ? 1.1 : 1.0;
  return Math.min(100, Math.max(0, score * multiplier));
}

export function generateExcelTemplate(): void {
  const wb = XLSX.utils.book_new();

  const financialHeaders = [
    'نام شرکت', 'سال مالی', 'درآمد (م.ت)', 'سود خالص (م.ت)',
    'دارایی کل (م.ت)', 'بدهی کل (م.ت)', 'حقوق صاحبان سهام (م.ت)',
    'جریان نقدی عملیاتی (م.ت)', 'EBITDA (م.ت)', 'دارایی‌های جاری (م.ت)',
    'بدهی‌های جاری (م.ت)',
  ];
  const financialSample = [
    ['سپه پردازش', 1402, 420000, 52000, 980000, 420000, 560000, 68000, 84000, 340000, 168000],
  ];
  const ws1 = XLSX.utils.aoa_to_sheet([financialHeaders, ...financialSample]);
  XLSX.utils.book_append_sheet(wb, ws1, 'صورت مالی');

  const govHeaders = [
    'نام شرکت', 'استقلال هیئت مدیره (٪)', 'کیفیت حسابرسی', 'شفافیت گزارشگری',
    'حقوق سهامداران', 'مدیریت ریسک', 'تعداد اعضا هیئت مدیره',
    'اعضای مستقل', 'اعضای زن', 'حضور در جلسات (٪)', 'سابقه مدیرعامل (سال)',
  ];
  const govSample = [
    ['سپه پردازش', 72, 85, 78, 80, 88, 7, 5, 2, 92, 4],
  ];
  const ws2 = XLSX.utils.aoa_to_sheet([govHeaders, ...govSample]);
  XLSX.utils.book_append_sheet(wb, ws2, 'حاکمیت شرکتی');

  const esgHeaders = [
    'نام شرکت', 'انتشار کربن', 'بهره‌وری انرژی', 'مدیریت پسماند',
    'رضایت کارکنان', 'تنوع جنسیتی (٪)', 'شفافیت اطلاعات', 'مبارزه با فساد',
  ];
  const esgSample = [
    ['سپه پردازش', 78, 82, 75, 84, 38, 82, 88],
  ];
  const ws3 = XLSX.utils.aoa_to_sheet([esgHeaders, ...esgSample]);
  XLSX.utils.book_append_sheet(wb, ws3, 'ESG');

  XLSX.writeFile(wb, 'قالب_استاندارد_داده.xlsx');
}

export function parseUploadedExcel(file: File): Promise<Record<string, unknown[]>> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        const result: Record<string, unknown[]> = {};
        wb.SheetNames.forEach((name) => {
          result[name] = XLSX.utils.sheet_to_json(wb.Sheets[name]);
        });
        resolve(result);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

export function exportDashboardReport(subs: Subsidiary[]): void {
  const wb = XLSX.utils.book_new();
  const rows = subs.map((s) => {
    const fin = s.financials[s.financials.length - 1];
    return {
      'نام شرکت': s.nameEn,
      'بخش': getSectorLabel(s.sector),
      'امتیاز مالی': s.financialScore,
      'امتیاز حاکمیتی': s.governanceScore,
      'امتیاز کلی': s.overallScore,
      'امتیاز ESG': s.esg.overallScore,
      'درآمد': fin.revenue,
      'سود خالص': fin.netIncome,
      'نسبت بدهی (٪)': calcDebtRatio(s),
      'وضعیت': getStatusConfig(s.status).label,
      'ریسک ورشکستگی': s.altmanZ.bankruptcyRisk,
      'Z-Score': s.altmanZ.zScore,
    };
  });
  const ws = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, 'گزارش پرتفولیو');
  XLSX.writeFile(wb, `گزارش_پرتفولیو_${new Date().toISOString().split('T')[0]}.xlsx`);
}

export function buildSystemPrompt(holdingName: string, settings: AppSettings): string {
  return `You are an elite AI Financial Advisor and Corporate Governance Expert for "${holdingName}", a major Iranian holding company.
You speak primarily in Persian (Farsi) and provide executive-level strategic advice.
Risk profile: ${settings.riskPersona === 'conservative' ? 'محافظه‌کارانه' : settings.riskPersona === 'aggressive' ? 'تهاجمی' : 'متوازن'}
Key thresholds: Debt ratio max ${settings.thresholds.maxDebtRatio}%, Min governance score ${settings.thresholds.minGovernanceScore}, Min financial score ${settings.thresholds.minFinancialScore}
You analyze subsidiaries, financial data, governance metrics, ESG scores, and market conditions.
Provide specific, actionable, data-driven recommendations with quantitative estimates.
Format your responses with clear sections, bullet points, and Persian numerals when appropriate.`;
}
