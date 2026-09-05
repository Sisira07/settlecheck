export interface ReportResponse {
  totalRecordsProcessed: number;
  exactMatches: number;
  subsetSumMatches: number;
  exceptionsRaised: number;
  matchRatePercent: number;
}

export interface ExceptionRecord {
  exceptionId: string;
  orderIds: string[];
  settlementIds: string[];
  reasonCode: string;
  llmExplanation: string;
  status: string;
  createdAt: string;
}

export interface AuditLog {
  logId: string;
  recordId: string;
  action: string;
  passUsed: string;
  confidence: number;
  reasoning: string;
  timestamp: string;
}

export const generateData = async (): Promise<any> => {
  const response = await fetch('/data/generate', { method: 'POST' });
  if (!response.ok) throw new Error('Failed to generate data');
  return response.json();
};

export const runReconciliation = async (): Promise<ReportResponse> => {
  const response = await fetch('/reconcile/run', { method: 'POST' });
  if (!response.ok) throw new Error('Failed to run reconciliation');
  return response.json();
};

export const getReport = async (): Promise<ReportResponse> => {
  const response = await fetch('/reconcile/report');
  if (!response.ok) throw new Error('Failed to fetch report');
  return response.json();
};

export const getExceptions = async (): Promise<ExceptionRecord[]> => {
  const response = await fetch('/reconcile/exceptions');
  if (!response.ok) throw new Error('Failed to fetch exceptions');
  return response.json();
};

export const getAuditTrail = async (recordId: string): Promise<AuditLog[]> => {
  const response = await fetch(`/audit/${recordId}`);
  if (!response.ok) throw new Error('Failed to fetch audit trail');
  return response.json();
};
