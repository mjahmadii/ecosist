import { Subsidiary, RiskThresholds, AIRecommendation, BoardResolutionSimulation } from './types';

// Standard private/manufacturing firm Altman Z-Score calculation
export function calculateAltmanZScore(
  currentAssets: number,
  currentLiabilities: number,
  totalAssets: number,
  retainedEarnings: number,
  netProfit: number,
  stockEquity: number,
  revenue: number,
  totalLiabilities: number
): { zScore: number; risk: 'Very Low' | 'Low' | 'Moderate' | 'High' | 'Severe' } {
  const workingCapital = currentAssets - currentLiabilities;
  
  // A = Working Capital / Total Assets
  const A = totalAssets > 0 ? workingCapital / totalAssets : 0;
  // B = Retained Earnings / Total Assets
  const B = totalAssets > 0 ? retainedEarnings / totalAssets : 0;
  // C = EBIT (Estimated as 1.15 * net profit) / Total Assets
  const EBIT = netProfit * 1.15;
  const C = totalAssets > 0 ? EBIT / totalAssets : 0;
  // D = Equity / Liabilities
  const D = totalLiabilities > 0 ? stockEquity / totalLiabilities : 0;
  // E = Asset Turnover = Sales / Total Assets
  const E = totalAssets > 0 ? revenue / totalAssets : 0;

  // Classic Altman Z-score formula: Z = 1.2A + 1.4B + 3.3C + 0.6D + 0.99E
  const zScore = 1.2 * A + 1.4 * B + 3.3 * C + 0.6 * D + 0.99 * E;

  let risk: 'Very Low' | 'Low' | 'Moderate' | 'High' | 'Severe' = 'Moderate';
  if (zScore > 2.9) risk = 'Very Low';
  else if (zScore > 1.8) risk = 'Low';
  else if (zScore > 1.1) risk = 'Moderate';
  else if (zScore > 0.5) risk = 'High';
  else risk = 'Severe';

  return { zScore: Math.round(zScore * 100) / 100, risk };
}

export function calculateScores(sub: Partial<Subsidiary> & { id: string }, thresholds: RiskThresholds): {
  healthScore: number;
  governanceScore: number;
} {
  const fin = sub.financialData!;
  const gov = sub.governanceData!;
  const esg = sub.esgData!;

  // 1. Financial Health Score (1 to 100)
  // Factors: Profit margin, Debt-to-Equity relative to threshold, Current ratio relative to threshold, Altman Z-Score
  const profitMargin = fin.revenue > 0 ? fin.netProfit / fin.revenue : 0;
  const marginScore = Math.min(100, Math.max(0, profitMargin * 250)); // 40% margin = 100 pts
  
  const debtToEquity = fin.stockEquity > 0 ? fin.totalLiabilities / fin.stockEquity : 0;
  const debtScore = debtToEquity <= thresholds.maxDebtToEquity 
    ? 100 - (debtToEquity / thresholds.maxDebtToEquity) * 30 
    : Math.max(10, 70 - ((debtToEquity - thresholds.maxDebtToEquity) * 20));

  const currentRatio = fin.currentLiabilities > 0 ? fin.currentAssets / fin.currentLiabilities : 1;
  const currentRatioScore = currentRatio >= thresholds.minCurrentRatio
    ? 100 - (thresholds.minCurrentRatio / currentRatio) * 10
    : Math.max(10, (currentRatio / thresholds.minCurrentRatio) * 70);

  const zDetails = calculateAltmanZScore(
    fin.currentAssets, fin.currentLiabilities, fin.totalAssets,
    fin.retainedEarnings, fin.netProfit, fin.stockEquity, fin.revenue, fin.totalLiabilities
  );
  const zScoreValue = zDetails.zScore;
  const zScorePoints = Math.min(100, Math.max(0, (zScoreValue / 3.0) * 100));

  const healthScore = Math.round(
    marginScore * 0.3 + debtScore * 0.25 + currentRatioScore * 0.25 + zScorePoints * 0.2
  );

  // 2. Governance Score (1 to 100)
  // Factors: Transparency score, Board Attendance relative to threshold, Independent ratio, Disputes penalty
  const transPoints = gov.transparencyScore;
  const attendancePoints = gov.attendanceRate >= thresholds.minAttendanceRate
    ? 100 - (1 - gov.attendanceRate) * 100
    : (gov.attendanceRate / thresholds.minAttendanceRate) * 70;

  const indepPoints = gov.independentDirectorsRatio * 200; // 50% = 100 pts
  const disputePenalty = gov.shareholderDisputesCount * 15;
  const auditPoints = gov.auditQualityRating === 'A' ? 100 : gov.auditQualityRating === 'B' ? 85 : gov.auditQualityRating === 'C' ? 65 : 40;

  const governanceScore = Math.round(
    Math.min(100, Math.max(10, (transPoints * 0.3 + attendancePoints * 0.25 + indepPoints * 0.25 + auditPoints * 0.2) - disputePenalty))
  );

  return { healthScore, governanceScore };
}

