'use client';
import { useState, useRef } from 'react';
import { Upload, Download, FileSpreadsheet, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { generateExcelTemplate, exportDashboardReport, parseUploadedExcel } from '@/utils';

export default function DataView() {
  const { holdingData } = useAppStore();
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<'success' | 'error' | null>(null);
  const [uploadMessage, setUploadMessage] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
      setUploadResult('error');
      setUploadMessage('فرمت فایل پشتیبانی نمی‌شود. لطفاً .xlsx یا .csv آپلود کنید.');
      return;
    }
    setUploading(true);
    setUploadResult(null);
    try {
      const data = await parseUploadedExcel(file);
      await new Promise((r) => setTimeout(r, 1500));
      const sheetCount = Object.keys(data).length;
      setUploadResult('success');
      setUploadMessage(`فایل با موفقیت پردازش شد — ${sheetCount} شیت با ${Object.values(data)[0]?.length ?? 0} ردیف داده استخراج گردید`);
    } catch (err) {
      setUploadResult('error');
      setUploadMessage('خطا در پردازش فایل. لطفاً از قالب استاندارد استفاده کنید.');
    }
    setUploading(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in max-w-4xl">
      <div>
        <h2 className="text-lg font-semibold text-white mb-1">مدیریت داده‌ها و گزارش‌ها</h2>
        <p className="text-sm text-slate-400">بارگذاری صورت‌های مالی و دریافت گزارش‌های حرفه‌ای</p>
      </div>

      {/* Download template */}
      <div className="glass rounded-2xl p-5 card-glow">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              قالب استاندارد Excel
            </h3>
            <p className="text-xs text-slate-400 mt-1">قالب را دانلود کرده، داده‌ها را وارد کنید و مجدداً آپلود کنید</p>
            <div className="flex flex-wrap gap-2 mt-3">
              {['صورت مالی', 'حاکمیت شرکتی', 'گزارش ESG'].map((sheet) => (
                <span key={sheet} className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  📄 {sheet}
                </span>
              ))}
            </div>
          </div>
          <button
            onClick={generateExcelTemplate}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600/20 border border-emerald-500/30 text-emerald-300 text-sm hover:bg-emerald-600/30 transition-all flex-shrink-0"
          >
            <Download className="w-4 h-4" />
            دانلود قالب
          </button>
        </div>
      </div>

      {/* Upload zone */}
      <div className="glass rounded-2xl p-5 card-glow">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Upload className="w-4 h-4 text-brand-400" />
          آپلود داده‌ها
        </h3>
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${
            dragging
              ? 'border-brand-400 bg-brand-500/10'
              : 'border-white/15 hover:border-white/30 hover:bg-white/3'
          }`}
        >
          <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
          {uploading ? (
            <div className="flex flex-col items-center gap-3">
              <Loader className="w-10 h-10 text-brand-400 animate-spin" />
              <p className="text-sm text-slate-300">در حال پردازش...</p>
            </div>
          ) : (
            <>
              <Upload className="w-10 h-10 text-slate-500 mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-300">فایل Excel یا CSV را اینجا رها کنید</p>
              <p className="text-xs text-slate-500 mt-1">یا کلیک کنید تا فایل انتخاب کنید</p>
              <p className="text-xs text-slate-600 mt-3">.xlsx | .xls | .csv — حداکثر ۱۰ مگابایت</p>
            </>
          )}
        </div>

        {uploadResult && (
          <div className={`flex items-start gap-3 mt-4 p-4 rounded-xl border ${
            uploadResult === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/20'
              : 'bg-rose-500/10 border-rose-500/20'
          }`}>
            {uploadResult === 'success'
              ? <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              : <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />}
            <p className={`text-sm ${uploadResult === 'success' ? 'text-emerald-300' : 'text-rose-300'}`}>
              {uploadMessage}
            </p>
          </div>
        )}
      </div>

      {/* Export reports */}
      <div className="glass rounded-2xl p-5 card-glow">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Download className="w-4 h-4 text-amber-400" />
          صدور گزارش‌ها
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { label: 'گزارش کامل پرتفولیو', desc: 'امتیازات، نسبت‌ها و وضعیت همه شرکت‌ها', action: () => holdingData && exportDashboardReport(holdingData.subsidiaries), color: 'brand' },
            { label: 'گزارش مدیریتی اجرایی', desc: 'خلاصه اجرایی برای هیئت مدیره گروه', action: () => holdingData && exportDashboardReport(holdingData.subsidiaries), color: 'emerald' },
          ].map(({ label, desc, action, color }) => (
            <div key={label} className="flex items-center justify-between p-4 rounded-xl bg-white/3 border border-white/5">
              <div>
                <p className="text-sm font-medium text-white">{label}</p>
                <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
              </div>
              <button
                onClick={action}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  color === 'emerald'
                    ? 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
                    : 'bg-brand-500/20 text-brand-300 hover:bg-brand-500/30'
                }`}
              >
                <Download className="w-3.5 h-3.5" />
                دانلود
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Instructions */}
      <div className="glass rounded-2xl p-5 card-glow">
        <h3 className="text-sm font-semibold text-white mb-3">راهنمای آپلود داده</h3>
        <ol className="space-y-2">
          {[
            'قالب استاندارد Excel را دانلود کنید',
            'داده‌های مالی شرکت‌های تابعه را در شیت «صورت مالی» وارد کنید',
            'اطلاعات حاکمیت شرکتی را در شیت مربوطه تکمیل کنید',
            'داده‌های ESG را در شیت سوم وارد کنید',
            'فایل تکمیل‌شده را آپلود کنید — سیستم به‌صورت خودکار امتیازدهی می‌کند',
          ].map((step, i) => (
            <li key={i} className="flex items-start gap-3 text-sm">
              <span className="w-5 h-5 rounded-full bg-brand-600/30 border border-brand-500/30 text-brand-300 text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                {i + 1}
              </span>
              <span className="text-slate-400">{step}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
