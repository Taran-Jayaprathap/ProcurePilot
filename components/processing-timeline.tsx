"use client";

import { motion } from "framer-motion";
import { Check, Loader2 } from "lucide-react";

import type { ProcessingStep } from "@/types/procurement";
import { cn } from "@/lib/utils";

type ProcessingTimelineProps = {
  steps: ProcessingStep[];
  activeStep: number;
};

export function ProcessingTimeline({ steps, activeStep }: ProcessingTimelineProps) {
  return (
    <div className="space-y-4">
      {steps.map((step, index) => {
        const isComplete = index < activeStep;
        const isActive = index === activeStep;

        return (
          <motion.div
            key={step.title}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.08 }}
            className={cn(
              "flex gap-4 rounded-3xl border p-4 transition duration-500",
              isComplete && "border-emerald-300/20 bg-emerald-300/10",
              isActive && "border-cyan-300/30 bg-cyan-300/10",
              !isComplete && !isActive && "border-white/10 bg-white/[0.035]"
            )}
          >
            <div
              className={cn(
                "mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border",
                isComplete && "border-emerald-300/30 bg-emerald-300/15 text-emerald-100",
                isActive && "border-cyan-300/30 bg-cyan-300/15 text-cyan-100",
                !isComplete && !isActive && "border-white/10 bg-white/[0.04] text-slate-500"
              )}
            >
              {isComplete ? (
                <Check className="h-4 w-4" />
              ) : isActive ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <span className="h-2 w-2 rounded-full bg-current" />
              )}
            </div>
            <div>
              <p className="font-medium text-white">{step.title}</p>
              <p className="mt-1 text-sm leading-6 text-slate-400">
                {step.description}
              </p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
