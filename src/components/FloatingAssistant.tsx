import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Subsidiary, RiskPersona, RiskThresholds } from '../types';
import { askGeminiAssistant } from '../lib/geminiClient';
import MarkdownRenderer from './MarkdownRenderer';
import { MessageSquare, X, Send, Bot, RefreshCw, Sliders, Settings, Check, HelpCircle, Maximize2, Minimize2 } from 'lucide-react';

interface FloatingAssistantProps {
  subsidiaries: Subsidiary[];
  persona: RiskPersona;
  thresholds: RiskThresholds;
  apiKey: string | null;
}

export default function FloatingAssistant({
  subsidiaries,
  persona,
  thresholds,
  apiKey
}: FloatingAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [input, setInput] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  
  // Custom Response Configurations
  const [assistantTone, setAssistantTone] = useState<'analytical' | 'conservative' | 'creative'>('analytical');
  const [responseDepth, setResponseDepth] = useState<'summary' | 'comprehensive'>('comprehensive');
  const [creativityLevel, setCreativityLevel] = useState<'precise' | 'balanced' | 'innovative'>('balanced');

  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'assistant'; text: string; date: string }>>([
    {
      sender: 'assistant',
      text: 'سلام جناب مدیر ارشد هلدینگ سپه. من دستیار هوشمند و تحلیلگر مالی شما هستم. آماده‌ام تا در هر لحظه اطلاعات، ترازنامه‌ها و نسبت‌های ریسک شرکت‌های تابعه را تحلیل کنم و گزارش مکتوب مجمع را آماده سازم. چه کمکی از دست من ساخته است؟',
      date: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userText = input;
    setInput('');
    const timeString = new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });

    setMessages(prev => [...prev, { sender: 'user', text: userText, date: timeString }]);
    setIsLoading(true);

    try {
      // Find context if user refers to a company in the holding
      let matchedCompany = null;
      for (const sub of subsidiaries) {
        if (userText.includes(sub.name) || userText.includes(sub.ticker) || userText.toLowerCase().includes(sub.englishName.toLowerCase())) {
          matchedCompany = sub;
          break;
        }
      }

      const response = await askGeminiAssistant(
        userText,
        apiKey,
        matchedCompany,
        persona,
        thresholds,
        assistantTone,
        responseDepth,
        creativityLevel
      );

      setMessages(prev => [...prev, { sender: 'assistant', text: response, date: timeString }]);
    } catch (err: any) {
      setMessages(prev => [...prev, {
        sender: 'assistant',
        text: `متأسفانه خطایی رخ داد: ${err.message || 'خطای شبکه'}`,
        date: timeString
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickPrompt = (text: string) => {
    setInput(text);
  };

  const clearChat = () => {
    setMessages([
      {
        sender: 'assistant',
        text: 'گفتگو بازنشانی شد. آماده ارزیابی و تحلیل صورت‌های مالی شرکت‌های فرعی هستم.',
        date: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  const quickPrompts = [
    'شرکت‌های با ریسک بالا بر اساس شاخص آلتمن کدامند؟',
    'وضعیت حاکمیت شرکتی و مدیران مستقل سیمان سپهر',
    'گزارش تحلیل نسبت بدهی و نقدینگی پتروشیمی سپاهان',
    'چگونه می‌توان امتیاز ESG هلدینگ را ارتقا داد؟',
    'پیشنهاد بازتخصیص نقدی برای کاهش بدهی‌های جاری تابعه‌ها',
    'سناریوی افزایش ۲۵ درصدی تورم بر سودآوری پتروشیمی سپاهان'
  ];

  const containerWidthClass = isMaximized && isOpen
    ? "sm:w-[500px] md:w-[750px] lg:w-[950px]"
    : "sm:w-96";

  const panelHeightClass = isMaximized
    ? "h-[550px] sm:h-[650px] md:h-[750px]"
    : "h-[460px] sm:h-[540px]";

  return (
    <div id="floating-assistant-container" className={`fixed bottom-4 left-4 z-50 font-sans w-[calc(100vw-32px)] sm:left-6 ${containerWidthClass} transition-all duration-300`}>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className={`w-full ${panelHeightClass} bg-[#16161a] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden mb-4 transition-all duration-300`}
          >
            {/* Header */}
            <div className="bg-[#0f0f12] border-b border-white/10 px-4 py-3 flex items-center justify-between" dir="rtl">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <Bot size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">دستیار صوتی و متنی هوشمند</h4>
                  <span className="text-[9px] text-neutral-500 block font-mono">Sepah AI Co-Pilot</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  title="تنظیمات لحن و پاسخ"
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${showSettings ? 'bg-blue-500/20 text-blue-400' : 'text-neutral-400 hover:bg-white/5 hover:text-white'}`}
                >
                  <Sliders size={14} />
                </button>
                <button
                  onClick={clearChat}
                  title="پاک کردن تاریخچه گفتگو"
                  className="p-1.5 hover:bg-white/5 rounded-lg text-neutral-400 hover:text-white transition-colors cursor-pointer"
                >
                  <RefreshCw size={13} />
                </button>
                <button
                  onClick={() => setIsMaximized(!isMaximized)}
                  title={isMaximized ? "کوچک‌نمایی" : "بزرگ‌نمایی"}
                  className="p-1.5 hover:bg-white/5 rounded-lg text-neutral-400 hover:text-white transition-colors cursor-pointer"
                >
                  {isMaximized ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 hover:bg-white/5 rounded-lg text-neutral-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            {/* Dynamic Settings panel */}
            <AnimatePresence>
              {showSettings && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="bg-[#0f0f12] border-b border-white/10 px-4 py-3.5 space-y-3 overflow-hidden text-xs text-neutral-300"
                  dir="rtl"
                >
                  <div className="flex justify-between items-center border-b border-white/5 pb-1.5 mb-1">
                    <span className="font-bold text-blue-400 flex items-center gap-1">
                      <Settings size={12} />
                      تنظیمات پاسخ هوشمند
                    </span>
                    <button onClick={() => setShowSettings(false)} className="text-[10px] text-neutral-500 hover:text-white">بستن</button>
                  </div>

                  {/* Tone Config */}
                  <div className="space-y-1">
                    <span className="text-[10px] text-neutral-400 block">لحن و عینک تحلیلی:</span>
                    <div className="grid grid-cols-3 gap-1">
                      {[
                        { key: 'analytical', label: 'علمی/سرد' },
                        { key: 'conservative', label: 'محافظه‌کار' },
                        { key: 'creative', label: 'استراتژیک' }
                      ].map(t => (
                        <button
                          key={t.key}
                          onClick={() => setAssistantTone(t.key as any)}
                          className={`py-1 px-1 rounded text-[10px] font-semibold border transition-all cursor-pointer flex items-center justify-center gap-0.5 ${assistantTone === t.key ? 'bg-blue-500/10 border-blue-500/40 text-blue-400' : 'bg-transparent border-white/5 text-neutral-400'}`}
                        >
                          {assistantTone === t.key && <Check size={10} />}
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Detail level Config */}
                  <div className="space-y-1">
                    <span className="text-[10px] text-neutral-400 block">عمق تحلیل و حجم خروجی:</span>
                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        { key: 'summary', label: 'خلاصه مدیریتی' },
                        { key: 'comprehensive', label: 'تحلیل جامع بندبند' }
                      ].map(d => (
                        <button
                          key={d.key}
                          onClick={() => setResponseDepth(d.key as any)}
                          className={`py-1 px-1.5 rounded text-[10px] font-semibold border transition-all cursor-pointer flex items-center justify-center gap-1 ${responseDepth === d.key ? 'bg-blue-500/10 border-blue-500/40 text-blue-400' : 'bg-transparent border-white/5 text-neutral-400'}`}
                        >
                          {responseDepth === d.key && <Check size={10} />}
                          {d.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Creativity Config */}
                  <div className="space-y-1">
                    <span className="text-[10px] text-neutral-400 block">سطح اطمینان محاسباتی:</span>
                    <div className="grid grid-cols-3 gap-1">
                      {[
                        { key: 'precise', label: 'دقت بالا' },
                        { key: 'balanced', label: 'متعادل' },
                        { key: 'innovative', label: 'اکتشافی' }
                      ].map(c => (
                        <button
                          key={c.key}
                          onClick={() => setCreativityLevel(c.key as any)}
                          className={`py-1 px-1 rounded text-[10px] font-semibold border transition-all cursor-pointer flex items-center justify-center gap-0.5 ${creativityLevel === c.key ? 'bg-blue-500/10 border-blue-500/40 text-blue-400' : 'bg-transparent border-white/5 text-neutral-400'}`}
                        >
                          {creativityLevel === c.key && <Check size={10} />}
                          {c.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Message Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-[#0a0a0b]/40 flex flex-col">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex flex-col max-w-[85%] ${
                    msg.sender === 'user' ? 'self-end items-end' : 'self-start items-start'
                  }`}
                  dir="rtl"
                >
                  <div
                    className={`rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-blue-600 text-white rounded-br-none'
                        : 'bg-[#16161a] border border-white/10 text-neutral-200 rounded-bl-none'
                    }`}
                  >
                    {msg.sender === 'assistant' ? (
                      <MarkdownRenderer content={msg.text} />
                    ) : (
                      <p className="whitespace-pre-line">{msg.text}</p>
                    )}
                  </div>
                  <span className="text-[8px] text-neutral-500 mt-1 px-1 font-mono">{msg.date}</span>
                </div>
              ))}

              {isLoading && (
                <div className="flex items-center gap-2 text-xs text-neutral-400 p-2" dir="rtl">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  <span className="mr-1 text-[10px]">در حال تحلیل ترازنامه و تولید پاسخ...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Prompts */}
            <div className="px-3 py-2 bg-[#0a0a0b]/80 border-t border-white/5 overflow-x-auto whitespace-nowrap no-scrollbar flex gap-2">
              {quickPrompts.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => handleQuickPrompt(p)}
                  className="text-[9px] bg-[#16161a] border border-white/5 hover:border-blue-500/30 text-neutral-400 hover:text-blue-400 px-2.5 py-1.5 rounded-md transition-all cursor-pointer flex-shrink-0"
                  dir="rtl"
                >
                  {p}
                </button>
              ))}
            </div>

            {/* Form Input */}
            <form onSubmit={handleSubmit} className="p-3 bg-[#0f0f12] border-t border-white/10 flex gap-2" dir="rtl">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="پرسش خود را بنویسید (مثلاً تحلیل وامیددارو)..."
                className="flex-1 bg-[#0a0a0b] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 placeholder-neutral-600"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-white/5 disabled:text-neutral-600 text-white rounded-lg transition-colors cursor-pointer flex items-center justify-center"
              >
                <Send size={14} className="rotate-180" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Button */}
      <div className="flex justify-start" dir="ltr">
        <motion.button
          id="toggle-floating-chat"
          onClick={() => setIsOpen(!isOpen)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="h-12 px-4.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-full shadow-lg flex items-center gap-2 border border-blue-400/20 cursor-pointer hover:shadow-blue-500/10"
          dir="rtl"
        >
          <div className="relative">
            <MessageSquare size={18} />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          </div>
          <span className="text-xs font-bold text-white font-sans leading-none">دستیار هوشمند مالی</span>
        </motion.button>
      </div>
    </div>
  );
}
