import {
  ArrowRight,
  BarChart3,
  BrainCircuit,
  CheckCircle2,
  FileSearch,
  Landmark,
  LockKeyhole,
  Sparkles,
  TrendingDown
} from "lucide-react";

import { AnimatedCounter } from "@/components/animated-counter";
import { MotionSection } from "@/components/motion-section";
import { SectionHeading } from "@/components/section-heading";
import { Badge } from "@/components/ui/badge";
import { LinkButton } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { procurementScenario } from "@/data/procurement";

const problemCards = [
  {
    icon: FileSearch,
    title: "Quotes hide the real cost",
    description:
      "Implementation fees, overage schedules, and exit costs are buried across PDFs and pricing appendices."
  },
  {
    icon: LockKeyhole,
    title: "Contract risk is invisible",
    description:
      "Auto-renewals, liability gaps, and termination penalties change the decision after the deal is signed."
  },
  {
    icon: Landmark,
    title: "Approvals lack evidence",
    description:
      "Finance and legal teams need a defensible recommendation, not another spreadsheet of vendor claims."
  }
];

const workflow = [
  "Upload three vendor documents",
  "AI normalizes pricing and terms",
  "Executives receive a ranked recommendation"
];

export default function LandingPage() {
  const recommendedVendor = procurementScenario.vendors.find(
    (vendor) => vendor.id === procurementScenario.recommendedVendorId
  );

  return (
    <main>
      <section className="relative mx-auto flex min-h-[calc(100vh-5rem)] max-w-7xl flex-col justify-center px-6 py-24">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <Badge>
              <Sparkles className="mr-2 h-3.5 w-3.5" />
              AI procurement intelligence
            </Badge>
            <h1 className="text-balance mt-8 max-w-5xl text-6xl font-semibold tracking-[-0.065em] text-white md:text-8xl">
              Stop making company spending decisions blindly.
            </h1>
            <p className="mt-7 max-w-2xl text-xl leading-9 text-slate-300">
              AI analyzes contracts, quotations, and vendor proposals to
              recommend the smartest purchasing decision.
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <LinkButton href="/upload" size="lg">
                Try Demo
                <ArrowRight className="h-4 w-4" />
              </LinkButton>
              <LinkButton href="/analysis" variant="secondary" size="lg">
                View AI Dashboard
              </LinkButton>
            </div>
            <div className="mt-12 grid max-w-2xl grid-cols-3 gap-4">
              <div>
                <p className="text-3xl font-semibold text-white">
                  <AnimatedCounter value={3} />
                </p>
                <p className="mt-1 text-sm text-slate-500">vendors compared</p>
              </div>
              <div>
                <p className="text-3xl font-semibold text-white">
                  $<AnimatedCounter value={318} />K
                </p>
                <p className="mt-1 text-sm text-slate-500">savings found</p>
              </div>
              <div>
                <p className="text-3xl font-semibold text-white">
                  <AnimatedCounter value={94} />%
                </p>
                <p className="mt-1 text-sm text-slate-500">AI confidence</p>
              </div>
            </div>
          </div>

          <Card className="glass-ring relative overflow-hidden p-6">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.18),transparent_42%)]" />
            <div className="relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Recommended vendor</p>
                  <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-white">
                    {recommendedVendor?.name}
                  </h2>
                </div>
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-200/20 bg-cyan-300/10 text-cyan-100">
                  <BrainCircuit className="h-7 w-7" />
                </div>
              </div>

              <div className="mt-8 rounded-[1.5rem] border border-white/10 bg-black/20 p-5">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Decision score</span>
                  <span className="text-2xl font-semibold text-white">
                    {recommendedVendor?.decisionScore}
                  </span>
                </div>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full w-[91%] rounded-full bg-gradient-to-r from-cyan-300 to-violet-400" />
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {[
                  ["Cost", "35%", "Normalized TCO"],
                  ["Risk", "25%", "Renewal and liability"],
                  ["Flexibility", "20%", "Usage and exits"],
                  ["Terms", "20%", "Legal posture"]
                ].map(([label, weight, detail]) => (
                  <div
                    key={label}
                    className="rounded-3xl border border-white/10 bg-white/[0.045] p-4"
                  >
                    <p className="text-sm text-slate-500">{label}</p>
                    <p className="mt-2 text-2xl font-semibold text-white">
                      {weight}
                    </p>
                    <p className="mt-1 text-sm text-slate-400">{detail}</p>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </section>

      <MotionSection id="problem" className="mx-auto max-w-7xl px-6 py-24">
        <SectionHeading
          eyebrow="The problem"
          title="Procurement decisions are still made by manual review."
          description="Teams compare vendor quotes, contracts, and proposals by hand. The winner is often whoever has the cleanest deck, not the best commercial terms."
        />
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {problemCards.map((card) => (
            <Card key={card.title} className="p-6">
              <card.icon className="h-6 w-6 text-cyan-200" />
              <h3 className="mt-6 text-xl font-semibold tracking-tight text-white">
                {card.title}
              </h3>
              <p className="mt-3 leading-7 text-slate-400">{card.description}</p>
            </Card>
          ))}
        </div>
      </MotionSection>

      <MotionSection id="workflow" className="mx-auto max-w-7xl px-6 py-24">
        <SectionHeading
          eyebrow="How it works"
          title="From contract packet to executive recommendation."
          description="ProcurePilot turns procurement documents into a defensible decision memo with cost, risk, flexibility, and terms scored side by side."
        />
        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {workflow.map((step, index) => (
            <Card key={step} className="relative overflow-hidden p-7">
              <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-cyan-300/10 blur-2xl" />
              <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-white">
                {index + 1}
              </div>
              <h3 className="mt-8 text-2xl font-semibold tracking-tight text-white">
                {step}
              </h3>
              <p className="mt-4 leading-7 text-slate-400">
                {index === 0 &&
                  "Drop vendor PDFs, quotes, contracts, or proposal attachments into a secure workspace."}
                {index === 1 &&
                  "The AI extracts pricing tables, risk clauses, hidden fees, renewal language, and negotiation levers."}
                {index === 2 &&
                  "Finance, legal, and business owners get one ranked answer they can defend in approval meetings."}
              </p>
            </Card>
          ))}
        </div>
      </MotionSection>

      <MotionSection className="mx-auto max-w-7xl px-6 py-24">
        <Card className="relative overflow-hidden p-8 md:p-12">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(99,102,241,0.22),transparent_35%),radial-gradient(circle_at_80%_40%,rgba(34,211,238,0.14),transparent_32%)]" />
          <div className="relative grid items-center gap-10 lg:grid-cols-[1fr_auto]">
            <div>
              <Badge variant="success">
                <CheckCircle2 className="mr-2 h-3.5 w-3.5" />
                Demo ready
              </Badge>
              <h2 className="mt-6 max-w-3xl text-4xl font-semibold tracking-[-0.04em] text-white md:text-6xl">
                See the full AI procurement decision in under 60 seconds.
              </h2>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">
                Analyze ApexCloud Solutions, Nimbus Procurement, and Vertex
                Enterprise Systems with realistic contract risks and hidden costs.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <LinkButton href="/upload" size="lg">
                Try Demo
                <TrendingDown className="h-4 w-4" />
              </LinkButton>
              <LinkButton href="/decision" variant="secondary" size="lg">
                Open report
                <BarChart3 className="h-4 w-4" />
              </LinkButton>
            </div>
          </div>
        </Card>
      </MotionSection>
    </main>
  );
}
