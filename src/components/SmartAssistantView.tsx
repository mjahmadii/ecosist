import React, { useState } from 'react';
import { Subsidiary, RiskPersona, RiskThresholds, BoardResolutionSimulation } from '../types';
import { askGeminiAssistant } from '../lib/geminiClient';
import MarkdownRenderer from './MarkdownRenderer';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, Send, BrainCircuit, Play, History, CheckCircle, 
  HelpCircle, MessageSquare, ShieldAlert, Cpu, Users, Layers, ShieldCheck
} from 'lucide-react';

interface SmartAssistantViewProps {
  subsidiaries: Subsidiary[];
  activeCompany: Subsidiary | null;
  persona: RiskPersona;
  thresholds: RiskThresholds;
  apiKey: string | null;
  meetings: BoardResolutionSimulation[];
  onAddMeeting: (meeting: BoardResolutionSimulation) => void;
}

export default function SmartAssistantView({
  subsidiaries,
  activeCompany,
  persona,
  thresholds,
  apiKey,
  meetings,
  onAddMeeting
}: SmartAssistantViewProps) {
  // Chat States
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'assistant'; text: string; date: string }>>([
    {
      sender: 'assistant',
      text: activeCompany 
        ? `سلام جناب دکتر احسان رضایی. من دستیار هوشمند تصمیم‌یار حاکمیتی بانک سپه هستم. آمادگی دارم تا زوایای مالی، چالش‌های ترازنامه‌ای و کیفیت حاکمیت شرکتی شرکت **${activeCompany.name}** (${activeCompany.ticker}) را با عینک استراتژیک **${persona === 'CONSERVATIVE' ? 'بسیار محافظه‌کارانه' : persona === 'BALANCED' ? 'متعادل و پویا' : 'تهاجمی'}** تحلیل و ارزیابی کنم. چطور می‌توانم یاری‌رسان باشم؟`
        : `سلام جناب دکتر احسان رضایی. من دستیار هوشمند تصمیم‌یار حاکمیتی بانک سپه هستم. تحلیل کلان پورتفوی هلدینگ، پیش‌بینی ورشکستگی آلتمن، آزمون استرس حاکمیتی و شبیه‌سازی مجامع هم‌اکنون در دسترس است. موضوع مد نظرتان را مطرح فرمایید.`,
      date: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Board Meeting Simulator States
  const [agendaInput, setAgendaInput] = useState('');
  const [selectedMeetingCompany, setSelectedMeetingCompany] = useState(subsidiaries[0]?.id || '');
  const [meetingCategory, setMeetingCategory] = useState<'INVESTMENT' | 'COMPLIANCE' | 'DIVESTMENT' | 'RESTRUCTURING'>('INVESTMENT');
  const [attendanceProfile, setAttendanceProfile] = useState<'FULL' | 'INDEPENDENT' | 'EXPERT'>('FULL');
  const [isSimulating, setIsSimulating] = useState(false);
  const [selectedHistoricalMeeting, setSelectedHistoricalMeeting] = useState<BoardResolutionSimulation | null>(meetings[0] || null);

  // Quick prompt handler
  const handleQuickPrompt = (promptText: string) => {
    setChatInput(promptText);
  };

  // Submit Chat
  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatLoading) return;

    const userMsg = chatInput;
    setChatInput('');
    const timeString = new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
    
    setChatMessages(prev => [...prev, { sender: 'user', text: userMsg, date: timeString }]);
    setIsChatLoading(true);

    try {
      const response = await askGeminiAssistant(
        userMsg,
        apiKey,
        activeCompany,
        persona,
        thresholds
      );
      setChatMessages(prev => [...prev, { sender: 'assistant', text: response, date: timeString }]);
    } catch (err: any) {
      setChatMessages(prev => [...prev, { 
        sender: 'assistant', 
        text: `متاسفانه مشکلی در ارتباط با پردازشگر هوشمند رخ داد: ${err.message}`, 
        date: timeString 
      }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Board Simulator Handler
  const handleSimulateBoard = async () => {
    if (!agendaInput.trim() || isSimulating) return;

    setIsSimulating(true);
    const targetComp = subsidiaries.find(s => s.id === selectedMeetingCompany) || subsidiaries[0];
    const categoryFa = 
      meetingCategory === 'INVESTMENT' ? 'طرح توسعه و سرمایه‌گذاری' :
      meetingCategory === 'COMPLIANCE' ? 'ممیزی حاکمیتی و انطباق قوانین' :
      meetingCategory === 'DIVESTMENT' ? 'واگذاری دارایی و املاک غیرمولد' :
      'اصلاح ساختار هیئت مدیره و توزیع سود/اندوخته';

    const attendanceFa = 
      attendanceProfile === 'FULL' ? 'حضور حداکثری اعضا به همراه نماینده ارشد هلدینگ (جناب دکتر احسان رضایی)' :
      attendanceProfile === 'INDEPENDENT' ? 'فقط اعضای مستقل هیئت مدیره و کمیته حسابرسی تابعه' :
      'اعضای هیئت مدیره به همراه مشاوران ارشد اقتصادی هلدینگ';

    const promptText = `شبیه‌سازی مجمع و جلسه تصمیم‌گیری هیئت مدیره برای شرکت‌های تابعه بانک سپه:
    - شرکت هدف: ${targetComp.name} (${targetComp.ticker})
    - صنعت: ${targetComp.sector}
    - موضوع دستور جلسه: ${agendaInput}
    - دسته‌بندی استراتژیک: ${categoryFa}
    - ترکیب اعضای حاضر: ${attendanceFa}
    - شاخص سلامت مالی فعلی: ${targetComp.healthScore}%
    - شاخص حاکمیت شرکتی فعلی: ${targetComp.governanceScore}%
    - ریسک ورشکستگی آلتمن: ${targetComp.riskMetrics.bankruptcyRisk}

    قوانین خروجی:
    ۱. حتماً در متن صورت‌جلسه ("transcript")، مداخلات، بیانات قاطع و شروط راهبردی مطرح‌شده توسط "جناب دکتر احسان رضایی" (به عنوان نماینده ارشد حاکمیتی هلدینگ بانک سپه) گنجانده شود.
    ۲. حتماً یک جدول شیک مارک‌داون شامل ستون‌های (نام نماینده، سمت، رأی، خلاصه موضع‌گیری) در انتهای "transcript" بسازید که نشان دهد آرا چگونه تقسیم شدند.
    ۳. خروجی را دقیقاً و صرفاً به صورت ساختار JSON معتبر بدون تگ‌های مارکداون اضافی در اطرافش برگردانید تا بتوان با JSON.parse خواند.
    
    مثال ساختار JSON:
    {
      "title": "عنوان رسمی مصوبه هیئت مدیره...",
      "agenda": "دستور رسمی مکتوب جلسه...",
      "transcript": "متن تفصیلی مذاکرات و صحبت‌های دکتر احسان رضایی و سایر اعضا همراه با جدول آرا مجمع...",
      "status": "Approved" یا "Rejected" یا "Deferred",
      "aiReview": "نقد ممیزی بسیار موشکافانه سیستم ممیزی هوشمند سپه و توصیه‌های نظارتی آینده..."
    }`;

    try {
      let simulatedResult: any;

      // Decide Voting Breakdown dynamically based on Company health & Governance
      let yesVotes = 4;
      let noVotes = 1;
      let abstainVotes = 0;

      if (targetComp.healthScore < 50) {
        yesVotes = 2;
        noVotes = 2;
        abstainVotes = 1;
      } else if (targetComp.healthScore < 75) {
        yesVotes = 3;
        noVotes = 1;
        abstainVotes = 1;
      }

      if (apiKey && apiKey !== 'mock-demo-key') {
        const responseText = await askGeminiAssistant(promptText, apiKey, targetComp, persona, thresholds);
        try {
          const cleanedText = responseText.replace(/```json/gi, '').replace(/```/gi, '').trim();
          simulatedResult = JSON.parse(cleanedText);
        } catch {
          simulatedResult = {
            title: `مصوبه هیئت مدیره: ${agendaInput}`,
            agenda: agendaInput,
            transcript: `جلسه هیئت مدیره شرکت **${targetComp.name}** به صورت رسمی پیرامون موضوع "${agendaInput}" تشکیل گردید. 
            جناب دکتر احسان رضایی به عنوان نماینده عالی هلدینگ بانک سپه هدایت نظارتی جلسه را بر عهده داشتند.ایشان تأکید نمودند که تامین مالی طرح فوق مشروط به اجرای برنامه انضباطی مالی و بازپرداخت فوری دیون کوتاه‌مدت بانکی است.
            
            ### 🗳️ جدول توزیع آرا مجمع
            | نماینده مجمع | سمت سازمانی | رأی | جزئیات موضع‌گیری |
            |---|---|---|---|
            | **جناب دکتر احسان رضایی** | نماینده عالی بانک سپه | **موافق مشروط** | اصرار بر کنترل شدید پیشرفت فیزیکی پروژه |
            | دکتر سلیمانی | مدیرعامل شرکت تابعه | **موافق** | تایید ضرورت استراتژیک برای رقابت در بازار |
            | مهندس تقوی | عضو مستقل هیئت مدیره | **موافق** | موافقت با توجه به چشم‌انداز بازگشت سرمایه |
            | دکتر شیرازی | رئیس کمیته حسابرسی | **ممتنع** | درخواست ارائه گزارش جریانات نقدی متمم |
            | نماینده سهامداران جزء | عضو حقیقی | **مخالف** | ابراز نگرانی از انباشت بدهی بانکی |`,
            status: targetComp.healthScore > 50 ? 'Approved' : 'Deferred',
            aiReview: `ارزیابی نظارتی: با توجه به نسبت بدهی ${targetComp.riskMetrics.debtToEquity.toFixed(2)} شرکت، تصمیم اتخاذ شده با مدیریت عالی دکتر احسان رضایی کاملاً با استراتژی ${persona === 'CONSERVATIVE' ? 'حفاظتی محافظه‌کارانه' : 'متعادل'} هماهنگ است.`
          };
        }
      } else {
        // High fidelity mock simulation
        const status: 'Approved' | 'Rejected' | 'Deferred' = 
          targetComp.healthScore < 50 ? 'Deferred' : Math.random() > 0.25 ? 'Approved' : 'Rejected';
        
        simulatedResult = {
          title: `شبیه‌سازی مصوبه ${categoryFa}: ${agendaInput}`,
          agenda: agendaInput,
          transcript: `در تاریخ ${new Date().toLocaleDateString('fa-IR')}، جلسه اضطراری هیئت مدیره شرکت **${targetComp.name}** با حضور کلیه اعضا تشکیل شد. دستور کار جلسه بررسی طرح "${agendaInput}" بود.
          
          در ابتدا مدیرعامل شرکت تابعه گزارشی از لزوم تسریع در اجرای این مصوبه ارائه داد. سپس **جناب دکتر احسان رضایی (مدیر ارشد حاکمیتی هلدینگ)** با ایراد سخنرانی قاطع بیان داشتند: 
          > "سپه صراحتاً با طرح‌هایی که باعث افزایش بی ضابطه نسبت بدهی شرکت تابعه شوند مخالفت خواهد کرد. پروژه کنونی به دلیل اهمیت آن تایید می‌شود اما منوط به این است که ماهانه گزارش انحراف بودجه برای دفتر مرکزی سپه ارسال گردد و کنترل پیشرفت کار تحت نظارت امین ما باشد."
          
          در نهایت مجمع وارد فرآیند رأی‌گیری شد و نتایج طبق جدول زیر ثبت گردید:

          ### 🗳️ جدول رسمی شمارش آرا هیئت مدیره
          | نام نماینده | سمت در هیئت مدیره | وضعیت رأی | انگیزه و رویکرد رأی‌دهی |
          |---|---|---|---|
          | **جناب دکتر احسان رضایی** | نماینده حاکمیتی بانک سپه | **موافق مشروط** | حمایت از کلیت کار با شرط نظارت استراتژیک ماهانه |
          | دکتر کریمی | عضو هیئت مدیره و مدیرعامل | **موافق** | اصرار بر رفع گلگاه‌های تولیدی فعلی |
          | مهندس مهدوی | نماینده مستقل مالی | **موافق** | اطمینان از کفایت درآمدهای آتی طرح |
          | دکتر علوی | رئیس کمیته ریسک و حسابرسی | **ممتنع** | نیاز مبرم به سنجش عمیق‌تر بتای نوسانات بازار |
          | نماینده سهامداران حقیقی | عضو غیرموظف | **مخالف** | انتقاد از دوره بازگشت طولانی‌مدت پروژه تابعه |`,
          status: status,
          aiReview: `### 🧠 ممیزی و ارزیابی ریسک هوش مصنوعی (AI Corporate Audit)
          با بررسی نسبت جاری شرکت که در سطح **${targetComp.riskMetrics.currentRatio.toFixed(2)}** قرار دارد و مقایسه آن با اهداف کلان مجمع سپه، این تصمیم حاکمیتی تحت نظارت **جناب دکتر احسان رضایی** کاملاً عاقلانه است.
          
          **توصیه‌های تکمیلی تصمیم‌یار هوشمند:**
          * **بستن حساب امانی (Escrow Account)**: توصیه می‌شود وجوه تامین‌شده فقط گام‌به‌گام و با فیزیک پیشرفت تایید شده کار آزاد گردند.
          * **کاهش اهرم مالی**: شرکت تابعه موظف است تا پایان سال جاری نسبت بدهی به حقوق صاحبان سهام خود را حداقل ۱۰٪ کاهش دهد.`
        };
      }

      const newSimulation: BoardResolutionSimulation = {
        id: `simulation-${Date.now()}`,
        title: simulatedResult.title || `جلسه حاکمیتی: ${agendaInput}`,
        agenda: simulatedResult.agenda || agendaInput,
        transcript: simulatedResult.transcript,
        status: simulatedResult.status,
        aiReview: simulatedResult.aiReview,
        category: meetingCategory,
        attendanceProfile: attendanceProfile,
        voteBreakdown: { yes: yesVotes, no: noVotes, abstain: abstainVotes },
        date: new Date().toISOString().split('T')[0]
      };

      onAddMeeting(newSimulation);
      setSelectedHistoricalMeeting(newSimulation);
      setAgendaInput('');
    } catch (e) {
      console.error(e);
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-neutral-200" id="smart-assistant-tab">
      
      {/* SECTION 1: Interactive AI Strategic Chat */}
      <div className="bg-[#16161a] border border-white/10 rounded-xl shadow-lg flex flex-col h-[700px] overflow-hidden">
        {/* Chat Header */}
        <div className="p-4.5 border-b border-white/10 flex justify-between items-center bg-[#0a0a0b]/60 rounded-t-xl">
          <div className="flex items-center gap-1.5 text-xs text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-md font-mono border border-blue-500/15">
            <Cpu size={14} className="animate-pulse" />
            <span>DECISION ENGINE LIVE</span>
          </div>
          <div className="text-right">
            <h3 className="text-sm font-bold text-white" dir="rtl">دستیار هوش مصنوعی تصمیم‌یار مجمع</h3>
            <p className="text-[10px] text-neutral-500 font-mono">Executive AI Strategic Board Advisor</p>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-[#0a0a0b]/40 custom-scrollbar flex flex-col">
          {chatMessages.map((msg, idx) => (
            <div 
              key={idx} 
              className={`flex flex-col ${msg.sender === 'user' ? 'items-start' : 'items-end'}`}
            >
              <div 
                className={`max-w-[90%] rounded-2xl px-5 py-3.5 text-xs leading-relaxed ${
                  msg.sender === 'user' 
                    ? 'bg-blue-600/15 text-neutral-100 border border-blue-500/20 rounded-tl-none font-medium' 
                    : 'bg-[#0a0a0b]/60 border border-white/5 text-neutral-200 rounded-tr-none text-right whitespace-pre-wrap'
                } shadow-md`}
                dir={msg.sender === 'user' ? 'ltr' : 'rtl'}
              >
                {/* AI Markdown formatting helper */}
                {msg.sender === 'assistant' ? (
                  <MarkdownRenderer content={msg.text} />
                ) : (
                  <p className="font-sans text-xs leading-relaxed">{msg.text}</p>
                )}
                <span className="block text-[9px] text-neutral-500 mt-2 font-mono text-left">
                  {msg.date}
                </span>
              </div>
            </div>
          ))}

          {isChatLoading && (
            <div className="flex justify-end">
              <div className="bg-blue-950/20 border border-blue-500/25 rounded-2xl rounded-tr-none px-5 py-3 flex items-center gap-2 text-xs text-blue-400 font-medium animate-pulse">
                <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" />
                <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce delay-150" />
                <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce delay-300" />
                <span className="font-mono text-[10px] pr-1" dir="rtl">در حال ارزیابی ترازنامه و بازخوانی اسناد حاکمیتی...</span>
              </div>
            </div>
          )}
        </div>

        {/* Quick Suggestion Prompts */}
        <div className="p-3 bg-[#16161a] border-t border-white/10 flex gap-2 overflow-x-auto select-none no-scrollbar">
          <button 
            onClick={() => handleQuickPrompt('طرح اصلاح ساختار و بازسازی هیئت مدیره سیمان سپهر کویر')}
            className="flex-shrink-0 px-3 py-1.5 bg-[#0a0a0b] border border-white/10 text-neutral-400 hover:text-blue-400 hover:border-blue-500/30 text-[10px] rounded-lg transition-all cursor-pointer font-sans"
            dir="rtl"
          >
            📊 طرح اصلاح سیمان سپهر
          </button>
          <button 
            onClick={() => handleQuickPrompt('تحلیل ریسک ورشکستگی آلتمن بر روی کل شرکت‌های تابعه و گروه چادرملو')}
            className="flex-shrink-0 px-3 py-1.5 bg-[#0a0a0b] border border-white/10 text-neutral-400 hover:text-blue-400 hover:border-blue-500/30 text-[10px] rounded-lg transition-all cursor-pointer font-sans"
            dir="rtl"
          >
            ⚠️ پیش‌بینی ورشکستگی آلتمن
          </button>
          <button 
            onClick={() => handleQuickPrompt('توصیه هجینگ ارزی و پوشش ریسک نوسانات ارزی برای کل پورتفو')}
            className="flex-shrink-0 px-3 py-1.5 bg-[#0a0a0b] border border-white/10 text-neutral-400 hover:text-blue-400 hover:border-blue-500/30 text-[10px] rounded-lg transition-all cursor-pointer font-sans"
            dir="rtl"
          >
            🛢️ هجینگ ارزی گروه سپه
          </button>
        </div>

        {/* Chat Input form */}
        <form onSubmit={handleChatSubmit} className="p-4 border-t border-white/10 bg-[#16161a] flex gap-3">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            disabled={isChatLoading}
            className="flex-1 bg-[#0a0a0b] border border-white/10 rounded-lg px-4 py-2.5 text-xs text-white placeholder-neutral-700 focus:outline-none focus:border-blue-500/50"
            placeholder="سوال استراتژیک خود را از دستیار هوشمند بپرسید..."
            dir="rtl"
          />
          <button
            type="submit"
            disabled={isChatLoading || !chatInput.trim()}
            className="p-2.5 bg-blue-500 hover:bg-blue-600 disabled:bg-[#0a0a0b] text-black disabled:text-neutral-600 rounded-lg transition-all cursor-pointer flex items-center justify-center"
          >
            <Send size={16} />
          </button>
        </form>
      </div>

      {/* SECTION 2: Board Meeting Resolution Simulator */}
      <div className="bg-[#16161a] border border-white/10 rounded-xl shadow-lg flex flex-col h-[700px] overflow-hidden">
        {/* Simulator Header */}
        <div className="p-4.5 border-b border-white/10 flex justify-between items-center bg-[#0a0a0b]/60">
          <div className="flex items-center gap-1.5 text-xs text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-md font-mono border border-blue-500/15">
            <BrainCircuit size={14} />
            <span>VIRTUAL BOARD ROOM</span>
          </div>
          <div className="text-right">
            <h3 className="text-sm font-bold text-white" dir="rtl">شبیه‌ساز پیشرفته تصمیم‌گیری هیئت مدیره</h3>
            <p className="text-[10px] text-neutral-500 font-mono">Executive Board Meeting & Voting Predictor</p>
          </div>
        </div>

        {/* Input panel & Simulator controls */}
        <div className="p-5 border-b border-white/10 bg-[#0a0a0b]/20 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <label className="text-neutral-400 block text-right" dir="rtl">انتخاب شرکت هدف:</label>
              <select
                value={selectedMeetingCompany}
                onChange={(e) => setSelectedMeetingCompany(e.target.value)}
                className="w-full bg-[#0a0a0b] border border-white/10 rounded px-3 py-2 text-neutral-300 focus:outline-none focus:border-blue-500/40 text-right cursor-pointer"
                dir="rtl"
              >
                {subsidiaries.map(sub => (
                  <option key={sub.id} value={sub.id}>{sub.name} ({sub.ticker})</option>
                ))}
              </select>
            </div>
            
            <div className="space-y-1">
              <label className="text-neutral-400 block text-right" dir="rtl">دسته‌بندی موضوعی جلسه:</label>
              <select
                value={meetingCategory}
                onChange={(e) => setMeetingCategory(e.target.value as any)}
                className="w-full bg-[#0a0a0b] border border-white/10 rounded px-3 py-2 text-neutral-300 focus:outline-none focus:border-blue-500/40 text-right cursor-pointer"
                dir="rtl"
              >
                <option value="INVESTMENT">طرح توسعه و سرمایه‌گذاری</option>
                <option value="COMPLIANCE">ممیزی حاکمیتی و انطباق قوانین</option>
                <option value="DIVESTMENT">واگذاری دارایی و املاک غیرمولد</option>
                <option value="RESTRUCTURING">اصلاح ساختار هیئت مدیره و توزیع سود</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 text-xs">
            <div className="space-y-1">
              <label className="text-neutral-400 block text-right" dir="rtl">ترکیب اعضای حاضر در جلسه:</label>
              <select
                value={attendanceProfile}
                onChange={(e) => setAttendanceProfile(e.target.value as any)}
                className="w-full bg-[#0a0a0b] border border-white/10 rounded px-3 py-2 text-neutral-300 focus:outline-none focus:border-blue-500/40 text-right cursor-pointer"
                dir="rtl"
              >
                <option value="FULL">حضور حداکثری اعضا به همراه نماینده ارشد هلدینگ (جناب دکتر احسان رضایی)</option>
                <option value="INDEPENDENT">فقط اعضای مستقل هیئت مدیره و کمیته حسابرسی تابعه</option>
                <option value="EXPERT">اعضای هیئت مدیره به همراه مشاوران ارشد اقتصادی هلدینگ</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-neutral-400 block text-right" dir="rtl">موضوع و دستور کار جلسه:</label>
              <input
                type="text"
                value={agendaInput}
                onChange={(e) => setAgendaInput(e.target.value)}
                placeholder="مثال: فروش زمین بخش غربی سیمان کویر جهت تسویه فوری ۲۰۰ میلیارد بدهی"
                className="w-full bg-[#0a0a0b] border border-white/10 rounded px-3 py-2.5 text-neutral-300 focus:outline-none focus:border-blue-500/40 text-right"
                dir="rtl"
              />
            </div>
          </div>

          <button
            onClick={handleSimulateBoard}
            disabled={!agendaInput.trim() || isSimulating}
            className="w-full py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 disabled:from-[#0a0a0b] disabled:to-[#0a0a0b] disabled:text-neutral-600 text-black font-extrabold text-xs rounded-lg shadow transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {isSimulating ? (
              <>
                <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                <span dir="rtl">در حال پردازش آرای مجمع و تحریر صورت‌جلسه رسمی مجمع سپه...</span>
              </>
            ) : (
              <>
                <Play size={14} />
                <span dir="rtl">شبیه‌سازی کامل جلسه هیئت مدیره و پیش‌بینی آرا</span>
              </>
            )}
          </button>
        </div>

        {/* Display simulator result / Historical list */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 overflow-hidden">
          {/* Historical sessions Sidebar list */}
          <div className="border-r border-white/10 bg-[#0a0a0b]/40 overflow-y-auto p-3 space-y-2 md:block hidden">
            <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block mb-2 px-1 font-mono flex items-center gap-1">
              <History size={12} />
              <span>History Log</span>
            </span>
            {meetings.map((meet) => {
              const statusColors = meet.status === 'Approved' ? 'text-emerald-400' : meet.status === 'Rejected' ? 'text-red-400' : 'text-blue-400';
              return (
                <div
                  key={meet.id}
                  onClick={() => setSelectedHistoricalMeeting(meet)}
                  className={`p-2.5 rounded-lg border text-right cursor-pointer transition-all ${
                    selectedHistoricalMeeting?.id === meet.id
                      ? 'bg-[#16161a] border-blue-500/30 shadow'
                      : 'bg-[#0a0a0b] border-white/5 hover:border-white/10'
                  }`}
                  dir="rtl"
                >
                  <h4 className="text-[11px] font-bold text-neutral-200 line-clamp-1">{meet.title}</h4>
                  <div className="flex items-center justify-between text-[9px] text-neutral-500 mt-1.5 font-mono">
                    <span className={statusColors}>{meet.status}</span>
                    <span>{meet.date}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Active selected session details */}
          <div className="col-span-2 overflow-y-auto p-5 space-y-5 custom-scrollbar text-right" dir="rtl">
            {selectedHistoricalMeeting ? (
              <div className="space-y-4">
                {/* Header info */}
                <div className="border-b border-white/10 pb-3 flex justify-between items-center">
                  <span className={`px-2 py-0.5 text-[9px] font-bold rounded ${
                    selectedHistoricalMeeting.status === 'Approved' 
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/15'
                      : selectedHistoricalMeeting.status === 'Rejected'
                      ? 'bg-red-500/10 text-red-400 border border-red-500/15'
                      : 'bg-blue-500/10 text-blue-400 border border-blue-500/15'
                  }`}>
                    {selectedHistoricalMeeting.status === 'Approved' ? 'مصوب شده' : selectedHistoricalMeeting.status === 'Rejected' ? 'رد صلاحیت مجمع' : 'مسکوت و تعلیق'}
                  </span>
                  <div>
                    <h3 className="text-xs font-bold text-white">{selectedHistoricalMeeting.title}</h3>
                    <p className="text-[10px] text-neutral-500 font-mono mt-0.5">{selectedHistoricalMeeting.date}</p>
                  </div>
                </div>

                {/* Vote Breakdown Section (Dynamic Gauge) */}
                <div className="bg-[#0a0a0b]/40 border border-white/5 rounded-xl p-4 space-y-2.5">
                  <div className="flex justify-between items-baseline">
                    <span className="text-[10px] text-neutral-500 font-mono">Consensus: {selectedHistoricalMeeting.status === 'Approved' ? 'Passed' : 'Pending'}</span>
                    <h4 className="text-[11px] font-bold text-blue-400">🗳️ ترکیب و شمارش آرای پیش‌بینی‌شده مجمع:</h4>
                  </div>
                  
                  {/* Gauge indicator */}
                  {(() => {
                    const yes = selectedHistoricalMeeting.voteBreakdown?.yes ?? (selectedHistoricalMeeting.status === 'Approved' ? 4 : selectedHistoricalMeeting.status === 'Rejected' ? 1 : 2);
                    const no = selectedHistoricalMeeting.voteBreakdown?.no ?? (selectedHistoricalMeeting.status === 'Approved' ? 0 : selectedHistoricalMeeting.status === 'Rejected' ? 3 : 1);
                    const abstain = selectedHistoricalMeeting.voteBreakdown?.abstain ?? (selectedHistoricalMeeting.status === 'Approved' ? 1 : selectedHistoricalMeeting.status === 'Rejected' ? 1 : 2);
                    const total = yes + no + abstain || 5;
                    return (
                      <div className="space-y-2">
                        <div className="flex h-2.5 rounded-full overflow-hidden bg-neutral-800">
                          <div style={{ width: `${(yes / total) * 100}%` }} className="bg-emerald-500" title="موافق" />
                          <div style={{ width: `${(abstain / total) * 100}%` }} className="bg-amber-500" title="ممتنع" />
                          <div style={{ width: `${(no / total) * 100}%` }} className="bg-red-500" title="مخالف" />
                        </div>
                        <div className="flex justify-between text-[10px] px-1 font-mono">
                          <span className="text-emerald-400 font-bold">موافق: {yes} رأی</span>
                          <span className="text-amber-400 font-bold">ممتنع: {abstain} رأی</span>
                          <span className="text-red-400 font-bold">مخالف: {no} رأی</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Agenda */}
                <div>
                  <h4 className="text-[11px] font-bold text-blue-400 mb-1"> دستور رسمی مکتوب جلسه:</h4>
                  <p className="text-xs text-neutral-300 bg-[#0a0a0b]/60 p-3 rounded-lg border border-white/5 leading-relaxed font-medium">
                    {selectedHistoricalMeeting.agenda}
                  </p>
                </div>

                {/* Transcript - Beautifully parsed markdown */}
                <div>
                  <h4 className="text-[11px] font-bold text-neutral-400 mb-2 flex items-center gap-1.5">
                    <Users size={12} className="text-neutral-500" />
                    <span>خلاصه مذاکرات اعضای هیئت مدیره و مصوبه نهایی:</span>
                  </h4>
                  <div className="text-xs text-neutral-300 bg-[#0a0a0b]/20 p-4 rounded-xl border border-white/5 space-y-2">
                    <MarkdownRenderer content={selectedHistoricalMeeting.transcript} />
                  </div>
                </div>

                {/* AI Auditor Review */}
                <div>
                  <h4 className="text-[11px] font-bold text-blue-400 mb-2 flex items-center gap-1">
                    <Sparkles size={12} />
                    <span>ممیزی و ارزیابی ریسک هوش مصنوعی (AI Audit):</span>
                  </h4>
                  <div className="text-xs text-neutral-300 bg-blue-950/15 border border-blue-500/20 p-4 rounded-xl leading-relaxed">
                    <MarkdownRenderer content={selectedHistoricalMeeting.aiReview} />
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-neutral-500 text-xs">
                <HelpCircle size={32} className="mb-2" />
                <span>یکی از جلسات تاریخچه را انتخاب کنید یا دستور جلسه جدیدی را شبیه‌سازی نمایید.</span>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
