import * as XLSX from 'xlsx';
import type { Subsidiary, HoldingCompany } from '@/types';
import { getSectorLabel, getStatusConfig, calcDebtRatio, calcCurrentRatio, calcROE, calcROA, calcNetMargin } from './index';

// ─── CSV Export ────────────────────────────────────────────
export function exportToCSV(data: Record<string, unknown>[], filename: string): void {
  if (!data.length) return;
  const headers = Object.keys(data[0]);
  const rows = data.map((row) =>
    headers.map((h) => {
      const val = String(row[h] ?? '');
      return val.includes(',') || val.includes('"') || val.includes('\n')
        ? `"${val.replace(/"/g, '""')}"`
        : val;
    }).join(',')
  );
  const csv = '﻿' + [headers.join(','), ...rows].join('\r\n');
  downloadBlob(csv, filename + '.csv', 'text/csv;charset=utf-8');
}

// ─── Excel Export ─────────────────────────────────────────
export function exportToExcel(data: Record<string, unknown>[], filename: string, sheetName = 'داده‌ها'): void {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, filename + '.xlsx');
}

// ─── Portfolio Excel report ────────────────────────────────
export function exportPortfolioExcel(holding: HoldingCompany): void {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Summary
  const summary = [
    { 'شاخص': 'نام گروه', 'مقدار': holding.name },
    { 'شاخص': 'تعداد شرکت تابعه', 'مقدار': holding.subsidiaries.length },
    { 'شاخص': 'کل دارایی‌ها (م.ت)', 'مقدار': holding.totalAssets.toLocaleString('fa-IR') },
    { 'شاخص': 'کل درآمد (م.ت)', 'مقدار': holding.totalRevenue.toLocaleString('fa-IR') },
    { 'شاخص': 'سود خالص (م.ت)', 'مقدار': holding.totalNetIncome.toLocaleString('fa-IR') },
    { 'شاخص': 'میانگین امتیاز مالی', 'مقدار': holding.portfolioSummary.avgFinancialScore.toFixed(1) },
    { 'شاخص': 'میانگین امتیاز حاکمیتی', 'مقدار': holding.portfolioSummary.avgGovernanceScore.toFixed(1) },
    { 'شاخص': 'میانگین امتیاز ESG', 'مقدار': holding.portfolioSummary.avgESGScore.toFixed(1) },
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summary), 'خلاصه اجرایی');

  // Sheet 2: Subsidiaries
  const subs = holding.subsidiaries.map((s) => {
    const fin = s.financials[s.financials.length - 1];
    return {
      'نام شرکت': s.name,
      'بخش': getSectorLabel(s.sector),
      'وضعیت': getStatusConfig(s.status).label,
      'درآمد (م.ت)': fin.revenue,
      'سود خالص (م.ت)': fin.netIncome,
      'دارایی کل (م.ت)': fin.totalAssets,
      'حقوق صاحبان سهام (م.ت)': fin.equity,
      'نسبت بدهی (٪)': calcDebtRatio(s),
      'نسبت جاری': calcCurrentRatio(s),
      'بازده حقوق صاحبان سهام (٪)': calcROE(s),
      'بازده دارایی (٪)': calcROA(s),
      'حاشیه سود (٪)': calcNetMargin(s),
      'امتیاز مالی': s.financialScore,
      'امتیاز حاکمیتی': s.governanceScore,
      'امتیاز ESG': s.esg.overallScore,
      'امتیاز کلی': s.overallScore,
      'رتبه ESG': s.esg.rating,
      'ریسک ورشکستگی': s.altmanZ.bankruptcyRisk === 'safe' ? 'ایمن' : s.altmanZ.bankruptcyRisk === 'grey' ? 'خاکستری' : 'بحرانی',
      'Z-Score': s.altmanZ.zScore,
      'مدیرعامل': s.ceo,
      'تعداد کارکنان': s.employeeCount,
      'درصد مالکیت': s.ownershipPercentage,
    };
  });
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(subs), 'شرکت‌های تابعه');

  // Sheet 3: Governance
  const gov = holding.subsidiaries.map((s) => ({
    'نام شرکت': s.name,
    'استقلال هیئت مدیره (٪)': s.governance.boardIndependence,
    'کیفیت حسابرسی': s.governance.auditQuality,
    'شفافیت گزارشگری': s.governance.disclosureScore,
    'حقوق سهامداران': s.governance.shareholderRights,
    'مدیریت ریسک': s.governance.riskManagement,
    'حضور در جلسات (٪)': s.governance.boardMeetingAttendance,
    'تعداد اعضای هیئت مدیره': s.governance.boardSize,
    'اعضای مستقل': s.governance.independentDirectors,
    'اعضای زن': s.governance.femaleDirectors,
    'سابقه مدیرعامل (سال)': s.governance.ceoTenureYears,
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(gov), 'حاکمیت شرکتی');

  // Sheet 4: ESG
  const esg = holding.subsidiaries.map((s) => ({
    'نام شرکت': s.name,
    'امتیاز کلی ESG': s.esg.overallScore,
    'رتبه ESG': s.esg.rating,
    'انتشار کربن': s.esg.environmental.carbonEmissions,
    'بهره‌وری انرژی': s.esg.environmental.energyEfficiency,
    'مدیریت پسماند': s.esg.environmental.wasteManagement,
    'رضایت کارکنان': s.esg.social.employeeSatisfaction,
    'تنوع جنسیتی (٪)': s.esg.social.genderDiversityRatio,
    'سرمایه‌گذاری اجتماعی': s.esg.social.communityInvestment,
    'شفافیت': s.esg.governance.transparencyScore,
    'ضد فساد': s.esg.governance.anticorruptionMeasures,
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(esg), 'ESG');

  XLSX.writeFile(wb, `گزارش_جامع_${holding.nameEn}_${new Date().toISOString().split('T')[0]}.xlsx`);
}

// ─── PDF Export (print-based) ─────────────────────────────
export function exportToPDF(elementId: string, filename: string): void {
  const el = document.getElementById(elementId);
  if (!el) return;

  const printWin = window.open('', '_blank');
  if (!printWin) return;

  const styles = Array.from(document.styleSheets)
    .map((ss) => {
      try { return Array.from(ss.cssRules).map((r) => r.cssText).join('\n'); } catch { return ''; }
    })
    .join('\n');

  printWin.document.write(`
    <!DOCTYPE html>
    <html dir="rtl" lang="fa">
    <head>
      <meta charset="UTF-8"/>
      <title>${filename}</title>
      <link rel="preconnect" href="https://fonts.googleapis.com"/>
      <link href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;600;700&display=swap" rel="stylesheet"/>
      <style>
        * { box-sizing: border-box; }
        body { font-family: 'Vazirmatn', sans-serif; direction: rtl; background: white; color: #0f172a; margin: 0; padding: 24px; }
        .no-print { display: none !important; }
        @page { margin: 15mm; }
        ${styles}
      </style>
    </head>
    <body class="light">
      ${el.innerHTML}
      <script>window.onload = () => { window.print(); window.close(); }</script>
    </body>
    </html>
  `);
  printWin.document.close();
}

// ─── Helper ───────────────────────────────────────────────
function downloadBlob(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── Subsidiary CSV ───────────────────────────────────────
export function exportSubsidiariesToCSV(subs: Subsidiary[]): void {
  const rows = subs.map((s) => {
    const fin = s.financials[s.financials.length - 1];
    return {
      'نام': s.name,
      'بخش': getSectorLabel(s.sector),
      'درآمد': fin.revenue,
      'سود_خالص': fin.netIncome,
      'دارایی': fin.totalAssets,
      'نسبت_بدهی': calcDebtRatio(s),
      'نسبت_جاری': calcCurrentRatio(s),
      'ROE': calcROE(s),
      'امتیاز_مالی': s.financialScore,
      'امتیاز_حاکمیتی': s.governanceScore,
      'امتیاز_ESG': s.esg.overallScore,
      'Z_Score': s.altmanZ.zScore,
      'وضعیت': getStatusConfig(s.status).label,
    };
  });
  exportToCSV(rows, 'شرکت‌های_تابعه_' + new Date().toISOString().split('T')[0]);
}

// ─── Excel Template with Docs ─────────────────────────────
export function generateExcelTemplate(): void {
  const wb = XLSX.utils.book_new();

  // Financial sheet
  const financialHeaders = ['نام شرکت*', 'سال مالی*', 'درآمد (م.ت)*', 'سود خالص (م.ت)*', 'دارایی کل (م.ت)*', 'بدهی کل (م.ت)*', 'حقوق صاحبان سهام (م.ت)*', 'جریان نقدی عملیاتی', 'EBITDA', 'دارایی‌های جاری', 'بدهی‌های جاری', 'سود انباشته'];
  const financialData = [
    financialHeaders,
    ['سپه پردازش', 1402, 420000, 52000, 980000, 420000, 560000, 68000, 84000, 340000, 168000, 210000],
    ['سپه پردازش', 1401, 385000, 44000, 920000, 415000, 505000, 62000, 76000, 310000, 155000, 185000],
    ['ساختمانی سپه', 1402, 285000, 31000, 650000, 312000, 338000, 48000, 58000, 220000, 115000, 140000],
  ];
  const ws1 = XLSX.utils.aoa_to_sheet(financialData);
  ws1['!cols'] = financialHeaders.map(() => ({ wch: 20 }));
  XLSX.utils.book_append_sheet(wb, ws1, 'صورت_مالی');

  // Governance sheet
  const govHeaders = ['نام شرکت*', 'استقلال هیئت (٪)*', 'کیفیت حسابرسی (۰-۱۰۰)', 'شفافیت (۰-۱۰۰)', 'حقوق سهامداران (۰-۱۰۰)', 'مدیریت ریسک (۰-۱۰۰)', 'اندازه هیئت*', 'اعضای مستقل*', 'اعضای زن', 'حضور جلسات (٪)', 'سابقه CEO (سال)'];
  const govData = [govHeaders, ['سپه پردازش', 72, 85, 78, 80, 88, 7, 5, 2, 92, 4], ['ساختمانی سپه', 65, 78, 72, 74, 76, 6, 4, 1, 88, 6]];
  const ws2 = XLSX.utils.aoa_to_sheet(govData);
  XLSX.utils.book_append_sheet(wb, ws2, 'حاکمیت_شرکتی');

  // ESG sheet
  const esgHeaders = ['نام شرکت*', 'انتشار کربن (۰-۱۰۰)', 'بهره‌وری انرژی', 'مدیریت پسماند', 'مصرف آب', 'رضایت کارکنان', 'تنوع جنسیتی (٪)', 'سرمایه‌گذاری اجتماعی', 'شفافیت حاکمیتی', 'ضد فساد'];
  const esgData = [esgHeaders, ['سپه پردازش', 78, 82, 75, 70, 84, 38, 72, 82, 88], ['ساختمانی سپه', 65, 70, 68, 72, 78, 32, 65, 74, 76]];
  const ws3 = XLSX.utils.aoa_to_sheet(esgData);
  XLSX.utils.book_append_sheet(wb, ws3, 'ESG');

  // Documentation sheet
  const docs = [
    ['راهنمای استفاده از قالب'],
    [''],
    ['ستون‌های اجباری با * مشخص شده‌اند'],
    [''],
    ['صورت مالی:'],
    ['- درآمد: کل درآمد ناخالص در میلیون تومان'],
    ['- سود خالص: سود پس از کسر مالیات در میلیون تومان'],
    ['- دارایی کل: مجموع دارایی‌های ترازنامه'],
    ['- بدهی کل: مجموع بدهی‌های ترازنامه'],
    ['- حقوق صاحبان سهام: حقوق صاحبان سهام در ترازنامه'],
    [''],
    ['حاکمیت شرکتی:'],
    ['- همه امتیازها در مقیاس ۰ تا ۱۰۰ هستند'],
    ['- استقلال هیئت: درصد اعضای مستقل'],
    [''],
    ['ESG:'],
    ['- همه امتیازها در مقیاس ۰ تا ۱۰۰ هستند'],
    ['- امتیاز بالاتر = عملکرد بهتر'],
  ];
  const wsDocs = XLSX.utils.aoa_to_sheet(docs);
  XLSX.utils.book_append_sheet(wb, wsDocs, 'راهنما');

  XLSX.writeFile(wb, 'قالب_استاندارد_ورود_داده.xlsx');
}
