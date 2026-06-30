'use client';
import { useState, useRef, useEffect } from 'react';
import { Send, Brain, Sparkles, RotateCcw, Copy, ThumbsUp, Zap, AlertCircle } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { buildSystemPrompt } from '@/utils';
import type { ChatMessage } from '@/types';

const QUICK_PROMPTS = [
  'وضعیت کلی پرتفولیو را تحلیل کن',
  'ریسک‌های بحرانی چیست؟',
  'بهترین فرصت‌های سرمایه‌گذاری کدام‌اند؟',
  'توصیه استراتژیک برای سال آینده',
  'مقایسه عملکرد شرکت‌های بورسی',
  'وضعیت ESG گروه را ارزیابی کن',
];

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 px-4 py-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className={`typing-dot w-2 h-2 rounded-full bg-brand-400`} style={{ animationDelay: `${i * 0.2}s` }} />
      ))}
    </div>
  );
}

function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === 'user';
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(msg.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'} group`}>
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
        isUser ? 'bg-gradient-to-br from-brand-600 to-cyan-500' : 'bg-gradient-to-br from-violet-700 to-brand-700'
      }`}>
        {isUser ? <span className="text-white text-sm font-bold">م</span> : <Brain className="w-4 h-4 text-white" />}
      </div>
      <div className={`max-w-[80%] ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
          isUser
            ? 'bg-brand-600/30 border border-brand-500/30 text-white rounded-tl-none'
            : 'bg-white/5 border border-white/10 text-slate-200 rounded-tr-none'
        }`}>
          {msg.isStreaming ? (
            <span className="whitespace-pre-wrap">{msg.content}<span className="inline-block w-0.5 h-4 bg-brand-400 animate-pulse ml-0.5" /></span>
          ) : (
            <span className="whitespace-pre-wrap">{msg.content}</span>
          )}
        </div>
        <div className={`flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity ${isUser ? 'flex-row-reverse' : ''}`}>
          <span className="text-xs text-slate-600">
            {new Date(msg.timestamp).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}
          </span>
          {!isUser && (
            <button onClick={handleCopy} className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
              {copied ? '✓' : <Copy className="w-3 h-3" />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AIAssistant() {
  const { chatMessages, addChatMessage, updateLastMessage, apiKey, aiProvider, holdingData, settings, apiKeyConfigured } = useAppStore();
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isGenerating) return;
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text.trim(),
      timestamp: new Date().toISOString(),
    };
    addChatMessage(userMsg);
    setInput('');
    setIsGenerating(true);

    const assistantMsg: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
      isStreaming: true,
    };
    addChatMessage(assistantMsg);

    if (!apiKeyConfigured || apiKey === 'demo-mode') {
      await generateDemoResponse(text);
      setIsGenerating(false);
      return;
    }

    try {
      const systemPrompt = buildSystemPrompt(holdingData?.name ?? 'گروه سرمایه‌گذاری', settings);
      const messages = [
        ...chatMessages.filter((m) => m.role !== 'assistant' || m.content).slice(-10).map((m) => ({
          role: m.role,
          content: m.content,
        })),
        { role: 'user', content: text.trim() },
      ];

      if (aiProvider === 'openai') {
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
          body: JSON.stringify({
            model: settings.aiModel,
            messages: [{ role: 'system', content: systemPrompt }, ...messages],
            stream: true,
            max_tokens: 1500,
          }),
        });
        const reader = res.body?.getReader();
        const decoder = new TextDecoder();
        let full = '';
        while (reader) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n').filter((l) => l.startsWith('data: ') && l !== 'data: [DONE]');
          for (const line of lines) {
            try {
              const data = JSON.parse(line.slice(6));
              const delta = data.choices?.[0]?.delta?.content ?? '';
              full += delta;
              updateLastMessage(full, false);
            } catch {}
          }
        }
        updateLastMessage(full, true);
      } else {
        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-direct-browser-access': 'true',
          },
          body: JSON.stringify({
            model: 'claude-opus-4-8',
            max_tokens: 1500,
            system: systemPrompt,
            messages,
            stream: true,
          }),
        });
        const reader = res.body?.getReader();
        const decoder = new TextDecoder();
        let full = '';
        while (reader) {
          const { done, value } = await reader.read();
          if (done) break;
          const lines = decoder.decode(value).split('\n');
          for (const line of lines) {
            if (line.startsWith('data:')) {
              try {
                const data = JSON.parse(line.slice(5));
                if (data.type === 'content_block_delta') {
                  full += data.delta?.text ?? '';
                  updateLastMessage(full, false);
                }
              } catch {}
            }
          }
        }
        updateLastMessage(full, true);
      }
    } catch (err: any) {
      updateLastMessage(`خطا در اتصال به API: ${err.message}`, true);
    }
    setIsGenerating(false);
  };

  const generateDemoResponse = async (query: string) => {
    const responses: Record<string, string> = {
      'وضعیت کلی': `📊 **تحلیل جامع پرتفولیو گروه سرمایه‌گذاری بانک سپه**