// Highly realistic Persian subsidiaries of Bank Sepah Investment Management
export const INITIAL_SUBSIDIARIES: Subsidiary[] = [
  {
    id: 'vamid',
    name: 'مدیریت سرمایه‌گذاری امید',
    englishName: 'Omid Investment Management Group',
    ticker: 'وامید',
    sector: 'سرمایه‌گذاری‌های مالی',
    sectorEng: 'Financial Holdings',
    financialData: {
      revenue: 5500, // in Billion Tomans
      netProfit: 3800,
      totalAssets: 9800,
      totalLiabilities: 1200,
      currentAssets: 4100,
      currentLiabilities: 950,
      operatingCashFlow: 3100,
      rAndDExpenses: 30,
      retainedEarnings: 2900,
      stockEquity: 8600,
    },
    governanceData: {
      boardMembersCount: 7,
      independentDirectorsRatio: 0.43,
      boardMeetingsCount: 24,
      attendanceRate: 0.97,
      transparencyScore: 94,
      auditQualityRating: 'A',
      shareholderDisputesCount: 0,
    },
    esgData: {
      environmentalScore: 85,
      carbonEmissionsLevel: 'Low',
      socialScore: 92,
      laborStandardsCompliance: true,
      governanceScore: 95,
      totalEsgScore: 91,
    },
    riskMetrics: {
      altmanZScore: 4.15,
      bankruptcyRisk: 'Very Low',
      debtToEquity: 0.139,
      currentRatio: 4.31,
      interestCoverageRatio: 25.0,
      anomalyScore: 4,
      beta: 0.92,
    },
    healthScore: 97,
    governanceScore: 96,
  },
  {
    id: 'chadormalu',
    name: 'معدنی و صنعتی چادرملو',
    englishName: 'Chadormalu Mining & Industrial',
    ticker: 'کچاد',
    sector: 'استخراج کانه‌های فلزی',
    sectorEng: 'Mining & Metals',
    financialData: {
      revenue: 12500,
      netProfit: 4200,
      totalAssets: 18500,
      totalLiabilities: 6200,
      currentAssets: 7800,
      currentLiabilities: 4500,
      operatingCashFlow: 3900,
      rAndDExpenses: 75,
      retainedEarnings: 3100,
      stockEquity: 12300,
    },
    governanceData: {
      boardMembersCount: 5,
      independentDirectorsRatio: 0.40,
      boardMeetingsCount: 18,
      attendanceRate: 0.95,
      transparencyScore: 89,
      auditQualityRating: 'A',
      shareholderDisputesCount: 0,
    },
    esgData: {
      environmentalScore: 78,
      carbonEmissionsLevel: 'Medium',
      socialScore: 85,
      laborStandardsCompliance: true,
      governanceScore: 88,
      totalEsgScore: 84,
    },
    riskMetrics: {
      altmanZScore: 2.85,
      bankruptcyRisk: 'Low',
      debtToEquity: 0.504,
      currentRatio: 1.73,
      interestCoverageRatio: 18.2,
      anomalyScore: 11,
      beta: 1.05,
    },
    healthScore: 88,
    governanceScore: 91,
  },
  {
    id: 'golgohar',
    name: 'معدنی و صنعتی گل‌گهر',
    englishName: 'GolGohar Mining & Industrial',
    ticker: 'کگل',
    sector: 'استخراج کانه‌های فلزی',
    sectorEng: 'Mining & Metals',
    financialData: {
      revenue: 14800,
      netProfit: 4900,
      totalAssets: 21500,
      totalLiabilities: 8800,
      currentAssets: 9100,
      currentLiabilities: 5900,
      operatingCashFlow: 4400,
      rAndDExpenses: 80,
      retainedEarnings: 3800,
      stockEquity: 12700,
    },
    governanceData: {
      boardMembersCount: 5,
      independentDirectorsRatio: 0.40,
      boardMeetingsCount: 20,
      attendanceRate: 0.92,
      transparencyScore: 86,
      auditQualityRating: 'B',
      shareholderDisputesCount: 1,
    },
    esgData: {
      environmentalScore: 71,
      carbonEmissionsLevel: 'High',
      socialScore: 82,
      laborStandardsCompliance: true,
      governanceScore: 85,
      totalEsgScore: 79,
    },
    riskMetrics: {
      altmanZScore: 2.62,
      bankruptcyRisk: 'Low',
      debtToEquity: 0.693,
      currentRatio: 1.54,
      interestCoverageRatio: 14.5,
      anomalyScore: 14,
      beta: 1.10,
    },
    healthScore: 84,
    governanceScore: 85,
  },
  {
    id: 'gohar-zamin',
    name: 'سنگ آهن گهرزمین',
    englishName: 'Gohar Zamin Iron Ore',
    ticker: 'کگهر',
    sector: 'استخراج کانه‌های فلزی',
    sectorEng: 'Mining & Metals',
    financialData: {
      revenue: 9800,
      netProfit: 3100,
      totalAssets: 14500,
      totalLiabilities: 4200,
      currentAssets: 6200,
      currentLiabilities: 2800,
      operatingCashFlow: 2900,
      rAndDExpenses: 45,
      retainedEarnings: 2500,
      stockEquity: 10300,
    },
    governanceData: {
      boardMembersCount: 5,
      independentDirectorsRatio: 0.40,
      boardMeetingsCount: 16,
      attendanceRate: 0.94,
      transparencyScore: 91,
      auditQualityRating: 'A',
      shareholderDisputesCount: 0,
    },
    esgData: {
      environmentalScore: 75,
      carbonEmissionsLevel: 'Medium',
      socialScore: 86,
      laborStandardsCompliance: true,
      governanceScore: 89,
      totalEsgScore: 83,
    },
    riskMetrics: {
      altmanZScore: 3.25,
      bankruptcyRisk: 'Very Low',
      debtToEquity: 0.408,
      currentRatio: 2.21,
      interestCoverageRatio: 22.0,
      anomalyScore: 9,
      beta: 0.98,
    },
    healthScore: 91,
    governanceScore: 92,
  },
  {
    id: 'omid-darou',
    name: 'امید دارو سپهر',
    englishName: 'Omid Darou Sepehr',
    ticker: 'وامیددارو',
    sector: 'داروسازی و بیوتکنولوژی',
    sectorEng: 'Pharmaceuticals',
    financialData: {
      revenue: 850, // in Billion Tomans (8.5 Trillion IRR)
      netProfit: 215,
      totalAssets: 1200,
      totalLiabilities: 450,
      currentAssets: 680,
      currentLiabilities: 320,
      operatingCashFlow: 180,
      rAndDExpenses: 45,
      retainedEarnings: 310,
      stockEquity: 750,
    },
    governanceData: {
      boardMembersCount: 5,
      independentDirectorsRatio: 0.40, // 40% independent
      boardMeetingsCount: 22,
      attendanceRate: 0.96, // 96% attendance
      transparencyScore: 88,
      auditQualityRating: 'A',
      shareholderDisputesCount: 0,
    },
    esgData: {
      environmentalScore: 82,
      carbonEmissionsLevel: 'Low',
      socialScore: 90,
      laborStandardsCompliance: true,
      governanceScore: 86,
      totalEsgScore: 86,
    },
    riskMetrics: {
      altmanZScore: 3.12,
      bankruptcyRisk: 'Very Low',
      debtToEquity: 0.6,
      currentRatio: 2.125,
      interestCoverageRatio: 8.5,
      anomalyScore: 8, // Very stable
      beta: 0.85,
    },
    healthScore: 89,
    governanceScore: 90,
  },
  {
    id: 'siman-sepehr',
    name: 'سیمان سپهر کویر',
    englishName: 'Cement Sepehr Kavir',
    ticker: 'سکاویر',
    sector: 'سیمان و مصالح ساختمانی',
    sectorEng: 'Heavy Industries',
    financialData: {
      revenue: 620,
      netProfit: 35,
      totalAssets: 1550,
      totalLiabilities: 1100,
      currentAssets: 480,
      currentLiabilities: 790, // Working capital deficiency
      operatingCashFlow: 45,
      rAndDExpenses: 5,
      retainedEarnings: 60,
      stockEquity: 450,
    },
    governanceData: {
      boardMembersCount: 7,
      independentDirectorsRatio: 0.14, // 14% (Only 1 independent)
      boardMeetingsCount: 12,
      attendanceRate: 0.82, // 82% attendance
      transparencyScore: 55,
      auditQualityRating: 'C',
      shareholderDisputesCount: 3,
    },
    esgData: {
      environmentalScore: 41,
      carbonEmissionsLevel: 'High',
      socialScore: 62,
      laborStandardsCompliance: true,
      governanceScore: 52,
      totalEsgScore: 51,
    },
    riskMetrics: {
      altmanZScore: 1.15,
      bankruptcyRisk: 'High',
      debtToEquity: 2.44, // Very high debt
      currentRatio: 0.607,
      interestCoverageRatio: 1.2,
      anomalyScore: 42,
      beta: 1.35,
    },
    healthScore: 45,
    governanceScore: 50,
  },
  {
    id: 'siman-hormozgan',
    name: 'سیمان هرمزگان',
    englishName: 'Hormozgan Cement',
    ticker: 'سهرمز',
    sector: 'سیمان و مصالح ساختمانی',
    sectorEng: 'Heavy Industries',
    financialData: {
      revenue: 1350,
      netProfit: 310,
      totalAssets: 1900,
      totalLiabilities: 750,
      currentAssets: 1100,
      currentLiabilities: 550,
      operatingCashFlow: 410,
      rAndDExpenses: 15,
      retainedEarnings: 420,
      stockEquity: 1150,
    },
    governanceData: {
      boardMembersCount: 5,
      independentDirectorsRatio: 0.40,
      boardMeetingsCount: 14,
      attendanceRate: 0.91,
      transparencyScore: 82,
      auditQualityRating: 'B',
      shareholderDisputesCount: 0,
    },
    esgData: {
      environmentalScore: 64,
      carbonEmissionsLevel: 'High',
      socialScore: 78,
      laborStandardsCompliance: true,
      governanceScore: 80,
      totalEsgScore: 74,
    },
    riskMetrics: {
      altmanZScore: 2.34,
      bankruptcyRisk: 'Low',
      debtToEquity: 0.652,
      currentRatio: 2.0,
      interestCoverageRatio: 6.8,
      anomalyScore: 15,
      beta: 0.88,
    },
    healthScore: 78,
    governanceScore: 83,
  },
  {
    id: 'kavir-tyre',
    name: 'کویر تایر تابعه سپه',
    englishName: 'Kavir Tyre Corp',
    ticker: 'پکویر',
    sector: 'لاستیک و پلاستیک',
    sectorEng: 'Manufacturing',
    financialData: {
      revenue: 1950,
      netProfit: 280,
      totalAssets: 2400,
      totalLiabilities: 1100,
      currentAssets: 1450,
      currentLiabilities: 950,
      operatingCashFlow: 310,
      rAndDExpenses: 28,
      retainedEarnings: 490,
      stockEquity: 1300,
    },
    governanceData: {
      boardMembersCount: 5,
      independentDirectorsRatio: 0.40,
      boardMeetingsCount: 16,
      attendanceRate: 0.93,
      transparencyScore: 85,
      auditQualityRating: 'A',
      shareholderDisputesCount: 0,
    },
    esgData: {
      environmentalScore: 69,
      carbonEmissionsLevel: 'Medium',
      socialScore: 84,
      laborStandardsCompliance: true,
      governanceScore: 85,
      totalEsgScore: 79,
    },
    riskMetrics: {
      altmanZScore: 2.58,
      bankruptcyRisk: 'Low',
      debtToEquity: 0.846,
      currentRatio: 1.526,
      interestCoverageRatio: 5.4,
      anomalyScore: 19,
      beta: 0.94,
    },
    healthScore: 81,
    governanceScore: 86,
  },
  {
    id: 'petro-sepahan',
    name: 'پتروشیمی سپاهان انرژی',
    englishName: 'Petrochemical Sepahan',
    ticker: 'پتروسپاهان',
    sector: 'محصولات شیمیایی و پتروشیمی',
    sectorEng: 'Chemicals & Energy',
    financialData: {
      revenue: 2950,
      netProfit: 880,
      totalAssets: 4500,
      totalLiabilities: 1800,
      currentAssets: 2100,
      currentLiabilities: 1200,
      operatingCashFlow: 920,
      rAndDExpenses: 120,
      retainedEarnings: 1450,
      stockEquity: 2700,
    },
    governanceData: {
      boardMembersCount: 7,
      independentDirectorsRatio: 0.43,
      boardMeetingsCount: 28,
      attendanceRate: 0.98,
      transparencyScore: 92,
      auditQualityRating: 'A',
      shareholderDisputesCount: 1,
    },
    esgData: {
      environmentalScore: 68,
      carbonEmissionsLevel: 'High',
      socialScore: 80,
      laborStandardsCompliance: true,
      governanceScore: 90,
      totalEsgScore: 79,
    },
    riskMetrics: {
      altmanZScore: 3.45,
      bankruptcyRisk: 'Very Low',
      debtToEquity: 0.67,
      currentRatio: 1.75,
      interestCoverageRatio: 14.2,
      anomalyScore: 78,
      beta: 1.15,
    },
    healthScore: 92,
    governanceScore: 93,
  },
  {
    id: 'amin-it',
    name: 'توسعه فناوری اطلاعات امین',
    englishName: 'Amin IT Development',
    ticker: 'فامین',
    sector: 'رایانه و خدمات وابسته',
    sectorEng: 'Technology',
    financialData: {
      revenue: 340,
      netProfit: 95,
      totalAssets: 480,
      totalLiabilities: 110,
      currentAssets: 320,
      currentLiabilities: 85,
      operatingCashFlow: 75,
      rAndDExpenses: 80, // Massive research spending
      retainedEarnings: 160,
      stockEquity: 370,
    },
    governanceData: {
      boardMembersCount: 5,
      independentDirectorsRatio: 0.60, // 60% independent
      boardMeetingsCount: 26,
      attendanceRate: 0.99,
      transparencyScore: 95,
      auditQualityRating: 'A',
      shareholderDisputesCount: 0,
    },
    esgData: {
      environmentalScore: 94,
      carbonEmissionsLevel: 'Low',
      socialScore: 95,
      laborStandardsCompliance: true,
      governanceScore: 96,
      totalEsgScore: 95,
    },
    riskMetrics: {
      altmanZScore: 4.88,
      bankruptcyRisk: 'Very Low',
      debtToEquity: 0.297,
      currentRatio: 3.76,
      interestCoverageRatio: 35.0,
      anomalyScore: 12,
      beta: 1.45,
    },
    healthScore: 96,
    governanceScore: 98,
  },
  {
    id: 'bahar-food',
    name: 'صنایع غذایی بهار سپه',
    englishName: 'Bahar Sepehr Food Industries',
    ticker: 'غبهار',
    sector: 'غذایی بجز قند و شکر',
    sectorEng: 'Consumer Goods',
    financialData: {
      revenue: 520,
      netProfit: 45,
      totalAssets: 680,
      totalLiabilities: 380,
      currentAssets: 340,
      currentLiabilities: 290,
      operatingCashFlow: 58,
      rAndDExpenses: 12,
      retainedEarnings: 110,
      stockEquity: 300,
    },
    governanceData: {
      boardMembersCount: 5,
      independentDirectorsRatio: 0.20,
      boardMeetingsCount: 16,
      attendanceRate: 0.88,
      transparencyScore: 70,
      auditQualityRating: 'B',
      shareholderDisputesCount: 1,
    },
    esgData: {
      environmentalScore: 73,
      carbonEmissionsLevel: 'Medium',
      socialScore: 75,
      laborStandardsCompliance: true,
      governanceScore: 72,
      totalEsgScore: 73,
    },
    riskMetrics: {
      altmanZScore: 2.15,
      bankruptcyRisk: 'Low',
      debtToEquity: 1.26,
      currentRatio: 1.17,
      interestCoverageRatio: 3.2,
      anomalyScore: 18,
      beta: 0.65,
    },
    healthScore: 68,
    governanceScore: 71,
  },
  {
    id: 'ghadir-holding',
    name: 'سرمایه‌گذاری غدیر',
    englishName: 'Ghadir Investment Company',
    ticker: 'وغدیر',
    sector: 'سرمایه‌گذاری‌های مالی',
    sectorEng: 'Financial Holdings',
    financialData: {
      revenue: 19800,
      netProfit: 14500,
      totalAssets: 35000,
      totalLiabilities: 8000,
      currentAssets: 15000,
      currentLiabilities: 6500,
      operatingCashFlow: 12000,
      rAndDExpenses: 50,
      retainedEarnings: 11000,
      stockEquity: 27000,
    },
    governanceData: {
      boardMembersCount: 7,
      independentDirectorsRatio: 0.57,
      boardMeetingsCount: 28,
      attendanceRate: 0.96,
      transparencyScore: 92,
      auditQualityRating: 'A',
      shareholderDisputesCount: 0,
    },
    esgData: {
      environmentalScore: 80,
      carbonEmissionsLevel: 'Medium',
      socialScore: 88,
      laborStandardsCompliance: true,
      governanceScore: 91,
      totalEsgScore: 86,
    },
    riskMetrics: {
      altmanZScore: 3.82,
      bankruptcyRisk: 'Very Low',
      debtToEquity: 0.296,
      currentRatio: 2.31,
      interestCoverageRatio: 30.0,
      anomalyScore: 5,
      beta: 1.02,
    },
    healthScore: 95,
    governanceScore: 93,
  },
  {
    id: 'nicico',
    name: 'ملی صنایع مس ایران',
    englishName: 'National Iranian Copper Industries',
    ticker: 'فملی',
    sector: 'استخراج کانه‌های فلزی',
    sectorEng: 'Mining & Metals',
    financialData: {
      revenue: 28500,
      netProfit: 13200,
      totalAssets: 48000,
      totalLiabilities: 12000,
      currentAssets: 21000,
      currentLiabilities: 9000,
      operatingCashFlow: 11500,
      rAndDExpenses: 150,
      retainedEarnings: 18000,
      stockEquity: 36000,
    },
    governanceData: {
      boardMembersCount: 5,
      independentDirectorsRatio: 0.40,
      boardMeetingsCount: 22,
      attendanceRate: 0.94,
      transparencyScore: 88,
      auditQualityRating: 'A',
      shareholderDisputesCount: 0,
    },
    esgData: {
      environmentalScore: 76,
      carbonEmissionsLevel: 'High',
      socialScore: 84,
      laborStandardsCompliance: true,
      governanceScore: 86,
      totalEsgScore: 81,
    },
    riskMetrics: {
      altmanZScore: 3.48,
      bankruptcyRisk: 'Very Low',
      debtToEquity: 0.333,
      currentRatio: 2.33,
      interestCoverageRatio: 24.5,
      anomalyScore: 8,
      beta: 1.12,
    },
    healthScore: 91,
    governanceScore: 89,
  },
  {
    id: 'msc-steel',
    name: 'فولاد مبارکه اصفهان',
    englishName: 'Mobarakeh Steel Company',
    ticker: 'فولاد',
    sector: 'فلزات اساسی',
    sectorEng: 'Heavy Industries',
    financialData: {
      revenue: 39000,
      netProfit: 16800,
      totalAssets: 65000,
      totalLiabilities: 18000,
      currentAssets: 28000,
      currentLiabilities: 14000,
      operatingCashFlow: 14800,
      rAndDExpenses: 220,
      retainedEarnings: 24000,
      stockEquity: 47000,
    },
    governanceData: {
      boardMembersCount: 7,
      independentDirectorsRatio: 0.43,
      boardMeetingsCount: 24,
      attendanceRate: 0.95,
      transparencyScore: 90,
      auditQualityRating: 'A',
      shareholderDisputesCount: 1,
    },
    esgData: {
      environmentalScore: 72,
      carbonEmissionsLevel: 'High',
      socialScore: 85,
      laborStandardsCompliance: true,
      governanceScore: 88,
      totalEsgScore: 80,
    },
    riskMetrics: {
      altmanZScore: 3.12,
      bankruptcyRisk: 'Very Low',
      debtToEquity: 0.383,
      currentRatio: 2.0,
      interestCoverageRatio: 18.5,
      anomalyScore: 12,
      beta: 1.18,
    },
    healthScore: 89,
    governanceScore: 87,
  },
  {
    id: 'behshahr-group',
    name: 'توسعه صنایع بهشهر',
    englishName: 'Behshahr Industrial Group',
    ticker: 'وبشهر',
    sector: 'غذایی بجز قند و شکر',
    sectorEng: 'Consumer Goods',
    financialData: {
      revenue: 4200,
      netProfit: 480,
      totalAssets: 5500,
      totalLiabilities: 3200,
      currentAssets: 2800,
      currentLiabilities: 2400,
      operatingCashFlow: 350,
      rAndDExpenses: 40,
      retainedEarnings: 850,
      stockEquity: 2300,
    },
    governanceData: {
      boardMembersCount: 5,
      independentDirectorsRatio: 0.20,
      boardMeetingsCount: 18,
      attendanceRate: 0.89,
      transparencyScore: 78,
      auditQualityRating: 'B',
      shareholderDisputesCount: 2,
    },
    esgData: {
      environmentalScore: 82,
      carbonEmissionsLevel: 'Low',
      socialScore: 79,
      laborStandardsCompliance: true,
      governanceScore: 75,
      totalEsgScore: 78,
    },
    riskMetrics: {
      altmanZScore: 1.85,
      bankruptcyRisk: 'Low',
      debtToEquity: 1.39,
      currentRatio: 1.17,
      interestCoverageRatio: 2.9,
      anomalyScore: 24,
      beta: 0.82,
    },
    healthScore: 70,
    governanceScore: 74,
  }
];

