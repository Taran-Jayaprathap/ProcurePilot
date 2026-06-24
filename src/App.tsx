import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileText,
  Gauge,
  Loader2,
  LockKeyhole,
  Rocket,
  ShieldCheck,
  Sparkles,
  UploadCloud,
} from "lucide-react";
import { type ChangeEvent, type DragEvent, type ReactNode, useMemo, useState } from "react";

import {
  analyzeUpload,
  getResult,
  type DecisionResult,
  type UploadResponse,
  uploadDocuments,
  type VendorExtraction,
} from "./lib/api";

type View = "upload" | "dashboard" | "decision";
type StageStatus = "pending" | "active" | "complete";

interface AnalysisStage {
  id: string;
  label: string;
  detail: string;
  status: StageStatus;
}

const initialStages: AnalysisStage[] = [
  {
    id: "extract",
    label: "Extracting documents",
    detail: "Reading PDF text, page structure, and commercial clauses.",
    status: "pending",
  },
  {
    id: "pricing",
    label: "Evaluating pricing",
    detail: "Normalizing contract value, fees, and comparable price signals.",
    status: "pending",
  },
  {
    id: "risk",
    label: "Assessing risks",
    detail: "Scoring vendor exposure, renewal traps, and penalty language.",
    status: "pending",
  },
  {
    id: "hidden",
    label: "Detecting hidden costs",
    detail: "Finding setup fees, overages, surcharges, and commercial leakage.",
    status: "pending",
  },
  {
    id: "recommend",
    label: "Generating recommendation",
    detail: "Ranking vendors with weighted cost, risk, flexibility, and terms.",
    status: "pending",
  },
];

const scoringLabels: Record<string, string> = {
  cost: "Cost",
  risk: "Risk",
  flexibility: "Flexibility",
  terms: "Terms",
};

