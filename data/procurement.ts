import type { ProcessingStep, ProcurementScenario } from "@/types/procurement";

export const processingSteps: ProcessingStep[] = [
  {
    title: "Extracting documents",
    description: "Parsing quotes, contract language, SLAs, and pricing tables."
  },
  {
    title: "Evaluating pricing",
    description: "Normalizing one-time fees, committed spend, and three-year TCO."
  },
  {
    title: "Assessing risks",
    description: "Reviewing liability caps, renewal windows, termination rights, and SLA credits."
  },
  {
    title: "Detecting hidden costs",
    description: "Flagging implementation, overage, data egress, and support escalation fees."
  },
  {
    title: "Generating recommendation",
    description: "Combining cost, risk, flexibility, and terms into an executive decision."
  }
];

export const procurementScenario: ProcurementScenario = {
  title: "Global analytics infrastructure procurement",
  buyer: "Northstar BioSystems",
  category: "Cloud data platform",
  scoringWeights: {
    cost: 35,
    risk: 25,
    flexibility: 20,
    terms: 20
  },
  recommendedVendorId: "apexcloud",
  savingsEstimate: 318000,
  executiveSummary:
    "ApexCloud Solutions offers the strongest risk-adjusted commercial package: a competitive three-year cost, flexible renewal language, capped implementation fees, and the clearest path to reduce committed spend if usage forecasts change.",
  vendors: [
    {
      id: "apexcloud",
      name: "ApexCloud Solutions",
      tagline: "Enterprise cloud analytics with flexible expansion rights",
      documentName: "ApexCloud-MSA-Quote-2026.pdf",
      annualContractValue: 742000,
      threeYearCost: 2268000,
      hiddenCostExposure: 68000,
      riskLevel: "Low",
      decisionScore: 91.4,
      confidence: 94,
      scoreBreakdown: {
        cost: 88,
        risk: 94,
        flexibility: 92,
        terms: 93
      },
      strengths: [
        "Best combined cost and contract flexibility after implementation credits.",
        "Includes a 24-month price lock with usage true-down rights after year one.",
        "Liability cap is 2x annual fees and data processing terms are already aligned."
      ],
      risks: [
        "Premium support response times require the enterprise tier after 500 users.",
        "Professional services credits expire if not used within 120 days."
      ],
      hiddenCosts: [
        "$38K optional security review package becomes required for regulated workloads.",
        "$30K reserved for data migration support if internal team misses kickoff window."
      ],
      negotiationSuggestions: [
        "Ask to extend professional services credit expiration from 120 to 240 days.",
        "Request premium support inclusion for the first contract year.",
        "Convert implementation credits into a non-expiring service wallet."
      ],
      executiveReasoning:
        "ApexCloud wins because it avoids the worst procurement traps: no aggressive auto-renewal, limited overage exposure, and a balanced pricing model that preserves leverage after the first year."
    },
    {
      id: "nimbus",
      name: "Nimbus Procurement",
      tagline: "Low headline price with procurement workflow bundling",
      documentName: "Nimbus-Commercial-Proposal.pdf",
      annualContractValue: 698000,
      threeYearCost: 2386000,
      hiddenCostExposure: 214000,
      riskLevel: "Medium",
      decisionScore: 79.1,
      confidence: 87,
      scoreBreakdown: {
        cost: 91,
        risk: 70,
        flexibility: 76,
        terms: 73
      },
      strengths: [
        "Lowest first-year subscription cost before add-ons.",
        "Strong procurement workflow features and bundled supplier onboarding.",
        "Includes quarterly business reviews at no additional charge."
      ],
      risks: [
        "Auto-renewal requires cancellation 120 days before term end.",
        "Usage overage pricing is uncapped and escalates after 15% growth.",
        "Termination for convenience requires payment of 60% remaining contract value."
      ],
      hiddenCosts: [
        "$96K estimated API overages based on current integration volume.",
        "$72K required supplier network activation package.",
        "$46K data export fee if the company exits after year two."
      ],
      negotiationSuggestions: [
        "Cap API overages at 10% of annual contract value.",
        "Reduce cancellation notice from 120 days to 60 days.",
        "Remove exit data export fees for standard formats."
      ],
      executiveReasoning:
        "Nimbus looks cheaper on the first page, but its overage schedule and renewal mechanics materially reduce buyer leverage. It is a viable fallback only if those terms are renegotiated."
    },
    {
      id: "vertex",
      name: "Vertex Enterprise Systems",
      tagline: "Legacy enterprise suite with mature controls",
      documentName: "Vertex-Enterprise-Agreement.pdf",
      annualContractValue: 881000,
      threeYearCost: 2654000,
      hiddenCostExposure: 142000,
      riskLevel: "Medium",
      decisionScore: 73.8,
      confidence: 82,
      scoreBreakdown: {
        cost: 68,
        risk: 82,
        flexibility: 69,
        terms: 78
      },
      strengths: [
        "Most mature compliance controls and audit evidence package.",
        "Service credits are explicit and measurable.",
        "Security addendum includes strong breach notification timelines."
      ],
      risks: [
        "Highest total cost of ownership across all evaluated vendors.",
        "Three-year committed seat floor prevents spend reduction.",
        "Custom reporting requires paid services for any schema changes."
      ],
      hiddenCosts: [
        "$84K report customization retainer for executive dashboards.",
        "$58K sandbox environment fee for procurement and security testing."
      ],
      negotiationSuggestions: [
        "Request a 15% concession in year two and year three subscriptions.",
        "Replace committed seat floor with annual consumption bands.",
        "Bundle two sandbox environments into the base subscription."
      ],
      executiveReasoning:
        "Vertex is defensible for heavily regulated teams, but the contract is structured like a legacy enterprise purchase. It creates the highest spend commitment with limited room to adapt."
    }
  ]
};