// Preloaded executive recommendations
export const DEFAULT_RECOMMENDATIONS: AIRecommendation[] = [
  {
    id: 'rec-1',
    companyId: 'siman-sepehr',
    companyName: 'سیمان سپهر کویر',
    type: 'RESTRUCTURING',
    title: 'Urgent Board Restructuring Recommended',
    titleFa: 'توصیه اضطراری برای بازسازی هیئت مدیره',
    description: 'Governance score has fallen to 50 due to an independent director ratio of only 14% and poor board attendance (82%). Consider replacing inactive members with independent financial directors.',
    descriptionFa: 'امتیاز حاکمیت شرکتی به دلیل نسبت پایین اعضای مستقل (۱۴٪) و نرخ ضعیف حضور در جلسات (۸۲٪) به ۵۰ سقوط کرده است. پیشنهاد می‌شود اعضای غیرفعال با مدیران مالی مستقل جایگزین شوند.',
    severity: 'high',
    impactPercent: 18,
    date: '2026-06-28',
  },
  {
    id: 'rec-2',
    companyId: 'siman-sepehr',
    companyName: 'سیمان سپهر کویر',
    type: 'CAPITAL_ALLOCATION',
    title: 'Debt Refinancing & Working Capital Infusion',
    titleFa: 'تأمین مالی مجدد بدهی‌ها و تزریق سرمایه در گردش',
    description: 'Current Ratio is critically low at 0.61 (under the Balanced threshold of 1.20). Severe bankruptcy risk is flagged. Initiate equity issuance or negotiate long-term debt replacement to secure current operations.',
    descriptionFa: 'نسبت جاری به شدت در سطح بحرانی ۰.۶۱ (کمتر از حد مجاز ۱.۲۰) قرار دارد. هشدار ریسک شدید ورشکستگی صادر شده است. پیشنهاد می‌شود افزایش سرمایه از آورده نقدی یا تجدید ارزیابی دارایی‌ها اجرا گردد.',
    severity: 'high',
    impactPercent: 24,
    date: '2026-06-29',
  },
  {
    id: 'rec-3',
    companyId: 'petro-sepahan',
    companyName: 'پتروشیمی سپاهان انرژی',
    type: 'RISK_ALERT',
    title: 'Fx Volatility Hedging Advisory',
    titleFa: 'توصیه هجینگ نوسانات نرخ ارز',
    description: 'With revenues exceeding 2,950 Billion Tomans tied heavily to global product benchmarks, implement forward exchange contracts to safeguard profit margins from currency fluctuations.',
    descriptionFa: 'با درآمدهای بیش از ۲,۹۵۰ میلیارد تومان که به نرخ‌های جهانی وابسته است، انعقاب قراردادهای سلف ارزی برای محافظت از حاشیه سود در برابر نوسانات ارزی اکیداً توصیه می‌شود.',
    severity: 'medium',
    impactPercent: 12,
    date: '2026-06-30',
  },
  {
    id: 'rec-4',
    companyId: 'amin-it',
    companyName: 'توسعه فناوری اطلاعات امین',
    type: 'ESG_IMPROVEMENT',
    title: 'Capital Expansion & Growth Funding',
    titleFa: 'توسعه سرمایه و تأمین مالی پروژه‌های نوآوری',
    description: 'Amin IT boasts a stellar Z-score of 4.88 and 96% Health. Reallocate excess capital from Cement Sepehr Kavir toward Amin IT to expedite AI and blockchain R&D infrastructure.',
    descriptionFa: 'فناوری اطلاعات امین از امتیاز سلامت عالی ۹۶٪ و شاخص Z آلتمن ۴.۸۸ بهره‌مند است. توصیه می‌شود سرمایه‌های مازاد هلدینگ را به سمت این شرکت جهت تسریع توسعه زیرساخت‌های هوش مصنوعی هدایت کنید.',
    severity: 'medium',
    impactPercent: 35,
    date: '2026-06-30',
  }
];

