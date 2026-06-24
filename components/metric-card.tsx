import type { ReactNode } from "react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type MetricCardProps = {
  label: string;
  value: ReactNode;
  detail: string;
  className?: string;
};

export function MetricCard({ label, value, detail, className }: MetricCardProps) {
  return (
    <Card className={cn("relative overflow-hidden p-6", className)}>
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-200/50 to-transparent" />
      <p className="text-sm text-slate-400">{label}</p>
      <div className="mt-3 text-4xl font-semibold tracking-[-0.04em] text-white">
        {value}
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-400">{detail}</p>
    </Card>
  );
}
