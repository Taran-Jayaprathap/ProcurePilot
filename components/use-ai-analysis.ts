"use client";

import { useEffect, useState } from "react";

import { procurementScenario } from "@/data/procurement";
import { getRecommendedVendor } from "@/lib/scoring";
import type { AiAnalysisResult } from "@/types/ai";

const fallbackVendor = getRecommendedVendor(procurementScenario.vendors);

const fallbackAnalysis: AiAnalysisResult = {
  source: "demo",
  recommendedVendorId: fallbackVendor.id,
  confidence: fallbackVendor.confidence,
  savingsEstimate: procurementScenario.savingsEstimate,
  executiveSummary: procurementScenario.executiveSummary,
  reasoning: fallbackVendor.executiveReasoning,
  decisionMemo:
    "Approve ApexCloud Solutions as the preferred vendor, subject to support inclusion and extended services-credit expiration. The quote provides the strongest risk-adjusted value while preserving future leverage.",
  negotiationPriorities: fallbackVendor.negotiationSuggestions,
  riskWatchlist: fallbackVendor.risks
};

export function useAiAnalysis() {
  const [analysis, setAnalysis] = useState<AiAnalysisResult>(fallbackAnalysis);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    async function runAnalysis() {
      try {
        const response = await fetch("/api/analyze", {
          method: "POST",
          signal: controller.signal
        });

        if (!response.ok) {
          throw new Error("Unable to generate procurement analysis");
        }

        const result = (await response.json()) as AiAnalysisResult;
        setAnalysis(result);
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error(error);
          setAnalysis(fallbackAnalysis);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    runAnalysis();

    return () => controller.abort();
  }, []);

  return {
    analysis,
    isLoading,
    isLive: analysis.source === "openai"
  };
}