function App() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeView, setActiveView] = useState<View>("upload");
  const [stages, setStages] = useState<AnalysisStage[]>(initialStages);
  const [upload, setUpload] = useState<UploadResponse | null>(null);
  const [result, setResult] = useState<DecisionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const totalPages = useMemo(
    () => upload?.documents.reduce((sum, document) => sum + document.page_count, 0) ?? 0,
    [upload],
  );

  const totalCharacters = useMemo(
    () => upload?.documents.reduce((sum, document) => sum + document.character_count, 0) ?? 0,
    [upload],
  );

  function addFiles(files: FileList | File[]) {
    const pdfs = Array.from(files).filter((file) => file.type === "application/pdf" || file.name.endsWith(".pdf"));
    setSelectedFiles((current) => [...current, ...pdfs]);
    setError(null);
  }

  function onFileInput(event: ChangeEvent<HTMLInputElement>) {
    if (event.target.files) {
      addFiles(event.target.files);
    }
  }

  function onDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setIsDragging(false);
    addFiles(event.dataTransfer.files);
  }

  function updateStage(stageId: string, status: StageStatus) {
    setStages((current) => current.map((stage) => (stage.id === stageId ? { ...stage, status } : stage)));
  }

  async function runAnalysis() {
    if (!selectedFiles.length || isProcessing) {
      return;
    }

    setIsProcessing(true);
    setActiveView("dashboard");
    setUpload(null);
    setResult(null);
    setError(null);
    setStages(initialStages);

    try {
      updateStage("extract", "active");
      const uploaded = await uploadDocuments(selectedFiles);
      setUpload(uploaded);
      updateStage("extract", "complete");

      updateStage("pricing", "active");
      await delay(650);
      updateStage("pricing", "complete");

      updateStage("risk", "active");
      await delay(650);
      updateStage("risk", "complete");

      updateStage("hidden", "active");
      await delay(650);
      updateStage("hidden", "complete");

      updateStage("recommend", "active");
      const analyzed = await analyzeUpload(uploaded.id);
      const hydrated = await getResult(analyzed.id);
      setResult(hydrated);
      updateStage("recommend", "complete");
      setActiveView("decision");
    } catch (analysisError) {
      setError(analysisError instanceof Error ? analysisError.message : "Unable to complete analysis.");
      setActiveView("upload");
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <main className="app-shell">
      <div className="background-orb orb-one" />
      <div className="background-orb orb-two" />

      <header className="topbar">
        <button className="brand" onClick={() => setActiveView("upload")} type="button">
          <span className="brand-mark">
            <Sparkles size={18} />
          </span>
          ProcurePilot
        </button>
        <nav className="nav-pills" aria-label="ProcurePilot workflow">
          <button className={activeView === "upload" ? "active" : ""} onClick={() => setActiveView("upload")} type="button">
            Upload
          </button>
          <button
            className={activeView === "dashboard" ? "active" : ""}
            onClick={() => setActiveView("dashboard")}
            disabled={!upload && !isProcessing}
            type="button"
          >
            Dashboard
          </button>
          <button
            className={activeView === "decision" ? "active" : ""}
            onClick={() => setActiveView("decision")}
            disabled={!result}
            type="button"
          >
            Decision
          </button>
        </nav>
      </header>

      {activeView === "upload" && (
        <section className="hero-grid">
          <div className="hero-copy">
            <div className="eyebrow">
              <Rocket size={16} />
              AI procurement intelligence
            </div>
            <h1>Turn vendor PDFs into an executive-ready buying decision.</h1>
            <p>
              Upload competing proposals or contracts. ProcurePilot extracts commercial terms, scores vendor risk,
              surfaces hidden costs, and recommends the strongest option for an investor-demo workflow.
            </p>
            <div className="hero-actions">
              <button className="primary-button" disabled={!selectedFiles.length || isProcessing} onClick={runAnalysis} type="button">
                Analyze vendors
                {isProcessing ? <Loader2 className="spin" size={18} /> : <ArrowRight size={18} />}
              </button>
              <button className="secondary-button" onClick={() => setActiveView("dashboard")} disabled={!upload} type="button">
                View dashboard
              </button>
            </div>
            <div className="proof-strip">
              <span>Cost: 35%</span>
              <span>Risk: 25%</span>
              <span>Flexibility: 20%</span>
              <span>Terms: 20%</span>
            </div>
          </div>

          <UploadPanel
            error={error}
            isDragging={isDragging}
            onDragEnter={() => setIsDragging(true)}
            onDragLeave={() => setIsDragging(false)}
            onDrop={onDrop}
            onFileInput={onFileInput}
            onRunAnalysis={runAnalysis}
            selectedFiles={selectedFiles}
            setSelectedFiles={setSelectedFiles}
            isProcessing={isProcessing}
          />
        </section>
      )}

      {activeView === "dashboard" && (
        <Dashboard
          isProcessing={isProcessing}
          result={result}
          stages={stages}
          totalCharacters={totalCharacters}
          totalPages={totalPages}
          upload={upload}
        />
      )}

      {activeView === "decision" && result && <DecisionPage result={result} onAnalyzeAnother={() => setActiveView("upload")} />}
    </main>
  );
}

