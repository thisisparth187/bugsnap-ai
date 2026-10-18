export type Severity = 'low' | 'medium' | 'high' | 'critical' | 'unknown';

export type BugReport = {
  title: string;
  summary: string;
  observedBehavior: string;
  expectedBehavior: string;
  reproductionSteps: string[];
  environment: string;
  visibleEvidence: string[];
  missingInformation: string[];
  hypotheses: string[];
  severitySuggestion: Severity;
};
