import { BrainCircuit } from "lucide-react";
import Link from "next/link";

import { LinkButton } from "@/components/ui/button";

export function Navigation() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/55 backdrop-blur-2xl">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-100 shadow-lg shadow-cyan-500/10">
            <BrainCircuit className="h-5 w-5" />
          </span>
          <span className="text-lg font-semibold tracking-tight text-white">
            ProcurePilot
          </span>
        </Link>
        <nav className="hidden items-center gap-8 text-sm text-slate-400 md:flex">
          <Link className="transition hover:text-white" href="/#problem">
            Problem
          </Link>
          <Link className="transition hover:text-white" href="/#workflow">
            Workflow
          </Link>
          <Link className="transition hover:text-white" href="/analysis">
            Dashboard
          </Link>
        </nav>
        <LinkButton href="/upload" variant="secondary" size="sm">
          Try Demo
        </LinkButton>
      </div>
    </header>
  );
}
