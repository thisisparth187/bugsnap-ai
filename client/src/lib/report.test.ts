import { describe, expect, it } from 'vitest';
import { reportToMarkdown } from './report';

describe('reportToMarkdown', () => {
  it('creates a GitHub-ready issue body', () => {
    const markdown = reportToMarkdown({ title: 'Clipped button', summary: 'Summary', observedBehavior: 'Observed', expectedBehavior: 'Expected', reproductionSteps: ['Open page'], environment: 'Unknown', visibleEvidence: ['Button is clipped'], missingInformation: ['Browser'], hypotheses: ['Unverified hypothesis: overflow'], severitySuggestion: 'medium' });
    expect(markdown).toContain('# Clipped button');
    expect(markdown).toContain('1. Open page');
    expect(markdown).toContain('## Unverified hypotheses');
  });
});