// Preloaded mock board meetings
export const DEFAULT_MEETINGS: BoardResolutionSimulation[] = [
  {
    id: 'meet-1',
    title: 'سند راهبردی تأمین سرمایه سیمان سپهر',
    agenda: 'بررسی راهکارهای خروج از بحران سرمایه در گردش و افزایش حد اعتباری',
    status: 'Approved',
    date: '2026-06-15',
    transcript: 'رئیس جلسه بیان داشت که سیمان سپهر کویر با بدهی‌های کوتاه مدت معادل ۷۹۰ میلیارد تومان مواجه است. مدیرعامل پیشنهاد فروش بخشی از دارایی‌های غیرمولد کویر را مطرح کرد. پس از بحث و تبادل نظر، هیئت مدیره با فروش زمین‌های بخش غربی و بازپرداخت ۲۰۰ میلیارد تومان از بدهی‌های بانکی موافقت نمود.',
    aiReview: 'تحلیل هوش مصنوعی: اقدام مثبت جهت بهبود نسبت جاری از ۰.۶۱ به حدود ۰.۸۵. با این حال، مشکل اساسی بهای تمام شده بالای سوخت و نهاده‌های تولید همچنان پابرجا خواهد بود. پیشنهاد می‌شود فرآیند بهینه‌سازی خطوط تولید کلینکر نیز همزمان آغاز شود.'
  },
  {
    id: 'meet-2',
    title: 'طرح توسعه صادرات پتروشیمی سپاهان',
    agenda: 'احداث اسکله اختصاصی صادرات محصولات مایع پتروشیمی در سواحل جنوبی',
    status: 'Deferred',
    date: '2026-06-22',
    transcript: 'مدیر فنی پتروشیمی گزارش توجیهی پروژه احداث اسکله را با پیش‌بینی سرمایه‌گذاری ۵۰۰ میلیارد تومانی ارائه داد. نماینده هلدینگ سپه پیشنهاد کرد با توجه به ریسک افزایش نرخ بهره بین‌بانکی، تأمین مالی ابتدا به صورت انتشار اوراق سلف ارزی بررسی شود و مصوبه نهایی به ماه آینده موکول گردد.',
    aiReview: 'تحلیل هوش مصنوعی: تاخیر عاقلانه. با توجه به بتای بالا (۱.۱۵) و حساسیت شدید پتروشیمی به نوسانات جهانی، تامین مالی ریالی مستقیم در این مقطع ریسک بهره را تشدید می‌کرد. انتشار اوراق مرابحه ارزی بهترین جایگزین پیشنهادی است.'
  }
];

