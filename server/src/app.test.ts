import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { createApp } from './app.js';
import { generateWithGemma } from './ai.js';

const environment = vi.hoisted(() => ({
  browser: 'Chrome 140', operatingSystem: 'Windows', deviceType: 'Desktop', applicationUrl: 'Not provided', applicationVersion: 'Not provided', userAgent: 'Mozilla/5.0 test', viewport: { width: 1280, height: 720 }, screen: { width: 1920, height: 1080 }, technicalMetadataIncluded: true, pageUrlIncluded: false,
  sources: { browser: 'detected' as const, operatingSystem: 'detected' as const, deviceType: 'detected' as const, applicationUrl: 'missing' as const, applicationVersion: 'missing' as const },
}));

vi.mock('./ai.js', () => ({
  generateWithGemma: vi.fn(async () => ({ title: 'Broken login button', summary: 'A login control is visibly disabled.', observedBehavior: 'The login button appears greyed out.', expectedBehavior: 'The login button should be available after valid input.', reproductionSteps: [], environment, visibleEvidence: ['Grey button with low contrast label.'], missingInformation: ['Exact steps leading to the state.'], hypotheses: ['Unverified hypothesis: validation state may be blocking submission.'], severitySuggestion: 'medium' })),
}));

const png = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 0]);

describe('bug report API', () => {
  beforeEach(() => { process.env.GEMINI_API_KEY = 'test-key'; });

  it('rejects empty descriptions', async () => {
    const response = await request(createApp()).post('/api/bug-reports/generate').attach('screenshot', png, { filename: 'screen.png', contentType: 'image/png' }).field('description', '');
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('EMPTY_DESCRIPTION');
  });

  it('rejects unsupported files', async () => {
    const response = await request(createApp()).post('/api/bug-reports/generate').attach('screenshot', Buffer.from('nope'), { filename: 'note.txt', contentType: 'text/plain' }).field('description', 'The page is broken.');
    expect(response.status).toBe(400);
  });

  it('rejects oversized images', async () => {
    const oversized = Buffer.alloc(8 * 1024 * 1024 + 1, 1);
    const response = await request(createApp()).post('/api/bug-reports/generate').attach('screenshot', oversized, { filename: 'large.png', contentType: 'image/png' }).field('description', 'The page is broken.');
    expect(response.status).toBe(413);
    expect(response.body.error.code).toBe('IMAGE_TOO_LARGE');
  });

  it('generates a validated report with a mocked model', async () => {
    const response = await request(createApp()).post('/api/bug-reports/generate').attach('screenshot', png, { filename: 'screen.png', contentType: 'image/png' }).field('description', 'I expected the login button to work.');
    expect(response.status).toBe(200);
    expect(response.body.report.title).toBe('Broken login button');
  });

  it('passes supplied browser context to the model and preserves honest missing values', async () => {
    const response = await request(createApp()).post('/api/bug-reports/generate').attach('screenshot', png, { filename: 'screen.png', contentType: 'image/png' }).field('description', 'The login button is clipped.').field('environmentMetadata', JSON.stringify(environment));
    expect(response.status).toBe(200);
    expect(vi.mocked(generateWithGemma)).toHaveBeenCalledWith(expect.objectContaining({ environment }));
    expect(response.body.report.environment.browser).toBe('Chrome 140');
    expect(response.body.report.environment.applicationVersion).toBe('Not provided');
    expect(response.body.report.missingInformation).toContain('Provide the application version if available.');
  });

  it('does not include technical metadata when the user removes it', async () => {
    const optedOut = { ...environment, userAgent: null, viewport: null, screen: null, technicalMetadataIncluded: false };
    const response = await request(createApp()).post('/api/bug-reports/generate').attach('screenshot', png, { filename: 'screen.png', contentType: 'image/png' }).field('description', 'The login button is clipped.').field('environmentMetadata', JSON.stringify(optedOut));
    expect(response.status).toBe(200);
    expect(response.body.report.environment.userAgent).toBeNull();
    expect(response.body.report.environment.viewport).toBeNull();
  });

  it('reports missing API configuration without calling the provider', async () => {
    delete process.env.GEMINI_API_KEY;
    const response = await request(createApp()).post('/api/bug-reports/generate').attach('screenshot', png, { filename: 'screen.png', contentType: 'image/png' }).field('description', 'The page is broken.');
    expect(response.status).toBe(503);
    expect(response.body.error.code).toBe('AI_NOT_CONFIGURED');
  });

  it('maps provider timeouts to a retryable response', async () => {
    vi.mocked(generateWithGemma).mockRejectedValueOnce(new Error('AI_TIMEOUT'));
    const response = await request(createApp()).post('/api/bug-reports/generate').attach('screenshot', png, { filename: 'screen.png', contentType: 'image/png' }).field('description', 'The page is broken.');
    expect(response.status).toBe(504);
    expect(response.body.error.code).toBe('AI_TIMEOUT');
  });
});
