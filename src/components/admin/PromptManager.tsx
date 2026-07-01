'use client';
import { useState } from 'react';
import { Settings2, Edit3, RotateCcw, Save, X, AlertTriangle, CheckCircle, Zap, Info, ChevronDown, ChevronUp, Search } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { cn } from '@/utils';
import type { SystemPrompt } from '@/types';

const MODULE_ICONS: Record<string, string> = {
  dashboard: '📊',
  analysis: '📈',
  governance: '🛡️',
  esg: '🌱',
  risk: '⚠️',
  capital: '💰',
  subsidiaries: '🏢',
  'ai-assistant': '🤖',
  data: '📁',
};

const MODULE_COLORS: Record<string, string> = {
  dashboard: '#3d52ff',
  analysis: '#00c48c',
  governance: '#8b5cf6',
  esg: '#10b981',
  risk: '#f43f5e',
  capital: '#f59e0b',
  subsidiaries: '#06b6d4',
  'ai-assistant': '#3d52ff',
  data: '#64748b',
};

function PromptCard({ sp }: { sp: SystemPrompt }) {
  const { updateSystemPrompt, resetSystemPrompt } = useAppStore();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(sp.prompt);
  const [saved, setSaved] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const accent = MODULE_COLORS[sp.moduleId] ?? '#3d52ff';

  const handleSave = () => {
    updateSystemPrompt(sp.id, draft);
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleReset = () => {
    resetSystemPrompt(sp.id);
    setDraft(sp.prompt);
    setEditing(false);
  };

  return (
    <div
      className="card card-hover overflow-hidden"
      style={{ borderColor: editing ? `${accent}35` : undefined }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer"
        onClick={() => !editing && setExpanded((v) => !v)}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
            style={{ background: `${accent}15`, border: `1px solid ${accent}25` }}
          >
            {MODULE_ICONS[sp.moduleId] ?? '🔧'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>{sp.moduleName}</p>
              {saved && (
                <span className="flex items-center gap-1 text-xs text-emerald-400">
                  <CheckCircle className="w-3 h-3" /> ذخیره شد
                </span>
              )}
              {!sp.isDefault && (
                <span className="badge badge-brand">سفارشی</span>
              )}
            </div>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>{sp.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!editing && (
            <button
              onClick={(e) => { e.stopPropagation(); setEditing(true); setExpanded(true); }}
              className="btn btn-ghost btn-icon-sm"
              title="ویرایش"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
          )}
          {!editing && (
            expanded ? <ChevronUp className="w-4 h-4" style={{ color: 'var(--text-3)' }} />
              : <ChevronDown className="w-4 h-4" style={{ color: 'var(--text-3)' }} />
          )}
        </div>
      </div>

      {/* Content */}
      {(expanded || editing) && (
        <div className="px-4 pb-4 space-y-3">
          <div className="h-px" style={{ background: 'var(--border)' }} />

          {editing ? (
            <>
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                rows={8}
                className="inp w-full text-sm resize-none"
                style={{ fontFamily: 'Vazirmatn, monospace', lineHeight: '1.7', direction: 'rtl' }}
                placeholder="پرامپت سیستمی را وارد کنید..."
                dir="rtl"
              />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-3)' }}>
                  <Info className="w-3.5 h-3.5" />
                  {draft.length} کاراکتر
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={handleReset} className="btn btn-ghost btn-sm">
                    <RotateCcw className="w-3.5 h-3.5" />
                    بازگردانی
                  </button>
                  <button onClick={() => { setEditing(false); setDraft(sp.prompt); }} className="btn btn-secondary btn-sm">
                    <X className="w-3.5 h-3.5" />
                    لغو
                  </button>
                  <button onClick={handleSave} className="btn btn-primary btn-sm">
                    <Save className="w-3.5 h-3.5" />
                    ذخیره
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div
              className="text-sm leading-7 p-3 rounded-xl whitespace-pre-wrap"
              style={{ background: 'var(--surface-2)', color: 'var(--text-2)', direction: 'rtl', maxHeight: 200, overflowY: 'auto' }}
            >
              {sp.prompt}
            </div>
          )}

          <div className="flex items-center justify-between text-xs" style={{ color: 'var(--text-3)' }}>
            <span>آخرین ویرایش: {new Date(sp.lastModified).toLocaleDateString('fa-IR')}</span>
            {!sp.isDefault && (
              <button onClick={handleReset} className="flex items-center gap-1 hover:text-amber-400 transition-colors">
                <RotateCcw className="w-3 h-3" />
                بازگشت به پیش‌فرض
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function PromptManager() {
  const { systemPrompts, resetAllSystemPrompts } = useAppStore();
  const [search, setSearch] = useState('');
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const filtered = systemPrompts.filter(
    (sp) => sp.moduleName.includes(search) || sp.description.includes(search) || sp.prompt.includes(search)
  );

  const customCount = systemPrompts.filter((sp) => !sp.isDefault).length;

  return (
    <div className="p-6 space-y-6 animate-fade-in max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(61,82,255,0.15)', border: '1px solid rgba(61,82,255,0.25)' }}>
              <Settings2 className="w-5 h-5 text-brand-400" />
            </div>
            <h2 className="section-title">مدیریت پرامپت‌های سیستم</h2>
          </div>
          <p className="section-subtitle">
            ویرایش، سفارشی‌سازی و مدیریت تخصصی دستورالعمل‌های هوش مصنوعی برای هر ماژول
          </p>
        </div>
        <div className="flex items-center gap-3">
          {customCount > 0 && (
            <div className="badge badge-amber">
              <Zap className="w-3 h-3" />
              {customCount} سفارشی
            </div>
          )}
          {customCount > 0 && (
            showResetConfirm ? (
              <div className="flex items-center gap-2 p-2 rounded-xl" style={{ background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)' }}>
                <span className="text-xs" style={{ color: 'var(--text-2)' }}>بازگردانی همه پرامپت‌ها؟</span>
                <button onClick={() => { resetAllSystemPrompts(); setShowResetConfirm(false); }} className="btn btn-danger btn-sm">بله</button>
                <button onClick={() => setShowResetConfirm(false)} className="btn btn-secondary btn-sm">خیر</button>
              </div>
            ) : (
              <button onClick={() => setShowResetConfirm(true)} className="btn btn-ghost btn-sm">
                <RotateCcw className="w-3.5 h-3.5" />
                بازگردانی همه
              </button>
            )
          )}
        </div>
      </div>

      {/* Info banner */}
      <div className="p-4 rounded-xl flex items-start gap-3"
        style={{ background: 'rgba(61,82,255,0.06)', border: '1px solid rgba(61,82,255,0.15)' }}>
        <Info className="w-4 h-4 text-brand-400 mt-0.5 flex-shrink-0" />
        <div className="text-sm" style={{ color: 'var(--text-2)' }}>
          <strong style={{ color: 'var(--text-1)' }}>راهنما:</strong> هر ماژول دارای یک پرامپت سیستمی اختصاصی است که رفتار دستیار هوشمند را در آن بخش تعریف می‌کند. تغییرات بلافاصله اعمال می‌شوند.
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-3)' }} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="جستجو در پرامپت‌ها..."
          className="inp pr-10"
          dir="rtl"
        />
      </div>

      {/* Prompt cards */}
      <div className="space-y-3">
        {filtered.map((sp) => <PromptCard key={sp.id} sp={sp} />)}
        {filtered.length === 0 && (
          <div className="text-center py-12" style={{ color: 'var(--text-3)' }}>
            <Settings2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">نتیجه‌ای یافت نشد</p>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'کل پرامپت‌ها', value: systemPrompts.length, color: '#3d52ff' },
          { label: 'پیش‌فرض', value: systemPrompts.filter((s) => s.isDefault).length, color: '#00c48c' },
          { label: 'سفارشی‌شده', value: customCount, color: '#f59e0b' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card p-4 text-center">
            <div className="text-2xl font-bold mb-1" style={{ color }}>{value}</div>
            <div className="text-xs" style={{ color: 'var(--text-3)' }}>{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
