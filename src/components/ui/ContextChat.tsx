'use client';
import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader, Copy, Check, Trash2, ChevronDown, Sparkles, Bot } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { cn } from '@/utils';

interface Props {
  moduleId: string;
  contextData?: string;
  quickPrompts?: string[];
  title?: string;
}

function MessageContent({ content }: { content: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatted = content
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code style="background:rgba(61,82,255,0.1);padding:1px 5px;border-radius:4px;font-size:0.85em">$1</code>')
    .replace(/\n/g, '<br/>');

  return (
    <div className="relative group">
      <div className="text-sm leading-7" style={{ color: 'var(--text-1)' }} dangerouslySetInnerHTML={{ __html: formatted }} />
      <button
        onClick={handleCopy}
        className="absolute top-1 left-1 p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
      >
        {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" style={{ color: 'var(--text-3)' }} />}
      </button>
    </div>
  );
}

export default function ContextChat({ moduleId, contextData, quickPrompts, title }: Props) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { apiKey, aiProvider, holdingData, settings, moduleChatSessions, addModuleChatMessage, updateModuleLastMessage, clearModuleChat, getSystemPrompt } = useAppStore();

  const session = moduleChatSessions.find((s) => s.moduleId === moduleId);
  const messages = session?.messages ?? [];

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  const sendMessage = async (text: string) => {
    const userMsg = {
      id: Date.now().toString(),
      role: 'user' as const,
      content: text,
      timestamp: new Date().toISOString(),
      moduleContext: moduleId,
    };
    addModuleChatMessage(moduleId, userMsg);
    setInput('');
    setIsSending(true);

    const systemPrompt = getSystemPrompt(moduleId);
    const contextStr = contextData
      ? `\n\n--- داده‌های زمینه ---\n${contextData}`
      : holdingData
      ? `\n\n--- داده‌های پرتفولیو ---\nگروه: ${holdingData.name}\nتعداد شرکت‌های تابعه: ${holdingData.subsidiaries.length}\nپروفایل ریسک: ${settings.riskPersona}`
      : '';

    const fullSystemPrompt = systemPrompt + contextStr;

    const streamingMsg = {
      id: (Date.now() + 1).toString(),
      role: 'assistant' as const,
      content: '',
      timestamp: new Date().toISOString(),
      isStreaming: true,
      moduleContext: moduleId,
    };
    addModuleChatMessage(moduleId, streamingMsg);

    if (!apiKey) {
      const demo = await generateDemoResponse(text, moduleId);
      let buf = '';
      for (const char of demo) {
        buf += char;
        updateModuleLastMessage(moduleId, buf, false);
        await new Promise((r) => setTimeout(r, 18));
      }
      updateModuleLastMessage(moduleId, demo, true);
      setIsSending(false);
      return;
    }

    try {
      const historyMsgs = messages.slice(-8).map((m) => ({ role: m.role, content: m.content }));

      if (aiProvider === 'openai') {
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
          body: JSON.stringify({
            model: settings.aiModel || 'gpt-4o',
            stream: true,
            messages: [
              { role: 'system', content: fullSystemPrompt },
              ...historyMsgs,
              { role: 'user', content: text },
            ],
          }),
        });
        const reader = res.body?.getReader();
        const decoder = new TextDecoder();
        let buf = '';
        while (reader) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          for (const line of chunk.split('\n')) {
            const data = line.replace(/^data: /, '').trim();
            if (data === '[DONE]') break;
            if (!data) continue;
            try {
              const delta = JSON.parse(data)?.choices?.[0]?.delta?.content;
              if (delta) { buf += delta; updateModuleLastMessage(moduleId, buf, false); }
            } catch {}
          }
        }
        updateModuleLastMessage(moduleId, buf, true);
      } else if (aiProvider === 'anthropic') {
        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-direct-browser-access': 'true',
          },
          body: JSON.stringify({
            model: settings.aiModel || 'claude-opus-4-8',
            max_tokens: 2048,
            stream: true,
            system: fullSystemPrompt,
            messages: [...historyMsgs, { role: 'user', content: text }],
          }),
        });
        const reader = res.body?.getReader();
        const decoder = new TextDecoder();
        let buf = '';
        while (reader) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          for (const line of chunk.split('\n')) {
            const data = line.replace(/^data: /, '').trim();
            if (!data) continue;
            try {
              const parsed = JSON.parse(data);
              const delta = parsed?.delta?.text;
              if (delta) { buf += delta; updateModuleLastMessage(moduleId, buf, false); }
            } catch {}
          }
        }
        updateModuleLastMessage(moduleId, buf, true);
      } else {
        // Gemini
        const model = settings.aiModel || 'gemini-2.0-flash';
        const geminiMessages = [
          ...historyMsgs.map((m) => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }],
          })),
          { role: 'user', parts: [{ text: text }] },
        ];
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              system_instruction: { parts: [{ text: fullSystemPrompt }] },
              contents: geminiMessages,
              generationConfig: { maxOutputTokens: 2048 },
            }),
          }
        );
        const reader = res.body?.getReader();
        const decoder = new TextDecoder();
        let buf = '';
        while (reader) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          for (const line of chunk.split('\n')) {
            const data = line.replace(/^data: /, '').trim();
            if (!data) continue;
            try {
              const parsed = JSON.parse(data);
              const delta = parsed?.candidates?.[0]?.content?.parts?.[0]?.text;
              if (delta) { buf += delta; updateModuleLastMessage(moduleId, buf, false); }
            } catch {}
          }
        }
        updateModuleLastMessage(moduleId, buf, true);
      }
    } catch {
      updateModuleLastMessage(moduleId, 'خطا در ارتباط با سرویس هوش مصنوعی. لطفاً دوباره تلاش کنید.', true);
    }
    setIsSending(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isSending) return;
    await sendMessage(input.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(e as unknown as React.FormEvent); }
  };

  const moduleColors: Record<string, string> = {
    dashboard: '#3d52ff', analysis: '#00c48c', governance: '#8b5cf6',
    esg: '#10b981', risk: '#f43f5e', capital: '#f59e0b',
    subsidiaries: '#06b6d4', 'ai-assistant': '#3d52ff', data: '#64748b',
  };
  const accent = moduleColors[moduleId] ?? '#3d52ff';

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 left-6 z-40 w-13 h-13 rounded-2xl shadow-xl flex items-center justify-center transition-all duration-300 hover:scale-110 no-print"
        style={{
          background: `linear-gradient(135deg, ${accent}, ${accent}cc)`,
          boxShadow: `0 8px 24px ${accent}55`,
          width: 52, height: 52,
        }}
        title={`دستیار هوشمند — ${title ?? moduleId}`}
      >
        <MessageCircle className="w-5 h-5 text-white" />
        {messages.length > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-white text-xs font-bold flex items-center justify-center"
            style={{ background: '#f43f5e', fontSize: 9 }}>
            {messages.filter((m) => m.role === 'assistant').length}
          </span>
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div
          className="fixed bottom-6 left-6 z-50 w-96 rounded-2xl shadow-2xl flex flex-col no-print animate-slide-up"
          style={{
            background: 'var(--modal-bg)',
            border: `1px solid ${accent}33`,
            boxShadow: `0 24px 80px rgba(0,0,0,0.5), 0 0 0 1px ${accent}22`,
            maxHeight: '70vh',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--border)' }}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: `${accent}22`, border: `1px solid ${accent}33` }}>
                <Sparkles className="w-4 h-4" style={{ color: accent }} />
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>{title ?? 'دستیار هوشمند'}</p>
                <p className="text-xs" style={{ color: 'var(--text-3)' }}>مبتنی بر AI</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <button onClick={() => clearModuleChat(moduleId)} className="btn btn-ghost btn-icon-sm" title="پاک کردن مکالمه">
                  <Trash2 className="w-3.5 h-3.5" style={{ color: 'var(--text-3)' }} />
                </button>
              )}
              <button onClick={() => setOpen(false)} className="btn btn-ghost btn-icon-sm">
                <X className="w-4 h-4" style={{ color: 'var(--text-2)' }} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0" style={{ maxHeight: '45vh' }}>
            {messages.length === 0 ? (
              <div className="text-center py-6">
                <div className="w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center"
                  style={{ background: `${accent}15`, border: `1px solid ${accent}25` }}>
                  <Bot className="w-6 h-6" style={{ color: accent }} />
                </div>
                <p className="text-sm font-medium" style={{ color: 'var(--text-1)' }}>دستیار هوشمند آماده است</p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>از دکمه‌های پیشنهادی یا سوال مستقیم استفاده کنید</p>
                {quickPrompts && quickPrompts.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4 justify-center">
                    {quickPrompts.map((qp) => (
                      <button key={qp} onClick={() => sendMessage(qp)}
                        className="text-xs px-3 py-1.5 rounded-full transition-all"
                        style={{ background: `${accent}10`, color: accent, border: `1px solid ${accent}25` }}>
                        {qp}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className={cn('flex', msg.role === 'user' ? 'justify-start' : 'justify-end')}>
                  <div className={cn('max-w-[88%] p-3', msg.role === 'user' ? 'chat-user' : 'chat-ai')}
                    style={{ direction: 'rtl' }}>
                    {msg.isStreaming ? (
                      <div className="flex gap-1 py-1">
                        <div className="typing-dot" /><div className="typing-dot" /><div className="typing-dot" />
                      </div>
                    ) : (
                      <MessageContent content={msg.content} />
                    )}
                  </div>
                </div>
              ))
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick prompts (when chat has messages) */}
          {messages.length > 0 && quickPrompts && quickPrompts.length > 0 && (
            <div className="px-4 pb-2 flex gap-2 overflow-x-auto">
              {quickPrompts.slice(0, 3).map((qp) => (
                <button key={qp} onClick={() => sendMessage(qp)} disabled={isSending}
                  className="text-xs px-3 py-1.5 rounded-full flex-shrink-0 transition-all"
                  style={{ background: `${accent}10`, color: accent, border: `1px solid ${accent}25` }}>
                  {qp}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="p-3 border-t" style={{ borderColor: 'var(--border)' }}>
            <form onSubmit={handleSubmit} className="flex gap-2 items-end">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="سوال خود را بنویسید..."
                rows={1}
                disabled={isSending}
                className="inp flex-1 resize-none text-sm py-2.5"
                style={{ minHeight: 40, maxHeight: 120, direction: 'rtl', borderRadius: 10 }}
              />
              <button type="submit" disabled={isSending || !input.trim()}
                className="btn btn-primary btn-icon flex-shrink-0"
                style={{ background: `linear-gradient(135deg, ${accent}, ${accent}cc)`, boxShadow: 'none', borderRadius: 10 }}>
                {isSending ? <Loader className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

async function generateDemoResponse(query: string, moduleId: string): Promise<string> {
  const responses: Record<string, string> = {
    dashboard: `**تحلیل وضعیت پرتفولیو گروه**\n\nبر اساس بررسی داده‌های موجود، گروه سرمایه‌گذاری بانک سپه در وضعیت کلی **مطلوب** قرار دارد.\n\n**نکات کلیدی:**\n- میانگین امتیاز مالی پرتفولیو در محدوده قابل قبول است\n- سه شرکت تابعه نیازمند توجه فوری هستند\n- فرصت‌های بهینه‌سازی سرمایه در بخش انرژی پاک شناسایی شده\n\nبرای تحلیل دقیق‌تر، لطفاً سوال مشخص‌تری مطرح فرمایید.`,
    analysis: `**تحلیل مالی گروه**\n\nشاخص‌های کلیدی عملکرد مالی:\n\n- **ROE میانگین:** ۱۸.۳٪ (بالاتر از میانگین صنعت)\n- **نسبت بدهی:** ۵۲٪ (در محدوده قابل قبول)\n- **حاشیه سود:** ۱۲.۱٪ (رو به بهبود)\n\nتوصیه: تمرکز بر بهینه‌سازی ساختار سرمایه شرکت‌های تابعه با نسبت بدهی بالاتر از ۶۵٪.`,
    risk: `**ارزیابی ریسک پرتفولیو**\n\nوضعیت ریسک فعلی:\n\n- **ریسک بالا:** ۱ شرکت در منطقه بحرانی (Z-Score < ۱.۸)\n- **ریسک متوسط:** ۳ شرکت نیازمند پایش\n- **وضعیت ایمن:** ۴ شرکت\n\n**توصیه فوری:** بررسی برنامه بازسازی مالی سپه پردازش تا پایان فصل جاری.`,
    governance: `**ارزیابی حاکمیت شرکتی**\n\nشاخص‌های حاکمیتی گروه:\n\n- **استقلال هیئت مدیره:** ۶۸٪ (پیشنهاد: ارتقا به ۷۵٪)\n- **شفافیت گزارشگری:** رتبه خوب\n- **نقاط بهبود:** سیاست‌های افشاء و حقوق سهامداران\n\nتوصیه می‌شود کارگروه تخصصی حاکمیت در قالب کمیته حسابرسی تشکیل شود.`,
    esg: `**گزارش ESG گروه**\n\nعملکرد پایداری:\n\n- **امتیاز محیط‌زیست:** ۷۲/۱۰۰\n- **امتیاز اجتماعی:** ۷۸/۱۰۰\n- **امتیاز حاکمیتی:** ۷۴/۱۰۰\n\n**اولویت‌های بهبود:**\n۱. کاهش ردپای کربنی تا ۱۵٪ در سه سال آینده\n۲. افزایش تنوع جنسیتی در سطح مدیریت\n۳. انتشار گزارش پایداری سالانه`,
  };

  await new Promise((r) => setTimeout(r, 800));
  return responses[moduleId] ?? `**پاسخ به سوال شما:**\n\nبر اساس اطلاعات موجود در سیستم، برای تحلیل دقیق‌تر لطفاً کلید API را وارد کنید تا دستیار هوشمند بتواند پاسخ‌های کاملاً سفارشی و مبتنی بر داده‌های واقعی ارائه دهد.\n\nدر حالت دمو، پاسخ‌های کلی ارائه می‌شوند.`;
}
