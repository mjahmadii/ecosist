export type RiskPersona = 'conservative' | 'balanced' | 'aggressive';

export type GovernanceStatus = 'excellent' | 'good' | 'warning' | 'critical';

export type IndustrySector =
  | 'banking'
  | 'realestate'
  | 'manufacturing'
  | 'energy'
  | 'technology'
  | 'insurance'
  | 'leasing'
  | 'petrochemical'
  | 'mining'
  | 'healthcare';

export interface FinancialData {
  year: number;
  revenue: number;
  netIncome: number;
  totalAssets: number;
  totalLiabilities: number;
  equity: number;
  operatingCashFlow: number;
  ebitda: number;
  grossProfit: number;
  currentAssets: number;
  currentLiabilities: number;
  retainedEarnings: number;
  intangibleAssets: number;
  workingCapital: number;
  marketCap?: number;
}

export interface GovernanceMetrics {
  boardIndependence: number;
  auditQuality: number;
  disclosureScore: number;
  shareholderRights: number;
  riskManagement: number;
  executiveCompensation: number;
  boardMeetingAttendance: number;
  ceoTenureYears: number;
  boardSize: number;
  independentDirectors: number;
  femaleDirectors: number;
}

export interface ESGMetrics {
  environmental: {
    carbonEmissions: number;
    energyEfficiency: number;
    wasteManagement: number;
    waterUsage: number;
    greenCertifications: number;
  };
  social: {
    employeeSatisfaction: number;
    genderDiversityRatio: number;
    communityInvestment: number;
    humanRightsScore: number;
    trainingHoursPerEmployee: number;
  };
  governance: {
    transparencyScore: number;
    anticorruptionMeasures: number;
    whistleblowerPolicy: number;
    taxTransparency: number;
    lobbyingDisclosure: number;
  };
  overallScore: number;
  rating: 'AAA' | 'AA' | 'A' | 'BBB' | 'BB' | 'B' | 'CCC';
}

export interface AltmanZScore {
  x1: number;
  x2: number;
  x3: number;
  x4: number;
  x5: number;
  zScore: number;
  bankruptcyRisk: 'safe' | 'grey' | 'distress';
  bankruptcyProbability: number;
}

export interface Subsidiary {
  id: string;
  name: string;
  nameEn: string;
  sector: IndustrySector;
  foundedYear: number;
  ceo: string;
  headquarters: string;
  employeeCount: number;
  ownershipPercentage: number;
  stockSymbol?: string;
  isListed: boolean;
  financials: FinancialData[];
  governance: GovernanceMetrics;
  esg: ESGMetrics;
  financialScore: number;
  governanceScore: number;
  overallScore: number;
  status: GovernanceStatus;
  altmanZ: AltmanZScore;
  boardMembers: BoardMember[];
  recentEvents: CompanyEvent[];
  alerts: Alert[];
}

export interface BoardMember {
  id: string;
  name: string;
  role: string;
  independent: boolean;
  tenureYears: number;
  attendanceRate: number;
  expertise: string[];
}

export interface CompanyEvent {
  id: string;
  date: string;
  type: 'regulatory' | 'financial' | 'governance' | 'strategic' | 'risk';
  title: string;
  description: string;
  impact: 'positive' | 'negative' | 'neutral';
}

export interface Alert {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  category: 'financial' | 'governance' | 'compliance' | 'market' | 'esg';
  title: string;
  description: string;
  timestamp: string;
  acknowledged: boolean;
}

export interface HoldingCompany {
  id: string;
  name: string;
  nameEn: string;
  logo?: string;
  established: number;
  totalAssets: number;
  totalRevenue: number;
  totalNetIncome: number;
  subsidiaries: Subsidiary[];
  portfolioSummary: PortfolioSummary;
}

export interface PortfolioSummary {
  totalSubsidiaries: number;
  profitableSubsidiaries: number;
  avgFinancialScore: number;
  avgGovernanceScore: number;
  avgESGScore: number;
  totalMarketValue: number;
  sectorAllocation: Record<IndustrySector, number>;
  performanceTrend: { month: string; value: number }[];
  riskDistribution: { level: string; count: number }[];
}

export interface AIRecommendation {
  id: string;
  type: 'strategic' | 'operational' | 'financial' | 'governance' | 'risk';
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  impactedSubsidiaries: string[];
  estimatedImpact: string;
  timeframe: string;
  confidence: number;
  generatedAt: string;
  actions: string[];
  isAIGenerated: boolean;
}

export interface MarketAnomaly {
  id: string;
  subsidiaryId: string;
  subsidiaryName: string;
  type: 'volume_spike' | 'price_deviation' | 'volatility_surge' | 'correlation_break';
  detectedAt: string;
  severity: 'high' | 'medium' | 'low';
  description: string;
  baseline: number;
  current: number;
  deviation: number;
}

export interface CapitalAllocationScenario {
  id: string;
  name: string;
  description: string;
  allocations: { subsidiaryId: string; amount: number; percentage: number }[];
  expectedReturn: number;
  risk: number;
  sharpeRatio: number;
}

export interface AppSettings {
  riskPersona: RiskPersona;
  thresholds: {
    maxDebtRatio: number;
    minCurrentRatio: number;
    minGovernanceScore: number;
    minFinancialScore: number;
    minESGScore: number;
    maxBankruptcyProbability: number;
  };
  notifications: {
    email: boolean;
    alertThreshold: 'critical' | 'warning' | 'info';
  };
  displayCurrency: 'IRR' | 'USD' | 'EUR';
  language: 'fa' | 'en';
  aiModel: string;
}

export interface AppState {
  isAuthenticated: boolean;
  apiKeyConfigured: boolean;
  apiKey: string;
  aiProvider: 'openai' | 'anthropic' | 'gemini';
  holdingData: HoldingCompany | null;
  settings: AppSettings;
  recommendations: AIRecommendation[];
  marketAnomalies: MarketAnomaly[];
  capitalScenarios: CapitalAllocationScenario[];
  activeView: string;
  selectedSubsidiary: Subsidiary | null;
  isLoading: boolean;
  chatMessages: ChatMessage[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  isStreaming?: boolean;
  moduleContext?: string;
}

export type Theme = 'dark' | 'light';

export interface SystemPrompt {
  id: string;
  moduleId: string;
  moduleName: string;
  description: string;
  prompt: string;
  isDefault?: boolean;
  lastModified: string;
}

export interface ImportValidationError {
  row: number;
  column: string;
  message: string;
}

export interface ImportResult {
  success: boolean;
  errors: ImportValidationError[];
  warnings: string[];
  rowsImported: number;
}

export interface ModuleChatSession {
  moduleId: string;
  messages: ChatMessage[];
}

export interface ExportOptions {
  format: 'xlsx' | 'csv' | 'pdf' | 'json';
  filename?: string;
  includeCharts?: boolean;
}
