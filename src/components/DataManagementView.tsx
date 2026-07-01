import React, { useState, useRef } from 'react';
import { generateCSVTemplate, parseCSVCompanyData } from '../mockData';
import { Subsidiary, RiskThresholds } from '../types';
import { 
  FileSpreadsheet, UploadCloud, Download, CheckCircle2, AlertCircle, 
  HelpCircle, Trash2, Database, Play
} from 'lucide-react';

interface DataManagementViewProps {
  thresholds: RiskThresholds;
  onImportSuccess: (newSubs: Subsidiary[]) => void;
  onResetToDefault: () => void;
  subsidiariesCount: number;
}

export default function DataManagementView({
  thresholds,
  onImportSuccess,
  onResetToDefault,
  subsidiariesCount
}: DataManagementViewProps) {
  const [dragActive, setDragActive] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [pastedCSV, setPastedCSV] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Template Downloader
  const handleDownloadTemplate = () => {
    const csvContent = generateCSVTemplate();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'Bank_Sepah_Financial_Template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // CSV File parser
  const processCSVText = (text: string) => {
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const importedSubs = parseCSVCompanyData(text, thresholds);
      if (importedSubs.length === 0) {
        throw new Error('فایل خالی است یا ساختار هدرها نامعتبر است. / Empty or invalid headers');
      }
      onImportSuccess(importedSubs);
      setSuccessMsg(`تعداد ${importedSubs.length.toLocaleString('fa-IR')} شرکت جدید با موفقیت به بانک اطلاعاتی هلدینگ بانک سپه الحاق شد.`);
      setPastedCSV('');
    } catch (err: any) {
      setErrorMsg(`خطا در پردازش فایل وارد شده: ${err.message || err}`);
    }
  };

  // File Upload Handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      handleFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      processCSVText(text);
    };
    reader.onerror = () => {
      setErrorMsg('خطا در خواندن فایل از روی حافظه دستگاه.');
    };
    reader.readAsText(file);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Pre-load sample file directly inside the text box for demo ease
  const handleLoadSampleCSV = () => {
    const sample = `CompanyId,PersianName,EnglishName,Ticker,Sector,SectorEng,Revenue,NetProfit,TotalAssets,TotalLiabilities,CurrentAssets,CurrentLiabilities,OperatingCashFlow,RAndDExpenses,RetainedEarnings,StockEquity,BoardMembersCount,IndependentDirectorsRatio,BoardMeetingsCount,AttendanceRate,TransparencyScore,AuditQualityRating,ShareholderDisputesCount,EnvironmentalScore,CarbonEmissionsLevel,SocialScore,LaborStandardsCompliance,EsgGovernanceScore,Beta\nsadra-steel,فولاد کاران صدرا,Sadra Steel Corp,فصدرا,فلزات اساسی,Heavy Industries,1450,285,2200,950,1150,600,240,15,480,1250,5,0.40,18,0.94,85,A,1,65,Medium,78,TRUE,82,1.25`;
    setPastedCSV(sample);
  };

  return (
    <div className="space-y-6 text-neutral-200 font-sans" id="data-management-tab">
      
      {/* Overview */}
      <div className="bg-[#16161a] border border-white/10 p-5 rounded-xl shadow-lg flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="text-right order-2 md:order-1">
          <h3 className="text-sm font-bold text-neutral-100 flex items-center justify-end gap-2" dir="rtl">
            مدیریت ترازنامه‌ها و داده‌های حاکمیتی
            <span className="px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded text-[10px] font-mono">
              Database Sync
            </span>
          </h3>
          <p className="text-xs text-neutral-400 mt-1" dir="rtl">
            ورود داده‌های حسابداری، صورت‌های مالی سالانه و معیارهای حاکمیتی شرکت‌های زیرمجموعه از طریق فایل‌های اکسل و CSV استاندارد.
          </p>
        </div>
        <span className="p-3 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl order-1 md:order-2">
          <Database size={24} />
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card Left: Download Template & Drag-drop */}
        <div className="bg-[#16161a] border border-white/10 p-5 rounded-xl shadow-lg flex flex-col justify-between space-y-6">
          <div>
            <div className="flex justify-between items-center pb-4 border-b border-white/10 mb-5">
              <span className="text-xs font-mono text-neutral-500 font-semibold">IMPORT SYSTEM</span>
              <h4 className="text-sm font-bold text-neutral-300" dir="rtl">بارگذاری فایل اکسل / CSV تابعه</h4>
            </div>

            <div className="space-y-4">
              <p className="text-xs text-neutral-400 leading-relaxed text-right" dir="rtl">
                برای جلوگیری از انحراف ساختار ترازنامه‌ها، ابتدا طرح خام استاندارد را دانلود کرده و مقادیر مالی شرکت فرعی خود را عینا با ساختار ستون‌های آن مطابقت دهید.
              </p>

              {/* Download template trigger */}
              <button
                id="download-template-btn"
                onClick={handleDownloadTemplate}
                className="w-full py-2.5 bg-[#0a0a0b] hover:bg-white/[0.05] text-blue-400 font-bold text-xs border border-white/10 rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Download size={14} />
                <span dir="rtl">دانلود فایل اکسل پیش‌فرض مجمع (Standard CSV Template)</span>
              </button>

              {/* Drag zone */}
              <div 
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={triggerFileInput}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                  dragActive 
                    ? 'border-blue-500 bg-blue-500/[0.02]' 
                    : 'border-white/10 hover:border-white/20 bg-[#0a0a0b]/40'
                }`}
              >
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden" 
                  accept=".csv,.txt"
                />
                <UploadCloud size={36} className="mx-auto text-neutral-500 mb-3" />
                <span className="text-xs font-bold text-neutral-300 block" dir="rtl">فایل CSV خود را به اینجا بکشید یا کلیک کنید</span>
                <span className="text-[10px] text-neutral-500 mt-1 block">Supported format: Standard Comma-Separated Values (.csv)</span>
              </div>
            </div>
          </div>

          {/* Feedback alerts */}
          {(successMsg || errorMsg) && (
            <div className="space-y-2">
              {successMsg && (
                <div className="p-3 bg-emerald-950/30 border border-emerald-900/50 text-emerald-400 text-xs rounded-lg flex items-start gap-2 text-right leading-relaxed" dir="rtl">
                  <CheckCircle2 size={16} className="flex-shrink-0 mt-0.5" />
                  <span>{successMsg}</span>
                </div>
              )}
              {errorMsg && (
                <div className="p-3 bg-red-950/30 border border-red-900/50 text-red-400 text-xs rounded-lg flex items-start gap-2 text-right leading-relaxed" dir="rtl">
                  <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}
            </div>
          )}

          {/* Reset button to clear database back to factory mock */}
          <div className="pt-4 border-t border-white/10 flex justify-between items-center text-xs text-neutral-500">
            <button
              onClick={onResetToDefault}
              className="px-3.5 py-1.5 bg-red-950/20 hover:bg-red-950/40 border border-red-900/30 text-red-400 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer font-semibold"
            >
              <Trash2 size={13} />
              <span dir="rtl">ریست کامل پایگاه داده</span>
            </button>
            <div dir="rtl">
              شرکت‌های تابعه فعال در حافظه: <span className="font-bold text-neutral-300 font-mono">{subsidiariesCount}</span>
            </div>
          </div>
        </div>

        {/* Card Right: Direct Paste Console (Extremely useful for testing) */}
        <div className="bg-[#16161a] border border-white/10 p-5 rounded-xl shadow-lg flex flex-col justify-between space-y-6">
          <div>
            <div className="flex justify-between items-center pb-4 border-b border-white/10 mb-5">
              <span className="text-xs font-mono text-neutral-500 font-semibold">CONSOLE RAW SYNC</span>
              <h4 className="text-sm font-bold text-neutral-300" dir="rtl">کنسول درج مستقیم داده‌های متنی (Paste CSV)</h4>
            </div>

            <div className="space-y-4">
              <p className="text-xs text-neutral-400 leading-relaxed text-right" dir="rtl">
                برای سرعت کار، می‌توانید کدهای صورت‌های مالی را مستقیماً در کادر زیر پیست کرده و دکمه الحاق را بزنید. روی دکمه نمونه مجمع بزنید تا یک فرمت آزمایشی برای شما آماده شود.
              </p>

              <button
                onClick={handleLoadSampleCSV}
                className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] rounded hover:bg-blue-500/20 transition-all font-semibold flex items-center gap-1.5 cursor-pointer self-start"
              >
                <Play size={10} />
                <span dir="rtl">ایجاد کدهای نمونه ترازنامه مجمع (Sample Code)</span>
              </button>

              <textarea
                value={pastedCSV}
                onChange={(e) => setPastedCSV(e.target.value)}
                className="w-full h-44 bg-[#0a0a0b] border border-white/10 rounded-xl p-3 text-xs font-mono text-white focus:outline-none focus:border-blue-500/40 leading-relaxed"
                placeholder="Paste CSV rows here..."
                dir="ltr"
              />

              <button
                onClick={() => processCSVText(pastedCSV)}
                disabled={!pastedCSV.trim()}
                className="w-full py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-white/5 disabled:to-white/5 disabled:text-neutral-600 text-white font-bold text-xs rounded-lg shadow transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Database size={14} />
                <span dir="rtl">الحاق کدهای فاکتور به ترازنامه هلدینگ</span>
              </button>
            </div>
          </div>

          <div className="text-[10px] text-neutral-500 leading-relaxed text-right pt-4 border-t border-white/10" dir="rtl">
            ⚠️ هشدارهای تطبیق ترازنامه: در صورتی که شناسه شرکت (<code className="text-blue-400 font-mono">CompanyId</code>) با شرکت‌های موجود همخوانی داشته باشد، صورت‌های مالی آن شرکت جایگزین شده و اطلاعات مالی قبلی بازنویسی می‌شود.
          </div>
        </div>
      </div>
    </div>
  );
}
