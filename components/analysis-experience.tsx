"use client";

import { motion } from "framer-motion";
import { ArrowRight, BrainCircuit, ShieldAlert, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

import { AiTyping } from "@/components/ai-typing";
import { AnimatedCounter } from "@/components/animated-counter";
import { MetricCard } from "@/components/metric-card";
import { ProcessingTimeline } from "@/components/processing-timeline";
import { Badge } from "@/components/ui/badge";
import { LinkButton } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAiAnalysis } from "@/components/use-ai-analysis";
import { VendorScoreCard } from "@/components/vendor-score-card";
import { processingSteps, procurementScenario } from "@/data/procurement";
import { getAverageDecisionScore, getRecommendedVendor } from "@/lib/scoring";

export function AnalysisExperience() {
  const [activeStep, setActiveStep] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const { analysis, isLoading, isLive } = useAiAnalysis();
  const recommendedVendor =
    procurementScenario.vendors.find(
      (vendor) => vendor.id === analysis.recommendedVendorId
    ) ?? getRecommendedVendor(procurementScenario.vendors);
  const averageScore = getAverageDecisionScore(procurementScenario.vendors);

  useEffect(() => {
    if (activeStep >= processingSteps.length) {
      const completionTimer = window.setTimeout(() => setIsComplete(true), 450);
      return () => window.clearTimeout(completionTimer);
    }

    const timer = window.setTimeout(() => {
      setActiveStep((current) => current + 1);
    }, 850);

    return () => window.clearTimeout(timer);
  }, [activeStep]);

  if (!isComplete) {
    return (
      <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <Card className="p-8">
          <Badge>
            <Sparkles className="mr-2 h-3.5 w-3.5" />
            AI processing
          </Badge>
          <h1 className="mt-6 text-5xl font-semibold tracking-[-0.05em] text-white md:text-7xl">
            Reading every clause before the company spends.
          </h1>
          <p className="mt-5 text-lg leading-8 text-slate-400">
            ProcurePilot is extracting terms, converting pricing into comparable
            TCO, and identifying negotiation leverage across all three vendors.
          </p>
          <div className="mt-8 space-y-3">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="h-32 w-full" />
          </div>
        </Card>
        <Card className="p-6">
          <ProcessingTimeline steps={processingSteps} activeStep={activeStep} />
        </Card>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="space-y-8"
    >
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Badge variant="success">
            <BrainCircuit className="mr-2 h-3.5 w-3.5" />
            {isLive ? "Live AI recommendation" : "Demo recommendation"}
          </Badge>
          <h1 className="mt-5 max-w-4xl text-5xl font-semibold tracking-[-0.05em] text-white md:text-7xl">
            Executive procurement dashboard.
          </h1>
        </div>
        <LinkButton href="/decision" size="lg">
          Open decision report
          <ArrowRight className="h-4 w-4" />
        </LinkButton>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          label="Recommended vendor"
          value={recommendedVendor.name}
          detail="Highest risk-adjusted score across all evaluation categories."
          className="xl:col-span-2"
        />
        <MetricCard
          label="Savings estimate"
          value={
            <>
              $<AnimatedCounter value={Math.round(analysis.savingsEstimate / 1000)} />K
            </>
          }
          detail="Expected first-contract savings versus the risk-adjusted alternatives."
        />
        <MetricCard
          label="Risk level"
          value={recommendedVendor.riskLevel}
          detail="Low renewal and liability risk after AI contract review."
        />
        <MetricCard
          label="AI confidence"
          value={
            <>
              <AnimatedCounter value={analysis.confidence} />%
            </>
          }
          detail={
            isLoading
              ? "Generating confidence from the AI procurement model."
              : "Confidence based on extraction quality and document completeness."
          }
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-[0.92fr_1.08fr]">
        <Card className="p-7">
          <div className="flex items-center gap-3">
            <ShieldAlert className="h-5 w-5 text-cyan-200" />
            <p className="font-medium text-white">AI reasoning</p>
          </div>
          {isLoading ? (
            <div className="mt-6 space-y-3">
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-5/6" />
              <Skeleton className="h-5 w-2/3" />
            </div>
          ) : (
            <AiTyping
              text={analysis.executiveSummary}
              className="mt-6 text-xl leading-9 text-slate-300"
            />
          )}
          <div className="mt-8 rounded-3xl border border-white/10 bg-black/20 p-5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Decision score delta</span>
              <span className="text-white">
                +{(recommendedVendor.decisionScore - averageScore).toFixed(1)} vs average
              </span>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "78%" }}
                transition={{ duration: 1.2, delay: 0.2 }}
                className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-violet-400"
              />
            </div>
          </div>
        </Card>

        <div className="space-y-5">
          {procurementScenario.vendors.map((vendor) => (
            <VendorScoreCard
              key={vendor.id}
              vendor={vendor}
              isRecommended={vendor.id === analysis.recommendedVendorId}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}