// Generate CSV template content for download
export function generateCSVTemplate(): string {
  const headers = [
    'CompanyId', 'PersianName', 'EnglishName', 'Ticker', 'Sector', 'SectorEng',
    'Revenue', 'NetProfit', 'TotalAssets', 'TotalLiabilities', 'CurrentAssets',
    'CurrentLiabilities', 'OperatingCashFlow', 'RAndDExpenses', 'RetainedEarnings', 'StockEquity',
    'BoardMembersCount', 'IndependentDirectorsRatio', 'BoardMeetingsCount', 'AttendanceRate',
    'TransparencyScore', 'AuditQualityRating', 'ShareholderDisputesCount',
    'EnvironmentalScore', 'CarbonEmissionsLevel', 'SocialScore', 'LaborStandardsCompliance',
    'EsgGovernanceScore', 'Beta'
  ];
  
  const sampleRow = [
    'new-company', 'فولاد سپهر البرز', 'Alborz Sepehr Steel', 'فالبرز', 'فلزات اساسی', 'Heavy Industries',
    '1500', '320', '2500', '900', '1100', '650', '280', '15', '450', '1600',
    '5', '0.4', '18', '0.92', '80', 'A', '1',
    '65', 'Medium', '78', 'TRUE', '80', '1.1'
  ];

  return [headers.join(','), sampleRow.join(',')].join('\n');
}

