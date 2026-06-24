"use client";

import { motion } from "framer-motion";
import { FileText, ShieldCheck, Sparkles, UploadCloud } from "lucide-react";
import { useRouter } from "next/navigation";
import { DragEvent, useMemo, useState } from "react";

import { procurementScenario } from "@/data/procurement";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

type DemoFile = {
  name: string;
  size: string;
  progress: number;
};

const demoFiles: DemoFile[] = procurementScenario.vendors.map((vendor, index) => ({
  name: vendor.documentName,
  size: `${(2.4 + index * 0.8).toFixed(1)} MB`,
  progress: 100
}));

export function FileDropzone() {
  const router = useRouter();
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<DemoFile[]>([]);
  const isReady = files.length >= 3 && files.every((file) => file.progress === 100);

  const helperCopy = useMemo(() => {
    if (files.length === 0) {
      return "Drop three vendor PDFs or start with the seeded investor demo.";
    }

    if (!isReady) {
      return "Uploading documents into the secure procurement workspace.";
    }

    return "Documents are ready. ProcurePilot can begin AI analysis.";
  }, [files.length, isReady]);

  function loadDemo() {
    setFiles(
      demoFiles.map((file) => ({
        ...file,
        progress: 15
      }))
    );

    demoFiles.forEach((_, index) => {
      window.setTimeout(() => {
        setFiles((current) =>
          current.map((file, fileIndex) =>
            fileIndex === index ? { ...file, progress: 100 } : file
          )
        );
      }, 450 + index * 320);
    });
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);

    const droppedFiles = Array.from(event.dataTransfer.files).slice(0, 6);
    if (droppedFiles.length === 0) {
      return;
    }

    setFiles(
      droppedFiles.map((file) => ({
        name: file.name,
        size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
        progress: 100
      }))
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
      <Card
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={cn(
          "relative min-h-[34rem] overflow-hidden p-8 transition duration-300",
          isDragging && "border-cyan-300/60 bg-cyan-300/10"
        )}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_15%,rgba(34,211,238,0.16),transparent_36%)]" />
        <div className="relative flex h-full flex-col items-center justify-center text-center">
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="flex h-24 w-24 items-center justify-center rounded-[2rem] border border-cyan-200/20 bg-cyan-300/10 text-cyan-100 shadow-2xl shadow-cyan-500/10"
          >
            <UploadCloud className="h-10 w-10" />
          </motion.div>
          <h1 className="mt-8 max-w-2xl text-4xl font-semibold tracking-[-0.04em] text-white md:text-6xl">
            Upload procurement documents.
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-slate-400">
            {helperCopy}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button size="lg" onClick={loadDemo}>
              <Sparkles className="h-4 w-4" />
              Try Demo
            </Button>
            <Button
              size="lg"
              variant="secondary"
              disabled={!isReady}
              onClick={() => router.push("/analysis")}
            >
              Analyze documents
            </Button>
          </div>
          <p className="mt-6 text-xs uppercase tracking-[0.24em] text-slate-500">
            PDF, DOCX, XLSX up to 50MB each
          </p>
        </div>
      </Card>

      <div className="space-y-4">
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-emerald-300" />
            <div>
              <p className="font-medium text-white">Secure review room</p>
              <p className="text-sm text-slate-400">
                Private demo mode with no external AI calls.
              </p>
            </div>
          </div>
        </div>

        {(files.length > 0 ? files : demoFiles).map((file, index) => (
          <motion.div
            key={file.name}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08 }}
          >
            <Card className="p-5">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.07] text-cyan-100">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-4">
                    <p className="truncate font-medium text-white">{file.name}</p>
                    <span className="text-sm text-slate-500">{file.size}</span>
                  </div>
                  <Progress value={file.progress} className="mt-4" />
                  <p className="mt-3 text-sm text-slate-400">
                    {file.progress === 100 ? "Ready for AI extraction" : "Uploading..."}
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
