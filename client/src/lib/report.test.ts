import { describe, expect, it } from 'vitest';
import { reportToMarkdown } from './report';

const environment = { browser: 'Chrome 140', operatingSystem: 'Windows', deviceType: 'Desktop', applicationUrl: 'Not provided', applicationVersion: 'Not provided', userAgent: 'Mozilla/5.0 test', viewport: { width: 1280, height: 720 }, screen: { width: 1920, height: 1080 }, technicalMetadataIncluded: true, pageUrlIncluded: false, sources: { browser: 'detected' as const, operatingSystem: 'detected' as const, deviceType: 'detected' as const, applicationUrl: 'missing' as const, applicationVersion: 'missing' as const } };

describe('reportToMarkdown', () => {
  it('creates a GitHub-ready issue body', () => {
    const markdown = reportToMarkdown({ title: 'Clipped button', summary: 'Summary', observedBehavior: 'Observed', expectedBehavior: 'Expected', reproductionSteps: ['Open page'], environment, visibleEvidence: ['Button is clipped'], missingInformation: ['Browser'], hypotheses: ['Unverified hypothesis: overflow'], severitySuggestion: 'medium' });
    expect(markdown).toContain('# Clipped button');
    expect(markdown).toContain('1. Open page');
    expect(markdown).toContain('## Unverified hypotheses');
    expect(markdown).toContain('Browser and version: Chrome 140');
    expect(markdown).toContain('Application version: Not provided');
    expect(markdown).toContain('Browser user-agent: Mozilla/5.0 test');
  });
});
