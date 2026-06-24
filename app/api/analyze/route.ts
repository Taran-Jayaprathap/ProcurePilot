import { NextResponse } from "next/server";
import OpenAI from "openai";

import { procurementScenario } from "@/data/procurement";
import { getRecommendedVendor } from "@/lib/scoring";
import type { AiAnalysisResult } from "@/types/ai";

export const runtime = "nodejs";

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

function asStringArray(value: unknown, fallback: string[]) {
  if (!Array.isArray(value)) {
    return fallback;
  }

  const strings = value.filter((item): item is string => typeof item === "string");
  return strings.length > 0 ? strings.slice(0, 5) : fallback;
}

function normalizeAnalysis(value: unknown): AiAnalysisResult {
  if (!value || typeof value !== "object") {
    return fallbackAnalysis;
  }

  const record = value as Record<string, unknown>;
  const vendorIds = procurementScenario.vendors.map((vendor) => vendor.id);
  const recommendedVendorId =
    typeof record.recommendedVendorId === "string" &&
    vendorIds.includes(record.recommendedVendorId)
      ? record.recommendedVendorId
      : fallbackAnalysis.recommendedVendorId;

  const confidence =
    typeof record.confidence === "number" && Number.isFinite(record.confidence)
      ? Math.min(Math.max(Math.round(record.confidence), 70), 99)
      : fallbackAnalysis.confidence;

  const savingsEstimate =
    typeof record.savingsEstimate === "number" &&
    Number.isFinite(record.savingsEstimate)
      ? Math.max(Math.round(record.savingsEstimate), 0)
      : fallbackAnalysis.savingsEstimate;

  return {
    source: "openai",
    recommendedVendorId,
    confidence,
    savingsEstimate,
    executiveSummary:
      typeof record.executiveSummary === "string" && record.executiveSummary.length > 40
        ? record.executiveSummary
        : fallbackAnalysis.executiveSummary,
    reasoning:
      typeof record.reasoning === "string" && record.reasoning.length > 40
        ? record.reasoning
        : fallbackAnalysis.reasoning,
    decisionMemo:
      typeof record.decisionMemo === "string" && record.decisionMemo.length > 40
        ? record.decisionMemo
        : fallbackAnalysis.decisionMemo,
    negotiationPriorities: asStringArray(
      record.negotiationPriorities,
      fallbackAnalysis.negotiationPriorities
    ),
    riskWatchlist: asStringArray(record.riskWatchlist, fallbackAnalysis.riskWatchlist)
  };
}

export async function POST() {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(fallbackAnalysis);
  }

  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are ProcurePilot, an expert AI procurement analyst. Return only valid JSON that matches the requested schema. Be concise, executive-ready, and commercially specific."
        },
        {
          role: "user",
          content: JSON.stringify({
            task:
              "Analyze this procurement scenario and recommend the best vendor using weights cost 35%, risk 25%, flexibility 20%, terms 20%.",
            requiredJsonShape: {
              recommendedVendorId: "one of apexcloud, nimbus, vertex",
              confidence: "number from 70 to 99",
              savingsEstimate: "number in USD",
              executiveSummary: "2 sentence board-ready summary",
              reasoning: "why the recommended vendor wins",
              decisionMemo: "approval memo for executives",
              negotiationPriorities: ["3 to 5 concrete asks"],
              riskWatchlist: ["2 to 5 risks to monitor"]
            },
            scenario: procurementScenario
          })
        }
      ]
    });

    const content = response.choices[0]?.message.content;
    if (!content) {
      return NextResponse.json(fallbackAnalysis);
    }

    return NextResponse.json(normalizeAnalysis(JSON.parse(content)));
  } catch (error) {
    console.error("OpenAI procurement analysis failed", error);
    return NextResponse.json(fallbackAnalysis, { status: 200 });
  }
}
