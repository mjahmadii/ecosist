'use client';
import { useState, useRef } from 'react';
import {
  Upload, Download, FileSpreadsheet, CheckCircle, AlertCircle, Loader,
  Trash2, RefreshCw, AlertTriangle, Info, FileText, Table, ChevronDown,
  Database, Eye, X, Plus,
} from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { generateExcelTemplate, exportPortfolioExcel, exportSubsidiariesToCSV, exportToPDF } from '@/utils';
import * as XLSX from 'xlsx';
import ContextChat from '@/components/ui/ContextChat';
import type { ImportValidationError } from '@/types';

const QUICK_PROMPTS = [
  'راهنمای وارد کردن داده‌ها',
  'ساختار فایل Excel را توضیح بده',
  'خطاهای رایج در وارد کردن داده',
];

interface ValidationResult {
  valid: boolean;
  errors: ImportValidationError[];
  warnings: string[];
  rows: number;
  sheets: string[];
}

function validateExcelData(data: Record<string, unknown[]>): ValidationResult {
  const errors: ImportValidationError[] = [];
  const warnings: string[] = [];
  const sheets = Object.keys(data);
  let totalRows = 0;

  if (!sheets.includes('صورت_مالی') && !sheets.includes('صورت مالی')) {
    errors.push({ row: 0, column: 'شیت', message: 'شیت «صورت مالی» یافت نشد' });
  }

  const finSheet = data['صورت_مالی'] ?? data['صورت مالی'] ?? [];
  totalRows += finSheet.length;

  finSheet.forEach((row: unknown, i: number) => {
    const r = row as Record<string, unknown>;
    const requiredCols = ['نام شرکت*', 'سال مالی*', 'درآمد (م.ت)*', 'سود خالص (م.ت)*', 'دارایی کل (م.ت)*'];
    requiredCols.forEach((col) => {
      const plainCol = col.replace('*', '');
      const val = r[col] ?? r[plainCol];
      if (val === undefined || val === null || val === '') {
        errors.push({ row: i + 2, column: plainCol, message: `ستون "${plainCol}" در ردیف ${i + 2} خالی است` });
      }
    });

    const revenue = parseFloat(String(r['درآمد (م.ت)*'] ?? r['درآمد (م.ت)'] ?? 0));
    if (revenue < 0) errors.push({ row: i + 2, column: 'درآمد', message: `درآمد نمی‌تواند منفی باشد (ردیف ${i + 2})` });

    const year = parseInt(String(r['سال مالی*'] ?? r['سال مالی'] ?? 0));
    if (year < 1390 || year > 1410) {
      warnings.push(`سال مالی ${year} در ردیف ${i + 2} خارج از بازه معمول است`);
    }
  });

  if (!sheets.includes('حاکمیت_شرکتی') && !sheets.includes('حاکمیت شرکتی')) {
    warnings.push('شیت «حاکمیت شرکتی» یافت نشد — این داده اختیاری است');
  }
  if (!sheets.includes('ESG')) {
    warnings.push('شیت «ESG» یافت نشد — این داده اختیاری است');
  }

  return { valid: errors.length === 0, errors, warnings, rows: totalRows, sheets };
}