function UploadPanel({
  error,
  isDragging,
  isProcessing,
  onDragEnter,
  onDragLeave,
  onDrop,
  onFileInput,
  onRunAnalysis,
  selectedFiles,
  setSelectedFiles,
}: {
  error: string | null;
  isDragging: boolean;
  isProcessing: boolean;
  onDragEnter: () => void;
  onDragLeave: () => void;
  onDrop: (event: DragEvent<HTMLLabelElement>) => void;
  onFileInput: (event: ChangeEvent<HTMLInputElement>) => void;
  onRunAnalysis: () => void;
  selectedFiles: File[];
  setSelectedFiles: (files: File[]) => void;
}) {
  return (
    <aside className="glass-panel upload-panel">
      <div className="panel-heading">
        <div>
          <p className="section-kicker">Vendor package</p>
          <h2>Upload contract PDFs</h2>
        </div>
        <FileText />
      </div>

      <label
        className={isDragging ? "drop-zone dragging" : "drop-zone"}
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
        onDragOver={(event) => event.preventDefault()}
        onDrop={onDrop}
      >
        <UploadCloud size={42} />
        <strong>Drop PDF files here</strong>
        <span>or browse to add vendor proposals, MSAs, SOWs, and renewals.</span>
        <input accept="application/pdf,.pdf" multiple onChange={onFileInput} type="file" />
      </label>

      {selectedFiles.length > 0 && (
        <div className="file-list">
          <div className="file-list-header">
            <span>{selectedFiles.length} PDF{selectedFiles.length === 1 ? "" : "s"} ready</span>
            <button onClick={() => setSelectedFiles([])} type="button">
              Clear
            </button>
          </div>
          {selectedFiles.map((file) => (
            <div className="file-row" key={`${file.name}-${file.lastModified}`}>
              <FileText size={16} />
              <span>{file.name}</span>
              <small>{formatBytes(file.size)}</small>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="error-box">
          <AlertTriangle size={18} />
          {error}
        </div>
      )}

      <button className="primary-button full-width" disabled={!selectedFiles.length || isProcessing} onClick={onRunAnalysis} type="button">
        Start AI analysis
        {isProcessing ? <Loader2 className="spin" size={18} /> : <ChevronRight size={18} />}
      </button>
    </aside>
  );
}

function Dashboard({
  isProcessing,
  result,
  stages,
  totalCharacters,
  totalPages,
  upload,
}: {
  isProcessing: boolean;
  result: DecisionResult | null;
  stages: AnalysisStage[];
  totalCharacters: number;
  totalPages: number;
  upload: UploadResponse | null;
}) {
  return (
    <section className="dashboard-stack">
      <div className="section-title">
        <p className="section-kicker">Live analysis dashboard</p>
        <h1>{isProcessing ? "ProcurePilot is evaluating your vendor package" : "Vendor intelligence dashboard"}</h1>
        <span>
          {isProcessing
            ? "Mock AI is running the same workflow that will later be connected to production LLM APIs."
            : "Review extracted document coverage and weighted vendor scores."}
        </span>
      </div>

      <div className="stats-grid">
        <StatCard icon={<FileText />} label="Documents" value={upload?.documents.length.toString() ?? "0"} />
        <StatCard icon={<Clock3 />} label="Pages processed" value={totalPages.toString()} />
        <StatCard icon={<Gauge />} label="Characters extracted" value={compactNumber(totalCharacters)} />
        <StatCard icon={<ShieldCheck />} label="Top risk level" value={result?.risk_level ?? "Pending"} />
      </div>

      <div className="dashboard-grid">
        <div className="glass-panel">
          <div className="panel-heading">
            <div>
              <p className="section-kicker">Processing pipeline</p>
              <h2>AI workflow status</h2>
            </div>
            {isProcessing ? <Loader2 className="spin" /> : <CheckCircle2 />}
          </div>
          <div className="stage-list">
            {stages.map((stage) => (
              <div className={`stage-row ${stage.status}`} key={stage.id}>
                <span className="stage-indicator">
                  {stage.status === "active" ? <Loader2 className="spin" size={16} /> : stage.status === "complete" ? <CheckCircle2 size={16} /> : null}
                </span>
                <div>
                  <strong>{stage.label}</strong>
                  <p>{stage.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-panel">
          <div className="panel-heading">
            <div>
              <p className="section-kicker">Scoring model</p>
              <h2>Decision weights</h2>
            </div>
            <BarChart3 />
          </div>
          <div className="weight-list">
            {(result ? Object.entries(result.scoring_weights) : Object.entries({ cost: 0.35, risk: 0.25, flexibility: 0.2, terms: 0.2 })).map(
              ([key, value]) => (
                <div className="weight-row" key={key}>
                  <span>{scoringLabels[key] ?? key}</span>
                  <div className="weight-track">
                    <span style={{ width: `${value * 100}%` }} />
                  </div>
                  <strong>{Math.round(value * 100)}%</strong>
                </div>
              ),
            )}
          </div>
        </div>
      </div>

      {result && (
        <div className="vendor-grid">
          {result.vendors.map((vendor) => (
            <VendorCard key={vendor.document_id} vendor={vendor} />
          ))}
        </div>
      )}
    </section>
  );
}

function DecisionPage({ onAnalyzeAnother, result }: { onAnalyzeAnother: () => void; result: DecisionResult }) {
  const topVendor = result.vendors[0];

  return (
    <section className="decision-layout">
      <div className="glass-panel recommendation-card">
        <div className="recommendation-badge">
          <Sparkles size={18} />
          Recommended vendor
        </div>
        <h1>{result.recommended_vendor}</h1>
        <p>{result.executive_reasoning}</p>

        <div className="decision-metrics">
          <Metric label="Confidence" value={`${Math.round(result.confidence_score * 100)}%`} />
          <Metric label="Risk level" value={result.risk_level} />
          <Metric label="Savings estimate" value={formatMoney(result.savings_estimate)} />
          <Metric label="Total score" value={`${topVendor?.total_score ?? 0}/100`} />
        </div>

        <button className="primary-button" onClick={onAnalyzeAnother} type="button">
          Analyze another package
          <UploadCloud size={18} />
        </button>
      </div>

      <div className="glass-panel">
        <div className="panel-heading">
          <div>
            <p className="section-kicker">Executive decision brief</p>
            <h2>Extracted buying signals</h2>
          </div>
          <LockKeyhole />
        </div>
        <div className="decision-table">
          {result.vendors.map((vendor) => (
            <div className="decision-row" key={vendor.document_id}>
              <div>
                <strong>{vendor.vendor_name}</strong>
                <span>{vendor.document_name}</span>
              </div>
              <span>{formatMoney(vendor.price)}</span>
              <span>{vendor.contract_length}</span>
              <span className={`risk-pill ${vendor.risk_level.toLowerCase()}`}>{vendor.risk_level}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="vendor-grid wide">
        {result.vendors.map((vendor) => (
          <VendorCard key={vendor.document_id} vendor={vendor} />
        ))}
      </div>
    </section>
  );
}

function VendorCard({ vendor }: { vendor: VendorExtraction }) {
  return (
    <article className="glass-panel vendor-card">
      <div className="vendor-card-header">
        <div>
          <p className="section-kicker">Vendor analysis</p>
          <h3>{vendor.vendor_name}</h3>
        </div>
        <span className={`risk-pill ${vendor.risk_level.toLowerCase()}`}>{vendor.risk_level}</span>
      </div>
      <div className="score-ring">{vendor.total_score}</div>
      <dl className="vendor-details">
        <div>
          <dt>Price</dt>
          <dd>{formatMoney(vendor.price)}</dd>
        </div>
        <div>
          <dt>Contract length</dt>
          <dd>{vendor.contract_length}</dd>
        </div>
        <div>
          <dt>Renewal terms</dt>
          <dd>{vendor.renewal_terms}</dd>
        </div>
        <div>
          <dt>SLA</dt>
          <dd>{vendor.sla}</dd>
        </div>
      </dl>
      <div className="chip-group">
        {vendor.hidden_fees.concat(vendor.penalties).slice(0, 4).map((term) => (
          <span key={term}>{term}</span>
        ))}
      </div>
    </article>
  );
}

function StatCard({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="glass-panel stat-card">
      <span>{icon}</span>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function delay(milliseconds: number) {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    currency: "USD",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(value);
}

function formatBytes(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function compactNumber(value: number) {
  return new Intl.NumberFormat("en-US", { notation: "compact" }).format(value);
}

export default App;
