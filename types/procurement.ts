export type RiskLevel = "Low" | "Medium" | "High";

export type ProcessingStepStatus = "waiting" | "active" | "complete";

export type ScoreBreakdown = {
  cost: number;
  risk: number;
  flexibility: number;
  terms: number;
};

export type VendorEvaluation = {
  id: string;
  name: string;
  tagline: string;
  documentName: string;
  annualContractValue: number;
  threeYearCost: number;
  hiddenCostExposure: number;
  riskLevel: RiskLevel;
  decisionScore: number;
  confidence: number;
  scoreBreakdown: ScoreBreakdown;
  strengths: string[];
  risks: string[];
  hiddenCosts: string[];
  negotiationSuggestions: string[];
  executiveReasoning: string;
};

export type ProcessingStep = {
  title: string;
  description: string;
};

export type ProcurementScenario = {
  title: string;
  buyer: string;
  category: string;
  scoringWeights: ScoreBreakdown;
  vendors: VendorEvaluation[];
  recommendedVendorId: string;
  savingsEstimate: number;
  executiveSummary: string;
};
