import { GoogleGenAI } from '@google/genai';
import { Subsidiary, RiskPersona, RiskThresholds } from '../types';

// Cached client per-key to avoid creating new instances repeatedly
let cachedClient: { key: string; ai: GoogleGenAI } | null = null;

function getClient(apiKey: string): GoogleGenAI {
  if (!cachedClient || cachedClient.key !== apiKey) {
    cachedClient = { key: apiKey, ai: new GoogleGenAI({ apiKey }) };
  }
  return cachedClient.ai;
}

function isValidApiKey(key: string | null | undefined): boolean {
  const k = key?.trim();
  return !!(k && k.length > 10 && k !== 'default-system-key' && k !== 'system-secure-key' && k !== 'legacy-key' && k !== 'demo-mode');
}

export function isUsingRealApi(apiKey: string | null): boolean {
  return isValidApiKey(apiKey);
}

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

  if (!isValidApiKey(apiKey)) {
    return generateMockAiResponse(prompt, activeCompany, persona, thresholds, tone, depth, creativity);
  }

  const systemPrompt = buildSystemPrompt(activeCompany, persona, thresholds, tone, depth, creativity);

  try {
    const ai = getClient(apiKey!.trim());

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
      config: {
        systemInstruction: systemPrompt,
        maxOutputTokens: 2048,
        temperature: creativity === 'innovative' ? 0.9 : creativity === 'balanced' ? 0.7 : 0.3,
      },
    });

    const text = response.text;
    if (text) return text;
    throw new Error('پاسخ خالی از Gemini دریافت شد.');

  } catch (err: any) {
    const msg = err?.message || String(err);
    // Surface real API errors back to the caller so UI can show them
    throw new Error(`❌ خطای Gemini API: ${msg}`);
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
    ? `شرکت فعال: ${company.name} (${company.ticker}) — بخش: ${company.sector} — امتیاز سلامت: ${company.healthScore}/100 — Z-Score: ${company.riskMetrics.altmanZScore.toFixed(2)}`
    : 'سطح کلان هلدینگ — همه شرکت‌های تابعه';
  return `شما دستیار هوشمند هلدینگ سرمایه‌گذاری بانک سپه هستید.
رویکرد ریسک: ${personaFa} | لحن: ${tone} | عمق: ${depth} | خلاقیت: ${creativity}
${companyCtx}
آستانه‌ها: بدهی≤${thresholds.maxDebtToEquity} | جاری≥${thresholds.minCurrentRatio} | ESG≥${thresholds.minEsgScore}
همیشه به فارسی، حرفه‌ای، دقیق و کاربردی پاسخ دهید.`;
}

