import { Subsidiary, RiskPersona, RiskThresholds } from '../types';

export async function askGeminiAssistant(
  prompt: string,
  apiKey: string | null,
  activeCompany: Subsidiary | null,
  persona: RiskPersona,
  thresholds: RiskThresholds,
  tone: 'analytical' | 'conservative' | 'creative' = 'analytical',
  depth: 'summary' | 'comprehensive' = 'comprehensive',
  creativity: 'precise' | 'balanced' | 'innovative' = 'balanced'
): Promise<string> {
  // If no real API key, use offline mock engine
  const trimmedKey = apiKey?.trim();
  const isRealKey = trimmedKey && trimmedKey !== 'default-system-key' && trimmedKey !== 'system-secure-key' && trimmedKey.startsWith('AIza');

  if (!isRealKey) {
    return generateMockAiResponse(prompt, activeCompany, persona, thresholds, tone, depth, creativity);
  }

  try {
    const systemPrompt = buildSystemPrompt(activeCompany, persona, thresholds, tone, depth, creativity);
    const model = 'gemini-2.0-flash';

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${trimmedKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            maxOutputTokens: 2048,
            temperature: creativity === 'innovative' ? 0.9 : creativity === 'balanced' ? 0.7 : 0.3,
          },
        }),
      }
    );

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error?.message || `Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (text) return text;
    throw new Error('پاسخ نامعتبر از Gemini API دریافت شد.');
  } catch (error: any) {
    console.warn('Gemini API call failed, falling back to offline engine:', error?.message);
    return generateMockAiResponse(prompt, activeCompany, persona, thresholds, tone, depth, creativity);
  }
}

function buildSystemPrompt(
  company: Subsidiary | null,
  persona: RiskPersona,
  thresholds: RiskThresholds,
  tone: string,
  depth: string,
  creativity: string
): string {
  const personaFa = persona === 'CONSERVATIVE' ? 'محافظه‌کارانه' : persona === 'BALANCED' ? 'متعادل' : 'تهاجمی';
  const companyCtx = company
    ? `شرکت فعال: ${company.name} (${company.ticker}) | بخش: ${company.sector} | امتیاز سلامت: ${company.healthScore} | Z-Score: ${company.riskMetrics.altmanZScore}`
    : 'سطح هلدینگ — همه شرکت‌های تابعه';
  return `شما دستیار هوشمند هلدینگ سرمایه‌گذاری بانک سپه هستید.
رویکرد ریسک: ${personaFa} | لحن: ${tone} | عمق: ${depth} | خلاقیت: ${creativity}
${companyCtx}
آستانه‌های مجاز: بدهی=${thresholds.maxDebtToEquity} | جاری=${thresholds.minCurrentRatio} | ESG=${thresholds.minEsgScore}
پاسخ‌ها را کاملاً به فارسی، حرفه‌ای و کاربردی ارائه دهید.`;
}

// High-fidelity offline mock engine
function generateMockAiResponse(
  prompt: string,
  company: Subsidiary | null,
  persona: RiskPersona,
  thresholds: RiskThresholds,
  tone: 'analytical' | 'conservative' | 'creative',
  depth: 'summary' | 'comprehensive',
  creativity: 'precise' | 'balanced' | 'innovative'
): string {
  const normPrompt = prompt.toLowerCase();
  const personaFa = persona === 'CONSERVATIVE' ? 'بسیار محافظه‌کارانه' : persona === 'BALANCED' ? 'متعادل (پویا)' : 'تهاجمی / مقتدرانه';
  const toneFa = tone === 'conservative' ? 'تحت اشتهای ریسک محافظه‌کارانه' : tone === 'creative' ? 'با نگاه توسعه‌محور استراتژیک' : 'با تحلیل سرد علمی و بیطرفانه';
  const headerPrefix = `[دستیار مالی | لحن: ${toneFa} | دقت: ${creativity === 'precise' ? 'بالا' : creativity === 'innovative' ? 'استنباطی' : 'متعادل'}]`;

  if (!company) {
    if (depth === 'summary') {
      return `### ${headerPrefix} خلاصه مدیریتی وضعیت هلدینگ سپه
