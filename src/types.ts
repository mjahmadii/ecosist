export interface FinancialData {
  revenue: number; // in Billion Tomans / IRR (we'll display as Billion Tomans)
  netProfit: number;
  totalAssets: number;
  totalLiabilities: number;
  currentAssets: number;
  currentLiabilities: number;
  operatingCashFlow: number;
  rAndDExpenses: number;
  retainedEarnings: number;
  stockEquity: number;
}

export interface GovernanceData {
  boardMembersCount: number;
  independentDirectorsRatio: number; // e.g., 0.4 for 40%
  boardMeetingsCount: number;
  attendanceRate: number; // e.g., 0.95 for 95%
  transparencyScore: number; // 1 to 100
  auditQualityRating: 'A' | 'B' | 'C' | 'D';
  shareholderDisputesCount: number;
}

export interface ESGData {
  environmentalScore: number; // 1 to 100
  carbonEmissionsLevel: 'Low' | 'Medium' | 'High';
  socialScore: number; // 1 to 100
  laborStandardsCompliance: boolean;
  governanceScore: number; // 1 to 100
  totalEsgScore: number; // 1 to 100
}

export interface RiskMetrics {
  altmanZScore: number;
  bankruptcyRisk: 'Very Low' | 'Low' | 'Moderate' | 'High' | 'Severe';
  debtToEquity: number;
  currentRatio: number;
  interestCoverageRatio: number;
  anomalyScore: number; // 1 to 100 (Market Anomaly Score)
  beta: number; // Sensitivity to market
}

export interface Subsidiary {
  id: string;
  name: string; // Persian Name
  englishName: string;
  ticker: string; // Farsi ticker code
  sector: string; // Persian Sector Name
  sectorEng: string;
  financialData: FinancialData;
  governanceData: GovernanceData;
  esgData: ESGData;
  riskMetrics: RiskMetrics;
  healthScore: number; // computed 1 to 100
  governanceScore: number; // computed 1 to 100
}

export type RiskPersona = 'CONSERVATIVE' | 'BALANCED' | 'AGGRESSIVE';

export interface RiskThresholds {
  maxDebtToEquity: number;
  minCurrentRatio: number;
  minTransparencyScore: number;
  minAttendanceRate: number;
  minEsgScore: number;
}

export interface AIRecommendation {
  id: string;
  companyId: string;
  companyName: string;
  type: 'CAPITAL_ALLOCATION' | 'GOVERNANCE' | 'RESTRUCTURING' | 'RISK_ALERT' | 'ESG_IMPROVEMENT';
  title: string;
  titleFa: string;
  description: string;
  descriptionFa: string;
  severity: 'low' | 'medium' | 'high';
  impactPercent: number; // expected return or improvement impact
  date: string;
}

export interface BoardResolutionSimulation {
  id: string;
  title: string;
  agenda: string;
  transcript: string;
  status: 'Approved' | 'Rejected' | 'Deferred';
  aiReview: string;
  date: string;
  category?: string;
  attendanceProfile?: string;
  voteBreakdown?: { yes: number; no: number; abstain: number };
}
