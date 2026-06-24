"use client";

import { motion } from "framer-motion";
import {
  ArrowLeftRight,
  CheckCircle2,
  Download,
  Medal,
  ShieldCheck,
  Sparkles,
  TriangleAlert
} from "lucide-react";

import { AiTyping } from "@/components/ai-typing";
import { Button, LinkButton } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAiAnalysis } from "@/components/use-ai-analysis";
import { procurementScenario } from "@/data/procurement";
import { formatCompactCurrency, formatCurrency } from "@/lib/utils";
import { getRecommendedVendor } from "@/lib/scoring";

export function DecisionReport() {
  const { analysis, isLoading, isLive } = useAiAnalysis();
  const winner =
    procurementScenario.vendors.find(
      (vendor) => vendor.id === analysis.recommendedVendorId
    ) ?? getRecommendedVendor(procurementScenario.vendors);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="space-y-8"
    >
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Badge variant="success">
            <Medal className="mr-2 h-3.5 w-3.5" />
            {isLive ? "Live AI final recommendation" : "Demo final recommendation"}
          </Badge>
          <h1 className="mt-5 max-w-4xl text-5xl font-semibold tracking-[-0.05em] text-white md:text-7xl">
            Choose {winner.name}.
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-400">
            ProcurePilot recommends the vendor with the best weighted blend of
            cost, risk, flexibility, and terms for {procurementScenario.buyer}.
          </p>
        </div>
        <div className="no-print flex flex-col gap-3 sm:flex-row">
          <Button size="lg">
            <CheckCircle2 className="h-4 w-4" />
            Approve Decision
          </Button>
          <LinkButton href="/upload" variant="secondary" size="lg">
            <ArrowLeftRight className="h-4 w-4" />
            Compare Again
          </LinkButton>
        </div>
      </div>

      <Card className="relative overflow-hidden p-8 md:p-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(34,211,238,0.18),transparent_30%),radial-gradient(circle_at_88%_10%,rgba(168,85,247,0.16),transparent_32%)]" />
        <div className="relative grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-cyan-100">
              Winner
            </p>
            <h2 className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-white md:text-6xl">
              {winner.name}
            </h2>
            {isLoading ? (
              <div className="mt-6 space-y-3">
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-5/6" />
                <Skeleton className="h-5 w-2/3" />
              </div>
            ) : (
              <AiTyping
                text={analysis.reasoning}
                className="mt-6 text-xl leading-9 text-slate-300"
              />
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
              <p className="text-sm text-slate-400">Decision score</p>
              <p className="mt-2 text-4xl font-semibold text-white">
                {winner.decisionScore}
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
              <p className="text-sm text-slate-400">AI confidence</p>
              <p className="mt-2 text-4xl font-semibold text-white">
                {analysis.confidence}%
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
              <p className="text-sm text-slate-400">3Y contract cost</p>
              <p className="mt-2 text-4xl font-semibold text-white">
                {formatCompactCurrency(winner.threeYearCost)}
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
              <p className="text-sm text-slate-400">Savings estimate</p>
              <p className="mt-2 text-4xl font-semibold text-white">
                {formatCompactCurrency(analysis.savingsEstimate)}
              </p>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-6">
          <ShieldCheck className="h-6 w-6 text-emerald-200" />
          <h3 className="mt-5 text-2xl font-semibold tracking-tight text-white">
            Why this vendor won
          </h3>
          <ul className="mt-5 space-y-4">
            {winner.strengths.map((strength) => (
              <li key={strength} className="flex gap-3 text-sm leading-6 text-slate-300">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-200" />
                {strength}
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-6">
          <TriangleAlert className="h-6 w-6 text-amber-200" />
          <h3 className="mt-5 text-2xl font-semibold tracking-tight text-white">
            Hidden costs
          </h3>
          <p className="mt-3 text-sm text-slate-400">
            Estimated exposure: {formatCurrency(winner.hiddenCostExposure)}
          </p>
          <ul className="mt-5 space-y-4">
            {winner.hiddenCosts.map((cost) => (
              <li key={cost} className="text-sm leading-6 text-slate-300">
                {cost}
              </li>
            ))}
          </ul>
          <div className="mt-6 border-t border-white/10 pt-5">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
              AI risk watchlist
            </p>
            <ul className="mt-3 space-y-3">
              {analysis.riskWatchlist.map((risk) => (
                <li key={risk} className="text-sm leading-6 text-slate-300">
                  {risk}
                </li>
              ))}
            </ul>
          </div>
        </Card>

        <Card className="p-6">
          <Sparkles className="h-6 w-6 text-cyan-200" />
          <h3 className="mt-5 text-2xl font-semibold tracking-tight text-white">
            Negotiation suggestions
          </h3>
          <ul className="mt-5 space-y-4">
            {analysis.negotiationPriorities.map((suggestion) => (
              <li
                key={suggestion}
                className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm leading-6 text-slate-300"
              >
                {suggestion}
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-2xl font-semibold tracking-tight text-white">
              Export executive report
            </h3>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
              {analysis.decisionMemo}
            </p>
          </div>
          <Button
            className="no-print"
            variant="secondary"
            size="lg"
            onClick={() => window.print()}
          >
            <Download className="h-4 w-4" />
            Export report
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}
