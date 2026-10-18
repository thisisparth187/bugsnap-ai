export type Severity = 'low' | 'medium' | 'high' | 'critical' | 'unknown';

export type EnvironmentSource = 'detected' | 'user-provided' | 'missing';
export type EnvironmentField = 'browser' | 'operatingSystem' | 'deviceType' | 'applicationUrl' | 'applicationVersion';
export type Dimensions = { width: number; height: number };

export type EnvironmentDetails = {
  browser: string;
  operatingSystem: string;
  deviceType: string;
  applicationUrl: string;
  applicationVersion: string;
  userAgent: string | null;
  viewport: Dimensions | null;
  screen: Dimensions | null;
  technicalMetadataIncluded: boolean;
  pageUrlIncluded: boolean;
  sources: Record<EnvironmentField, EnvironmentSource>;
};

export type BugReport = {
  title: string;
  summary: string;
  observedBehavior: string;
  expectedBehavior: string;
  reproductionSteps: string[];
  environment: EnvironmentDetails;
  visibleEvidence: string[];
  missingInformation: string[];
  hypotheses: string[];
  severitySuggestion: Severity;
};