۱. **تمرکز پرتفوی**: لزوم تخصیص سرمایه از صنایع پرریسک به دارویی به دلیل بازدهی نقدی پایدار.
۲. **شاخص بدهی**: تعدادی از تابعه‌ها از آستانه بدهی مجاز ${thresholds.maxDebtToEquity} عبور کرده‌اند.
۳. **ریسک حاکمیتی**: افزایش نسبت اعضای مستقل هیئت مدیره به حداقل ۳۵٪ پیشنهاد می‌شود.`;
    }
    return `### ${headerPrefix} گزارش جامع راهبردی هلدینگ سرمایه‌گذاری بانک سپه (${personaFa})

دستیار هوشمند با رویکرد **${personaFa}** آماده تحلیل است.

۱. **انتقال به صنایع دفاعی و دارویی**: افزایش تخصیص سرمایه به شرکت‌های دارویی به دلیل حاشیه سود بالا.
۲. **پایش نسبت بدهی**: شرکت‌هایی که بالاتر از سقف ${thresholds.maxDebtToEquity} هستند نیاز به ساختاردهی مجدد دارند.
۳. **حاکمیت شرکتی**: تشکیل کمیته حاکمیت شرکتی جهت تدوین آیین‌نامه‌های کنترل ریسک.

**پیشنهاد ساختاری**: بهینه‌سازی سبد پرتفولیو با هدف افزایش نسبت شارپ و کاهش ریسک سیستماتیک.`;
  }

  if (normPrompt.includes('bankruptcy') || normPrompt.includes('altman') || normPrompt.includes('ورشکستگی') || normPrompt.includes('آلتمن')) {
    const isHighRisk = company.riskMetrics.altmanZScore < 1.8;
    return `### ${headerPrefix} گزارش مدل Altman Z-Score برای ${company.name}

**امتیاز Z-Score فعلی**: **${company.riskMetrics.altmanZScore.toFixed(2)}**
**سطح ریسک**: **${company.riskMetrics.bankruptcyRisk}**

${isHighRisk
  ? `⚠️ شرکت در محدوده خطر قرار دارد. نسبت سرمایه در گردش منفی و هزینه‌های بهره بالا، سود انباشته را تضعیف کرده است.`
  : `✅ شرکت در محدوده امن قرار دارد. نقدینگی قدرتمند سپر محافظتی ایجاد کرده است.`}

**اقدامات پیشنهادی**:
۱. نسبت جاری: **${company.riskMetrics.currentRatio.toFixed(2)}** → هدف: **${thresholds.minCurrentRatio}**
۲. بازنگری در موجودی انبار برای آزادسازی نقدینگی
۳. وصول مطالبات تجاری سنواتی به عنوان اولویت اول`;
  }

  if (normPrompt.includes('board') || normPrompt.includes('مدیره') || normPrompt.includes('حاکمیت')) {
    return `### ${headerPrefix} طرح راهبردی حاکمیت شرکتی ${company.name}

۱. **مدیران مستقل**: نسبت فعلی (${Math.round(company.governanceData.independentDirectorsRatio * 100)}٪) → هدف: ۴۰٪
۲. **نرخ حضور**: ${Math.round(company.governanceData.attendanceRate * 100)}٪ → کف نظارتی: ${Math.round(thresholds.minAttendanceRate * 100)}٪
۳. **کیفیت حسابرسی**: رتبه **${company.governanceData.auditQualityRating}** → ارتقاء به ردیف A

*تاثیر تخمینی: +۱۵٪ بهبود شفافیت مالی طی ۱۲ ماه*`;
  }

  return `### ${headerPrefix} تحلیل راهبردی ${company.name} (${company.ticker})

**رویکرد**: ${personaFa}

۱. **عملکرد مالی**: درآمد ${company.financialData.revenue.toLocaleString('fa-IR')} | سود ${company.financialData.netProfit.toLocaleString('fa-IR')} م.ت | حاشیه ${Math.round((company.financialData.netProfit / company.financialData.revenue) * 100)}٪
۲. **بدهی**: ${company.riskMetrics.debtToEquity.toFixed(2)} (سقف: ${thresholds.maxDebtToEquity}) ${company.riskMetrics.debtToEquity > thresholds.maxDebtToEquity ? '❌ فراتر از سقف' : '✅ مجاز'}
۳. **ESG**: امتیاز ${company.esgData.totalEsgScore}٪ | انتشار کربن: ${company.esgData.carbonEmissionsLevel}

**توصیه**: با پروفایل ریسک ${personaFa}، تمرکز بر بهبود نسبت جاری و کاهش هزینه‌های مالی اولویت دارد.`;
}
