import { AlertTriangle, CheckCircle2, CircleDollarSign } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn, formatCompactCurrency } from "@/lib/utils";
import type { VendorEvaluation } from "@/types/procurement";

type VendorScoreCardProps = {
  vendor: VendorEvaluation;
  isRecommended?: boolean;
};

export function VendorScoreCard({
  vendor,
  isRecommended = false
}: VendorScoreCardProps) {
  const riskVariant = vendor.riskLevel === "Low" ? "success" : "warning";

  return (
    <Card
      className={cn(
        "relative overflow-hidden p-6 transition duration-300 hover:-translate-y-1 hover:border-white/20",
        isRecommended && "border-cyan-300/40 bg-cyan-300/[0.08]"
      )}
    >
      {isRecommended && (
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-200 to-transparent" />
      )}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="text-xl font-semibold tracking-tight text-white">
              {vendor.name}
            </h3>
            {isRecommended && <Badge>Recommended</Badge>}
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-400">{vendor.tagline}</p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-semibold tracking-[-0.04em] text-white">
            {vendor.decisionScore}
          </p>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
            Decision score
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <CircleDollarSign className="h-4 w-4 text-cyan-200" />
          <p className="mt-3 text-sm text-slate-500">3Y TCO</p>
          <p className="font-medium text-white">
            {formatCompactCurrency(vendor.threeYearCost)}
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <AlertTriangle className="h-4 w-4 text-amber-200" />
          <p className="mt-3 text-sm text-slate-500">Risk level</p>
          <Badge variant={riskVariant} className="mt-1">
            {vendor.riskLevel}
          </Badge>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <CheckCircle2 className="h-4 w-4 text-emerald-200" />
          <p className="mt-3 text-sm text-slate-500">Confidence</p>
          <p className="font-medium text-white">{vendor.confidence}%</p>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {Object.entries(vendor.scoreBreakdown).map(([label, score]) => (
          <div key={label}>
            <div className="mb-2 flex justify-between text-sm">
              <span className="capitalize text-slate-400">{label}</span>
              <span className="text-white">{score}</span>
            </div>
            <Progress value={score} />
          </div>
        ))}
      </div>
    </Card>
  );
}
