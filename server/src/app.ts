import cors from 'cors';
import express, { type ErrorRequestHandler } from 'express';
import multer from 'multer';
import { bugReportSchema, environmentSchema, type EnvironmentDetails } from './report.js';
import { generateWithGemma } from './ai.js';

export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
export const ACCEPTED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_IMAGE_BYTES, files: 1 },
  fileFilter: (_req, file, callback) => callback(null, ACCEPTED_MIME_TYPES.includes(file.mimetype as (typeof ACCEPTED_MIME_TYPES)[number])),
});

function hasImageSignature(buffer: Buffer, mimeType: string): boolean {
  if (mimeType === 'image/png') return buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (mimeType === 'image/jpeg') return buffer.subarray(0, 3).equals(Buffer.from([255, 216, 255]));
  if (mimeType === 'image/webp') return buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP';
  return false;
}

function errorResponse(code: string, message: string, status: number) {
  return { error: { code, message } };
}

const EMPTY_ENVIRONMENT: EnvironmentDetails = {
  browser: 'Not provided',
  operatingSystem: 'Not provided',
  deviceType: 'Not provided',
  applicationUrl: 'Not provided',
  applicationVersion: 'Not provided',
  userAgent: null,
  viewport: null,
  screen: null,
  technicalMetadataIncluded: false,
  pageUrlIncluded: false,
  sources: {
    browser: 'missing',
    operatingSystem: 'missing',
    deviceType: 'missing',
    applicationUrl: 'missing',
    applicationVersion: 'missing',
  },
};

const environmentPrompts: Record<keyof EnvironmentDetails['sources'], string> = {
  browser: 'Provide the browser and version.',
  operatingSystem: 'Provide the operating system.',
  deviceType: 'Provide the device type.',
  applicationUrl: 'Provide the application URL if relevant.',
  applicationVersion: 'Provide the application version if available.',
};

function normalizeEnvironment(input: EnvironmentDetails): EnvironmentDetails {
  const environment = structuredClone(input);
  if (!environment.technicalMetadataIncluded) {
    environment.userAgent = null;
    environment.viewport = null;
    environment.screen = null;
  }
  if (!environment.pageUrlIncluded && environment.sources.applicationUrl === 'detected') {
    environment.applicationUrl = 'Not provided';
    environment.sources.applicationUrl = 'missing';
  }
  return environment;
}

function environmentMissingPrompts(environment: EnvironmentDetails) {
  return Object.entries(environment.sources)
    .filter(([, source]) => source === 'missing')
    .map(([field]) => environmentPrompts[field as keyof typeof environmentPrompts]);
}

export function createApp() {
  const app = express();
  const allowedOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
  app.use(cors({ origin: allowedOrigin }));
  app.use(express.json({ limit: '32kb' }));

  app.get('/api/health', (_req, res) => res.json({ status: 'ok', configured: Boolean(process.env.GEMINI_API_KEY) }));

  app.post('/api/bug-reports/generate', upload.single('screenshot'), async (req, res) => {
    const file = req.file;
    const description = typeof req.body.description === 'string' ? req.body.description.trim() : '';
    let environment = EMPTY_ENVIRONMENT;
    if (typeof req.body.environmentMetadata === 'string') {
      try {
        const parsed = environmentSchema.safeParse(JSON.parse(req.body.environmentMetadata));
        if (!parsed.success) return res.status(400).json(errorResponse('INVALID_ENVIRONMENT_METADATA', 'Environment metadata was not in the expected format.', 400));
        environment = normalizeEnvironment(parsed.data);
      } catch {
        return res.status(400).json(errorResponse('INVALID_ENVIRONMENT_METADATA', 'Environment metadata was not valid JSON.', 400));
      }
    }
    if (!file) return res.status(400).json(errorResponse('INVALID_IMAGE', 'Add a PNG, JPEG, or WebP screenshot up to 8 MB.', 400));
    if (!ACCEPTED_MIME_TYPES.includes(file.mimetype as (typeof ACCEPTED_MIME_TYPES)[number]) || !hasImageSignature(file.buffer, file.mimetype)) {
      return res.status(415).json(errorResponse('INVALID_IMAGE', 'The uploaded file is not a supported image.', 415));
    }
    if (!description) return res.status(400).json(errorResponse('EMPTY_DESCRIPTION', 'Describe what happened and what you expected.', 400));
    if (description.length > 5000) return res.status(400).json(errorResponse('DESCRIPTION_TOO_LONG', 'Keep the description under 5,000 characters.', 400));
    if (!process.env.GEMINI_API_KEY?.trim()) return res.status(503).json(errorResponse('AI_NOT_CONFIGURED', 'Add GEMINI_API_KEY to the server environment to enable live analysis.', 503));

    try {
      const report = await generateWithGemma({ image: file.buffer, mimeType: file.mimetype, description, environment });
      const validated = bugReportSchema.parse({
        ...report,
        environment,
        missingInformation: Array.from(new Set([...report.missingInformation, ...environmentMissingPrompts(environment)])),
      });
      return res.json({ report: validated, model: process.env.GEMMA_MODEL?.trim() || 'gemma-4-26b-a4b-it' });
    } catch (error) {
      const code = error instanceof Error ? error.message : 'AI_PROVIDER_ERROR';
      if (code === 'AI_TIMEOUT') return res.status(504).json(errorResponse(code, 'Gemma took too long to respond. Your input is still here; retry when ready.', 504));
      if (code === 'MODEL_MALFORMED_JSON' || code === 'MODEL_SCHEMA_INVALID') return res.status(502).json(errorResponse(code, 'Gemma returned a report in an unexpected format. Please retry.', 502));
      console.error(`[bug-report] provider failure: ${code}`);
      return res.status(502).json(errorResponse('AI_PROVIDER_ERROR', 'The AI provider could not complete this report. Please retry.', 502));
    }
  });

  const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
    if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') return res.status(413).json(errorResponse('IMAGE_TOO_LARGE', 'Keep screenshots under 8 MB.', 413));
    if (error instanceof multer.MulterError || error?.message === 'Unexpected field') return res.status(400).json(errorResponse('INVALID_UPLOAD', 'Upload exactly one supported screenshot.', 400));
    return res.status(500).json(errorResponse('INTERNAL_ERROR', 'Something went wrong while processing the request.', 500));
  };
  app.use(errorHandler);
  return app;
}
