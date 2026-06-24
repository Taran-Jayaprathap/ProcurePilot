const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

export interface UploadedDocument {
  id: string;
  filename: string;
  content_type: string | null;
  page_count: number;
  character_count: number;
}

export interface UploadResponse {
  id: string;
  documents: UploadedDocument[];
  status: string;
  created_at: string;
}

export interface VendorExtraction {
  document_id: string;
  document_name: string;
  vendor_name: string;
  price: number;
  contract_length: string;
  renewal_terms: string;
  sla: string;
  hidden_fees: string[];
  penalties: string[];
  cost_score: number;
  risk_score: number;
  flexibility_score: number;
  terms_score: number;
  total_score: number;
  risk_level: "Low" | "Medium" | "High" | string;
  extraction_confidence: number;
}

export interface DecisionResult {
  id: string;
  upload_id: string;
  recommended_vendor: string;
  confidence_score: number;
  risk_level: "Low" | "Medium" | "High" | string;
  savings_estimate: number;
  executive_reasoning: string;
  vendors: VendorExtraction[];
  scoring_weights: Record<string, number>;
  created_at: string;
}

async function parseJson<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const message = payload?.detail ?? "ProcurePilot API request failed.";
    throw new Error(Array.isArray(message) ? message.map((item) => item.msg).join(", ") : message);
  }
  return payload as T;
}

export async function uploadDocuments(files: File[]): Promise<UploadResponse> {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));

  const response = await fetch(`${API_BASE_URL}/upload`, {
    method: "POST",
    body: formData,
  });
  return parseJson<UploadResponse>(response);
}

export async function analyzeUpload(uploadId: string): Promise<DecisionResult> {
  const response = await fetch(`${API_BASE_URL}/analyze`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ uploadId }),
  });
  return parseJson<DecisionResult>(response);
}

export async function getResult(resultId: string): Promise<DecisionResult> {
  const response = await fetch(`${API_BASE_URL}/result/${resultId}`);
  return parseJson<DecisionResult>(response);
}