export default function DataView() {
  const { holdingData, clearAllData } = useAppStore();
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [activeTab, setActiveTab] = useState<'import' | 'export' | 'manage'>('import');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [previewData, setPreviewData] = useState<Record<string, unknown[]> | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
      setValidation({ valid: false, errors: [{ row: 0, column: 'فایل', message: 'فرمت پشتیبانی نمی‌شود. لطفاً .xlsx یا .csv آپلود کنید.' }], warnings: [], rows: 0, sheets: [] });
      return;
    }
    setUploading(true);
    setValidation(null);
    setPreviewData(null);
    try {
      await new Promise((r) => setTimeout(r, 600));
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(new Uint8Array(buffer), { type: 'array' });
      const parsed: Record<string, unknown[]> = {};
      wb.SheetNames.forEach((name) => { parsed[name] = XLSX.utils.sheet_to_json(wb.Sheets[name]); });
      const result = validateExcelData(parsed);
      setValidation(result);
      setPreviewData(parsed);
    } catch {
      setValidation({ valid: false, errors: [{ row: 0, column: 'فایل', message: 'خطا در پردازش فایل. فایل ممکن است خراب باشد.' }], warnings: [], rows: 0, sheets: [] });
    }
    setUploading(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const tabs = [
    { id: 'import' as const, label: 'ورود داده', icon: Upload },
    { id: 'export' as const, label: 'صدور گزارش', icon: Download },
    { id: 'manage' as const, label: 'مدیریت داده', icon: Database },
  ];

  return (
    <div className="p-5 space-y-5 animate-fade-in max-w-5xl">
      {/* Header */}
      <div>
        <h2 className="section-title">داده‌ها و گزارش‌ها</h2>
        <p className="section-subtitle">ورود داده‌های واقعی، مدیریت اطلاعات و صدور گزارش‌های حرفه‌ای</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', width: 'fit-content' }}>
        {tabs.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setActiveTab(id)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={activeTab === id
              ? { background: 'var(--surface-active)', color: '#6479ff', border: '1px solid rgba(61,82,255,0.2)' }
              : { color: 'var(--text-2)', background: 'transparent', border: '1px solid transparent' }}>
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* IMPORT TAB */}
      {activeTab === 'import' && (
        <div className="space-y-4">
          {/* Template download */}
          <div className="card p-5">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <FileSpreadsheet className="w-4 h-4" style={{ color: '#34d399' }} />
                  <h3 className="section-title">قالب استاندارد Excel</h3>
                </div>
                <p className="section-subtitle">قالب را دانلود کرده، داده‌های شرکت‌ها را وارد کنید و مجدداً آپلود کنید</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {[
                    { label: 'صورت مالی', color: '#3d52ff', required: true },
                    { label: 'حاکمیت شرکتی', color: '#8b5cf6', required: false },
                    { label: 'ESG', color: '#10b981', required: false },
                    { label: 'راهنما', color: '#64748b', required: false },
                  ].map(({ label, color, required }) => (
                    <span key={label} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full"
                      style={{ background: `${color}12`, border: `1px solid ${color}25`, color }}>
                      📄 {label} {required && <span className="text-[10px] opacity-60">*اجباری</span>}
                    </span>
                  ))}
                </div>
              </div>
              <button onClick={generateExcelTemplate} className="btn btn-emerald">
                <Download className="w-4 h-4" />
                دانلود قالب
              </button>
            </div>
          </div>

          {/* Column documentation */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Info className="w-4 h-4 text-brand-400" />
              <h3 className="section-title">راهنمای ستون‌ها و فرمت داده</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>ستون</th>
                    <th>نوع</th>
                    <th>اجباری</th>
                    <th>توضیح</th>
                    <th>مثال</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { col: 'نام شرکت', type: 'متن', req: true, desc: 'نام کامل شرکت تابعه', ex: 'سپه پردازش' },
                    { col: 'سال مالی', type: 'عدد', req: true, desc: 'سال شمسی ۴ رقمی', ex: '۱۴۰۲' },
                    { col: 'درآمد (م.ت)', type: 'عدد', req: true, desc: 'کل درآمد به میلیون تومان', ex: '۴۲۰۰۰۰' },
                    { col: 'سود خالص (م.ت)', type: 'عدد', req: true, desc: 'سود پس از مالیات', ex: '۵۲۰۰۰' },
                    { col: 'دارایی کل (م.ت)', type: 'عدد', req: true, desc: 'مجموع دارایی‌های ترازنامه', ex: '۹۸۰۰۰۰' },
                    { col: 'بدهی کل (م.ت)', type: 'عدد', req: true, desc: 'مجموع بدهی‌های ترازنامه', ex: '۴۲۰۰۰۰' },
                    { col: 'حقوق صاحبان سهام', type: 'عدد', req: true, desc: 'حقوق صاحبان سهام', ex: '۵۶۰۰۰۰' },
                    { col: 'جریان نقدی عملیاتی', type: 'عدد', req: false, desc: 'جریان نقدی از عملیات', ex: '۶۸۰۰۰' },
                    { col: 'EBITDA', type: 'عدد', req: false, desc: 'سود قبل از بهره، مالیات و استهلاک', ex: '۸۴۰۰۰' },
                  ].map(({ col, type, req, desc, ex }) => (
                    <tr key={col}>
                      <td className="font-mono text-xs font-semibold" style={{ color: req ? '#6479ff' : 'var(--text-1)' }}>{col}{req && ' *'}</td>
                      <td><span className="badge badge-slate">{type}</span></td>
                      <td>{req ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <span style={{ color: 'var(--text-3)' }}>–</span>}</td>
                      <td style={{ color: 'var(--text-2)' }}>{desc}</td>
                      <td className="font-mono text-xs" style={{ color: 'var(--text-3)', direction: 'ltr' }}>{ex}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Drop zone */}
          <div className="card p-5">
            <h3 className="section-title mb-4 flex items-center gap-2">
              <Upload className="w-4 h-4" style={{ color: '#6479ff' }} />
              آپلود فایل داده
            </h3>
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all"
              style={{
                borderColor: dragging ? '#3d52ff' : 'var(--border-2)',
                background: dragging ? 'rgba(61,82,255,0.06)' : 'var(--surface-2)',
              }}
            >
              <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
              {uploading ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto"
                    style={{ background: 'rgba(61,82,255,0.1)', border: '1px solid rgba(61,82,255,0.2)' }}>
                    <Loader className="w-6 h-6 text-brand-400 animate-spin" />
                  </div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-1)' }}>در حال پردازش و اعتبارسنجی...</p>
                </div>
              ) : (
                <>
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                    style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                    <Upload className="w-7 h-7" style={{ color: 'var(--text-3)' }} />
                  </div>
                  <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text-1)' }}>فایل Excel یا CSV را اینجا رها کنید</p>
                  <p className="text-xs mb-3" style={{ color: 'var(--text-3)' }}>یا کلیک کنید تا فایل انتخاب کنید</p>
                  <div className="flex justify-center gap-2">
                    {['.xlsx', '.xls', '.csv'].map((ext) => (
                      <span key={ext} className="badge badge-slate">{ext}</span>
                    ))}
                    <span className="badge badge-slate">حداکثر ۱۰ مگابایت</span>
                  </div>
                </>
              )}
            </div>

            {/* Validation result */}
            {validation && (
              <div className="mt-4 space-y-3">
                <div className="flex items-start gap-3 p-4 rounded-xl"
                  style={validation.valid
                    ? { background: 'rgba(0,196,140,0.08)', border: '1px solid rgba(0,196,140,0.2)' }
                    : { background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)' }}>
                  {validation.valid
                    ? <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    : <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />}
                  <div className="flex-1">
                    <p className="text-sm font-semibold" style={{ color: validation.valid ? '#34d399' : '#fb7185' }}>
                      {validation.valid ? 'فایل با موفقیت اعتبارسنجی شد' : 'خطاهایی در فایل یافت شد'}
                    </p>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-2)' }}>
                      {validation.rows} ردیف داده | {validation.sheets.length} شیت: {validation.sheets.join('، ')}
                    </p>
                  </div>
                  {validation.valid && (
                    <button className="btn btn-emerald btn-sm flex-shrink-0">
                      <Plus className="w-3.5 h-3.5" />
                      اعمال داده‌ها
                    </button>
                  )}
                </div>

                {validation.errors.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-xs font-bold" style={{ color: '#fb7185' }}>خطاها ({validation.errors.length}):</p>
                    {validation.errors.map((err, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs p-2 rounded-lg"
                        style={{ background: 'rgba(244,63,94,0.05)', border: '1px solid rgba(244,63,94,0.12)' }}>
                        <X className="w-3.5 h-3.5 text-rose-400 mt-0.5 flex-shrink-0" />
                        <span style={{ color: 'var(--text-2)' }}>
                          {err.row > 0 ? `ردیف ${err.row} — ` : ''}{err.column}: {err.message}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {validation.warnings.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-xs font-bold text-amber-400">هشدارها ({validation.warnings.length}):</p>
                    {validation.warnings.map((w, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs p-2 rounded-lg"
                        style={{ background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.15)' }}>
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400 mt-0.5 flex-shrink-0" />
                        <span style={{ color: 'var(--text-2)' }}>{w}</span>
                      </div>
                    ))}
                  </div>
                )}

                {previewData && validation.valid && (
                  <div className="card p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Eye className="w-4 h-4" style={{ color: 'var(--text-3)' }} />
                      <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>پیش‌نمایش داده</p>
                    </div>
                    <div className="overflow-x-auto max-h-48">
                      {Object.entries(previewData).slice(0, 1).map(([sheet, rows]) => (
                        <div key={sheet}>
                          <p className="badge badge-brand mb-2">{sheet}</p>
                          {rows.length > 0 && (
                            <table className="tbl text-xs">
                              <thead>
                                <tr>{Object.keys(rows[0] as Record<string, unknown>).slice(0, 5).map((k) => <th key={k}>{k}</th>)}</tr>
                              </thead>
                              <tbody>
                                {(rows as Record<string, unknown>[]).slice(0, 3).map((row, i) => (
                                  <tr key={i}>{Object.values(row).slice(0, 5).map((v, j) => <td key={j}>{String(v)}</td>)}</tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* EXPORT TAB */}
      {activeTab === 'export' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              {
                title: 'گزارش جامع پرتفولیو',
                desc: 'صورت مالی، حاکمیت، ESG و ریسک همه شرکت‌ها در یک فایل Excel با چند شیت',
                format: 'Excel (xlsx)',
                icon: FileSpreadsheet,
                color: '#34d399',
                action: () => holdingData && exportPortfolioExcel(holdingData),
              },
              {
                title: 'داده خام CSV',
                desc: 'اطلاعات شرکت‌های تابعه در قالب CSV برای تحلیل در ابزارهای دیگر',
                format: 'CSV',
                icon: Table,
                color: '#22d3ee',
                action: () => holdingData && exportSubsidiariesToCSV(holdingData.subsidiaries),
              },
              {
                title: 'گزارش PDF اجرایی',
                desc: 'گزارش قابل چاپ برای ارائه به هیئت مدیره و سهامداران',
                format: 'PDF (چاپ)',
                icon: FileText,
                color: '#a78bfa',
                action: () => exportToPDF('main-content', 'گزارش_اجرایی_گروه'),
              },
              {
                title: 'خروجی JSON',
                desc: 'داده‌های کامل سیستم در قالب JSON برای یکپارچه‌سازی با سیستم‌های دیگر',
                format: 'JSON',
                icon: Database,
                color: '#fbbf24',
                action: () => {
                  if (!holdingData) return;
                  const blob = new Blob([JSON.stringify(holdingData, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url; a.download = 'portfolio_data.json';
                  a.click(); URL.revokeObjectURL(url);
                },
              },
            ].map(({ title, desc, format, icon: Icon, color, action }) => (
              <div key={title} className="card card-hover p-5 flex items-start justify-between gap-4"
                style={{ borderColor: `${color}20` }}>
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `${color}12`, border: `1px solid ${color}22` }}>
                    <Icon className="w-5 h-5" style={{ color }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>{title}</p>
                    <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--text-2)' }}>{desc}</p>
                    <span className="badge badge-slate mt-2">{format}</span>
                  </div>
                </div>
                <button onClick={action} disabled={!holdingData}
                  className="btn btn-secondary btn-sm flex-shrink-0"
                  style={{ borderColor: `${color}25`, color }}>
                  <Download className="w-3.5 h-3.5" />
                  دانلود
                </button>
              </div>
            ))}
          </div>

          {/* Report instructions */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Info className="w-4 h-4 text-brand-400" />
              <h3 className="section-title">گزارش‌های قابل تولید</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm" style={{ color: 'var(--text-2)' }}>
              {[
                '✅ گزارش ماهانه عملکرد مالی شرکت‌های تابعه',
                '✅ گزارش حاکمیت شرکتی سالانه',
                '✅ گزارش ESG و پایداری',
                '✅ تحلیل ریسک و پیش‌بینی ورشکستگی',
                '✅ مقایسه عملکرد صنعتی (Benchmarking)',
                '✅ داشبورد اجرایی برای هیئت مدیره',
              ].map((item) => (
                <div key={item} className="flex items-center gap-2 p-2.5 rounded-lg" style={{ background: 'var(--surface-2)' }}>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MANAGE TAB */}
      {activeTab === 'manage' && (
        <div className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'شرکت تابعه', value: holdingData?.subsidiaries.length ?? 0, color: '#3d52ff' },
              { label: 'سال‌های مالی', value: holdingData?.subsidiaries[0]?.financials.length ?? 0, color: '#00c48c' },
              { label: 'هشدارهای فعال', value: holdingData?.subsidiaries.flatMap((s) => s.alerts).filter((a) => !a.acknowledged).length ?? 0, color: '#f59e0b' },
              { label: 'توصیه‌های AI', value: 0, color: '#a78bfa' },
            ].map(({ label, value, color }) => (
              <div key={label} className="card p-4 text-center">
                <div className="text-2xl font-bold mb-1" style={{ color }}>{value}</div>
                <div className="text-xs" style={{ color: 'var(--text-3)' }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Danger zone */}
          <div className="card p-5" style={{ border: '1px solid rgba(244,63,94,0.2)', background: 'rgba(244,63,94,0.03)' }}>
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <h3 className="text-sm font-semibold" style={{ color: '#fb7185' }}>منطقه مدیریت داده</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>بازگردانی داده نمونه</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-2)' }}>داده‌های دمو را مجدداً بارگذاری کنید</p>
                </div>
                <button className="btn btn-secondary btn-sm">
                  <RefreshCw className="w-3.5 h-3.5" />
                  بازگردانی
                </button>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: 'rgba(244,63,94,0.06)', border: '1px solid rgba(244,63,94,0.2)' }}>
                <div>
                  <p className="text-sm font-semibold" style={{ color: '#fb7185' }}>حذف همه داده‌ها</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-2)' }}>تمام اطلاعات پرتفولیو پاک می‌شود. این عمل برگشت‌پذیر نیست.</p>
                </div>
                {showClearConfirm ? (
                  <div className="flex items-center gap-2">
                    <button onClick={() => { clearAllData(); setShowClearConfirm(false); }} className="btn btn-danger btn-sm">تأیید حذف</button>
                    <button onClick={() => setShowClearConfirm(false)} className="btn btn-secondary btn-sm">لغو</button>
                  </div>
                ) : (
                  <button onClick={() => setShowClearConfirm(true)} className="btn btn-danger btn-sm">
                    <Trash2 className="w-3.5 h-3.5" />
                    حذف داده‌ها
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <ContextChat moduleId="data" quickPrompts={QUICK_PROMPTS} title="دستیار مدیریت داده" />
    </div>
  );
}
