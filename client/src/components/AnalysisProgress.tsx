import { ScanLine } from 'lucide-react';

export function AnalysisProgress() {
  return <div className="analysis-progress" role="status"><div className="scan-icon"><ScanLine size={21} /></div><div><strong>Reading the evidence…</strong><p>Gemma 4 is separating what is visible from what is unknown.</p></div><span className="progress-dots"><i /><i /><i /></span></div>;
}
