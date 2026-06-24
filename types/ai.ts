export type AiAnalysisSource = "openai" | "demo";

export type AiAnalysisResult = {
  source: AiAnalysisSource;
  recommendedVendorId: string;
  confidence: number;
  savingsEstimate: number;
  executiveSummary: string;
  reasoning: string;
  decisionMemo: string;
  negotiationPriorities: string[];
  riskWatchlist: string[];
};