// Simple CSV parser for newly uploaded company data
export function parseCSVCompanyData(csvText: string, currentThresholds: RiskThresholds): Subsidiary[] {
  const lines = csvText.trim().split('\n');
  if (lines.length <= 1) return [];

  const headers = lines[0].split(',').map(h => h.trim());
  const subsidiaries: Subsidiary[] = [];

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i]) continue;
    const values = lines[i].split(',').map(v => v.trim());
    
    // Create mapping helper
    const getVal = (headerName: string, fallback: string = '') => {
      const idx = headers.indexOf(headerName);
      return idx !== -1 && values[idx] !== undefined ? values[idx] : fallback;
    };

    const id = getVal('CompanyId', `uploaded-${Date.now()}-${i}`);
    const name = getVal('PersianName', 'شرکت جدید سپه');
    const englishName = getVal('EnglishName', 'New Subsidiary Corp');
    const ticker = getVal('Ticker', 'جدید');
    const sector = getVal('Sector', 'سایر صنایع');
    const sectorEng = getVal('SectorEng', 'Other Sectors');

    const revenue = parseFloat(getVal('Revenue', '500'));
    const netProfit = parseFloat(getVal('NetProfit', '50'));
    const totalAssets = parseFloat(getVal('TotalAssets', '1000'));
    const totalLiabilities = parseFloat(getVal('TotalLiabilities', '400'));
    const currentAssets = parseFloat(getVal('CurrentAssets', '500'));
    const currentLiabilities = parseFloat(getVal('CurrentLiabilities', '300'));
    const operatingCashFlow = parseFloat(getVal('OperatingCashFlow', '80'));
    const rAndDExpenses = parseFloat(getVal('RAndDExpenses', '10'));
    const retainedEarnings = parseFloat(getVal('RetainedEarnings', '150'));
    const stockEquity = parseFloat(getVal('StockEquity', '600'));

    const boardMembersCount = parseInt(getVal('BoardMembersCount', '5'));
    const independentDirectorsRatio = parseFloat(getVal('IndependentDirectorsRatio', '0.2'));
    const boardMeetingsCount = parseInt(getVal('BoardMeetingsCount', '12'));
    const attendanceRate = parseFloat(getVal('AttendanceRate', '0.90'));
    const transparencyScore = parseInt(getVal('TransparencyScore', '75'));
    const auditQualityRating = getVal('AuditQualityRating', 'B') as 'A' | 'B' | 'C' | 'D';
    const shareholderDisputesCount = parseInt(getVal('ShareholderDisputesCount', '0'));

    const environmentalScore = parseInt(getVal('EnvironmentalScore', '70'));
    const carbonEmissionsLevel = getVal('CarbonEmissionsLevel', 'Medium') as 'Low' | 'Medium' | 'High';
    const socialScore = parseInt(getVal('SocialScore', '70'));
    const laborStandardsCompliance = getVal('LaborStandardsCompliance', 'TRUE').toUpperCase() === 'TRUE';
    const esgGovernanceScore = parseInt(getVal('EsgGovernanceScore', '75'));

    const beta = parseFloat(getVal('Beta', '1.0'));

    const financialData = {
      revenue, netProfit, totalAssets, totalLiabilities, currentAssets,
      currentLiabilities, operatingCashFlow, rAndDExpenses, retainedEarnings, stockEquity
    };

    const governanceData = {
      boardMembersCount, independentDirectorsRatio, boardMeetingsCount, attendanceRate,
      transparencyScore, auditQualityRating, shareholderDisputesCount
    };

    const esgData = {
      environmentalScore, carbonEmissionsLevel, socialScore, laborStandardsCompliance,
      governanceScore: esgGovernanceScore,
      totalEsgScore: Math.round((environmentalScore + socialScore + esgGovernanceScore) / 3)
    };

    const zCalc = calculateAltmanZScore(
      currentAssets, currentLiabilities, totalAssets, retainedEarnings, netProfit, stockEquity, revenue, totalLiabilities
    );

    const debtToEquity = stockEquity > 0 ? totalLiabilities / stockEquity : 0;
    const currentRatio = currentLiabilities > 0 ? currentAssets / currentLiabilities : 1;
    const interestCoverageRatio = netProfit > 0 ? (netProfit * 1.15) / (totalLiabilities * 0.05 + 1) : 1; // estimate
    const anomalyScore = Math.round(Math.random() * 25 + 5);

    const riskMetrics = {
      altmanZScore: zCalc.zScore,
      bankruptcyRisk: zCalc.risk,
      debtToEquity,
      currentRatio,
      interestCoverageRatio,
      anomalyScore,
      beta
    };

    const subPartial: Partial<Subsidiary> = {
      id, name, englishName, ticker, sector, sectorEng, financialData, governanceData, esgData, riskMetrics
    };

    const { healthScore, governanceScore } = calculateScores(subPartial as any, currentThresholds);

    subsidiaries.push({
      ...(subPartial as Subsidiary),
      healthScore,
      governanceScore
    });
  }

  return subsidiaries;
}
