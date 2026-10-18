import { z } from 'zod';

const environmentSourceSchema = z.enum(['detected', 'user-provided', 'missing']);
const dimensionsSchema = z.object({
  width: z.number().int().min(0).max(10000),
  height: z.number().int().min(0).max(10000),
});

export const environmentSchema = z.object({
  browser: z.string().min(1).max(300),
  operatingSystem: z.string().min(1).max(300),
  deviceType: z.string().min(1).max(100),
  applicationUrl: z.string().min(1).max(2000),
  applicationVersion: z.string().min(1).max(100),
  userAgent: z.string().max(1200).nullable(),
  viewport: dimensionsSchema.nullable(),
  screen: dimensionsSchema.nullable(),
  technicalMetadataIncluded: z.boolean(),
  pageUrlIncluded: z.boolean(),
  sources: z.object({
    browser: environmentSourceSchema,
    operatingSystem: environmentSourceSchema,
    deviceType: environmentSourceSchema,
    applicationUrl: environmentSourceSchema,
    applicationVersion: environmentSourceSchema,
  }),
});

export type EnvironmentDetails = z.infer<typeof environmentSchema>;

export const bugReportSchema = z.object({
  title: z.string().min(1).max(180),
  summary: z.string().min(1).max(3000),
  observedBehavior: z.string().min(1).max(5000),
  expectedBehavior: z.string().min(1).max(5000),
  reproductionSteps: z.array(z.string().min(1).max(500)).max(20),
  environment: environmentSchema,
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
  "environment": {
    "browser": "string or Not provided",
    "operatingSystem": "string or Not provided",
    "deviceType": "string or Not provided",
    "applicationUrl": "string or Not provided",
    "applicationVersion": "string or Not provided",
    "userAgent": "string or null",
    "viewport": { "width": 0, "height": 0 },
    "screen": { "width": 0, "height": 0 },
    "technicalMetadataIncluded": true,
    "pageUrlIncluded": false,
    "sources": {
      "browser": "detected|user-provided|missing",
      "operatingSystem": "detected|user-provided|missing",
      "deviceType": "detected|user-provided|missing",
      "applicationUrl": "detected|user-provided|missing",
      "applicationVersion": "detected|user-provided|missing"
    }
  },
  "visibleEvidence": ["string"],
  "missingInformation": ["string"],
  "hypotheses": ["string"],
  "severitySuggestion": "low|medium|high|critical|unknown"
}
Use an empty array only when there is genuinely nothing to add. If expected behavior is not supplied, say that it was not provided. If reproduction steps are not supplied, return an empty array and add a missing-information question. Every hypothesis must be explicitly labeled unverified. Use supplied environment metadata exactly when present. Preserve the literal value Not provided and null values; never infer a browser, operating system, or device from screenshot appearance.`;

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