**خلاصه اجرایی:**
پرتفولیوی گروه شامل ۸ شرکت تابعه در ۸ بخش صنعتی است. میانگین امتیاز کلی ۷۵.۴ از ۱۰۰ نشان‌دهنده وضعیت **خوب** اما با پتانسیل بهبود است.

**نقاط قوت کلیدی:**
• سپه پردازش با امتیاز ۸۳ — عملکرد درخشان در فناوری
• انرژی پاک سپه با رشد ۳۵٪ سالانه — آینده‌نگرانه‌ترین سرمایه‌گذاری
• بیمه سپه با بهترین امتیاز حاکمیتی (۸۲) — مدیریت نمونه

**نگرانی‌های فوری:**
⚠️ لیزینگ سپه: نسبت بدهی ۷۲٪ — نیاز به اقدام فوری
⚠️ ساختمانی سپه: مدت تصدی مدیرعامل ۸ سال — ریسک حاکمیتی

**توصیه کلان:** تخصیص مجدد ۲۰-۳۰٪ دارایی از بخش‌های سنتی به فناوری و انرژی پاک.`,
    };

    const q = query.slice(0, 10);
    let response = responses[q] ?? '';
    if (!response) {
      response = `🤖 **پاسخ دستیار هوشمند** (حالت نمایشی)

بر اساس داده‌های گروه سرمایه‌گذاری بانک سپه، تحلیل زیر ارائه می‌شود:

در خصوص سؤال شما درباره "${query}"، توجه داشته باشید که:

۱. **وضعیت جاری:** میانگین امتیاز پرتفولیو ۷۵.۴ است که نشان‌دهنده عملکرد مطلوب است
۲. **بخش‌های برتر:** سپه پردازش (فناوری) و بیمه سپه بالاترین امتیازها را دارند
۳. **نیاز به توجه:** لیزینگ سپه و ساختمانی سپه نیاز به بازنگری دارند

💡 **توصیه:** برای دریافت تحلیل هوشمند واقعی، کلید API را در تنظیمات وارد کنید.`;
    }

    let displayed = '';
    for (let i = 0; i < response.length; i++) {
      displayed += response[i];
      updateLastMessage(displayed, false);
      await new Promise((r) => setTimeout(r, 12));
    }
    updateLastMessage(response, true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const clearChat = () => {
    useAppStore.setState({ chatMessages: [] });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] p-6 gap-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-700 to-brand-700 flex items-center justify-center">
              <Brain className="w-4 h-4 text-white" />
            </div>
            دستیار هوشمند مالی
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 mr-10">
            {apiKey === 'demo-mode' ? 'حالت نمایشی — برای تحلیل کامل API وارد کنید' : `متصل به ${aiProvider === 'openai' ? 'OpenAI' : 'Anthropic'}`}
          </p>
        </div>
        {chatMessages.length > 0 && (
          <button onClick={clearChat} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 px-3 py-1.5 rounded-lg hover:bg-white/5 transition-all">
            <RotateCcw className="w-3.5 h-3.5" />
            پاک‌سازی
          </button>
        )}
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto glass rounded-2xl border border-white/10 p-4 space-y-4 min-h-0">
        {chatMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-700/30 to-brand-700/30 border border-violet-500/20 flex items-center justify-center mb-4">
              <Sparkles className="w-8 h-8 text-violet-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">دستیار هوشمند حاکمیت شرکتی</h3>
            <p className="text-sm text-slate-400 max-w-sm mb-6">
              از من درباره وضعیت مالی، ریسک‌ها، فرصت‌های سرمایه‌گذاری و توصیه‌های استراتژیک بپرسید
            </p>
            <div className="grid grid-cols-2 gap-2 w-full max-w-md">
              {QUICK_PROMPTS.map((p) => (
                <button
                  key={p}
                  onClick={() => sendMessage(p)}
                  className="text-right text-xs px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 hover:border-brand-500/30 transition-all"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {chatMessages.map((msg) => (
              msg.content || msg.isStreaming ? (
                msg.isStreaming && !msg.content ? (
                  <div key={msg.id} className="flex gap-3">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-700 to-brand-700 flex items-center justify-center flex-shrink-0">
                      <Brain className="w-4 h-4 text-white" />
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-2xl rounded-tr-none">
                      <TypingIndicator />
                    </div>
                  </div>
                ) : (
                  <MessageBubble key={msg.id} msg={msg} />
                )
              ) : null
            ))}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      {/* Quick prompts bar */}
      {chatMessages.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1 flex-shrink-0">
          {QUICK_PROMPTS.slice(0, 3).map((p) => (
            <button
              key={p}
              onClick={() => sendMessage(p)}
              disabled={isGenerating}
              className="flex-shrink-0 text-xs px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-slate-400 hover:text-slate-200 hover:bg-white/10 transition-all disabled:opacity-40"
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="flex-shrink-0 glass rounded-2xl border border-white/10 p-3">
        <div className="flex items-end gap-3">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="سؤال یا درخواست تحلیل خود را بنویسید... (Enter برای ارسال)"
            rows={2}
            className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none resize-none leading-relaxed"
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isGenerating}
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-600 to-brand-500 hover:from-brand-500 hover:to-cyan-500 flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-glow-brand flex-shrink-0"
          >
            {isGenerating ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Send className="w-4 h-4 text-white" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
