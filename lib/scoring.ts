import type { ScoreBreakdown, VendorEvaluation } from "@/types/procurement";

export function calculateWeightedScore(
  breakdown: ScoreBreakdown,
  weights: ScoreBreakdown
) {
  const total =
    breakdown.cost * weights.cost +
    breakdown.risk * weights.risk +
    breakdown.flexibility * weights.flexibility +
    breakdown.terms * weights.terms;

  return Number((total / 100).toFixed(1));
}

export function getRecommendedVendor(vendors: VendorEvaluation[]) {
  return [...vendors].sort((a, b) => b.decisionScore - a.decisionScore)[0];
}

export function getAverageDecisionScore(vendors: VendorEvaluation[]) {
  const total = vendors.reduce((sum, vendor) => sum + vendor.decisionScore, 0);
  return Number((total / vendors.length).toFixed(1));
}
