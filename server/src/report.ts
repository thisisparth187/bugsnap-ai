import { z } from 'zod';

export const bugReportSchema = z.object({
  title: z.string().min(1).max(180),
  summary: z.string().min(1).max(3000),
  observedBehavior: z.string().min(1).max(5000),
  expectedBehavior: z.string().min(1).max(5000),
  reproductionSteps: z.array(z.string().min(1).max(500)).max(20),
  environment: z.string().min(1).max(1500),
  visibleEvidence: z.array(z.string().min(1).max(700)).max(30),
  missingInformation: z.array(z.string().min(1).max(700)).max(30),
  hypotheses: z.array(z.string().min(1).max(1000)).max(20),
  severitySuggestion: z.enum(['low', 'medium', 'high', 'critical', 'unknown']),
});

export type BugReport = z.infer<typeof bugReportSchema>;

export const REPORT_JSON_INSTRUCTION = `Return only valid JSON matching this exact schema:
{
  "title": "string",
  "summary": "string",
  "observedBehavior": "string",
  "expectedBehavior": "string",
  "reproductionSteps": ["string"],
  "environment": "string",
  "visibleEvidence": ["string"],
  "missingInformation": ["string"],
  "hypotheses": ["string"],
  "severitySuggestion": "low|medium|high|critical|unknown"
}
Use an empty array only when there is genuinely nothing to add. If expected behavior is not supplied, say that it was not provided. If reproduction steps are not supplied, return an empty array and add a missing-information question. Every hypothesis must be explicitly labeled unverified.`;

export function parseModelJson(value: string): BugReport {
  const cleaned = value.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error('MODEL_MALFORMED_JSON');
  }
  const result = bugReportSchema.safeParse(parsed);
  if (!result.success) throw new Error('MODEL_SCHEMA_INVALID');
  return result.data;
}