// ─── High-Fidelity Offline Mock Engine ────────────────────────────────────────
export function generateMockAiResponse(
  prompt: string,
  company: Subsidiary | null,
  persona: RiskPersona,
  thresholds: RiskThresholds,
  tone: 'analytical' | 'conservative' | 'creative',
  depth: 'summary' | 'comprehensive',
  creativity: 'precise' | 'balanced' | 'innovative'
): string {
  const norm = prompt.toLowerCase();
  const personaFa = persona === 'CONSERVATIVE' ? 'بسیار محافظه‌کارانه' : persona === 'BALANCED' ? 'متعادل (پویا)' : 'تهاجمی / مقتدرانه';
  const toneFa = tone === 'conservative' ? 'محافظه‌کارانه' : tone === 'creative' ? 'توسعه‌محور' : 'تحلیلی بیطرف';
  const hdr = `[حالت آفلاین | لحن: ${toneFa}]`;

  if (!company) {
    if (depth === 'summary') return `### ${hdr} خلاصه مدیریتی هلدینگ
۱. **تمرکز پرتفوی**: انتقال سرمایه از صنایع پرریسک به دارویی توصیه می‌شود.
۲. **شاخص بدهی**: شرکت‌هایی که از آستانه ${thresholds.maxDebtToEquity} عبور کرده‌اند نیاز به ساختاردهی دارند.
۳. **حاکمیت**: افزایش نسبت مدیران مستقل به ۴۰٪ اولویت اصلی است.`;

    return `### ${hdr} گزارش جامع راهبردی هلدینگ سرمایه‌گذاری بانک سپه

**رویکرد**: ${personaFa}

۱. **تخصیص سرمایه**: انتقال از صنایع چرخه‌ای به دارویی و غذایی با ثبات نقدی بالا.
۲. **کنترل اهرم**: شرکت‌های با D/E بالاتر از ${thresholds.maxDebtToEquity} نیاز فوری به تأمین مالی مجدد دارند.
۳. **حاکمیت شرکتی**: تشکیل کمیته مستقل حاکمیت و ارتقای معیارهای ESG.

> 💡 برای دریافت تحلیل‌های دقیق‌تر با داده‌های واقعی، کلید Gemini API را در تنظیمات وارد کنید.`;
  }

  if (norm.includes('bankruptcy') || norm.includes('altman') || norm.includes('ورشکستگی') || norm.includes('آلتمن')) {
    const isHigh = company.riskMetrics.altmanZScore < 1.8;
    return `### ${hdr} تحلیل Altman Z-Score — ${company.name}

**Z-Score**: **${company.riskMetrics.altmanZScore.toFixed(2)}** | **سطح ریسک**: ${company.riskMetrics.bankruptcyRisk}

${isHigh ? '⚠️ **در محدوده خطر**: نسبت سرمایه در گردش منفی و هزینه بهره بالا.' : '✅ **در محدوده امن**: نقدینگی پایدار و جریان نقدی مثبت.'}

**اقدامات پیشنهادی**:
• نسبت جاری فعلی: ${company.riskMetrics.currentRatio.toFixed(2)} → هدف: ≥${thresholds.minCurrentRatio}
• وصول مطالبات سنواتی جهت آزادسازی نقدینگی
• بازنگری ساختار بدهی و جایگزینی وام‌های کوتاه‌مدت`;
  }

  if (norm.includes('board') || norm.includes('مدیره') || norm.includes('حاکمیت') || norm.includes('governance')) {
    return `### ${hdr} حاکمیت شرکتی — ${company.name}

۱. **مدیران مستقل**: ${Math.round(company.governanceData.independentDirectorsRatio * 100)}٪ (هدف: ۴۰٪)
۲. **نرخ حضور**: ${Math.round(company.governanceData.attendanceRate * 100)}٪ (کف نظارتی: ${Math.round(thresholds.minAttendanceRate * 100)}٪)
۳. **کیفیت حسابرسی**: رتبه **${company.governanceData.auditQualityRating}** — ارتقاء به A پیشنهاد می‌شود.

*تأثیر تخمینی: +۱۵٪ شفافیت مالی طی ۱۲ ماه*`;
  }

  return `### ${hdr} تحلیل راهبردی — ${company.name} (${company.ticker})

**رویکرد**: ${personaFa}

| شاخص | مقدار | وضعیت |
|------|-------|--------|
| درآمد | ${company.financialData.revenue.toLocaleString('fa-IR')} م.ت | — |
| سود خالص | ${company.financialData.netProfit.toLocaleString('fa-IR')} م.ت | — |
| حاشیه سود | ${Math.round((company.financialData.netProfit / company.financialData.revenue) * 100)}٪ | — |
| نسبت بدهی | ${company.riskMetrics.debtToEquity.toFixed(2)} | ${company.riskMetrics.debtToEquity > thresholds.maxDebtToEquity ? '❌' : '✅'} |
| نسبت جاری | ${company.riskMetrics.currentRatio.toFixed(2)} | ${company.riskMetrics.currentRatio < thresholds.minCurrentRatio ? '❌' : '✅'} |
| امتیاز ESG | ${company.esgData.totalEsgScore}٪ | — |

> 💡 برای تحلیل عمیق‌تر، کلید Gemini API را در بخش **تنظیمات** وارد کنید.`;
}
