import type { BugReport, EnvironmentDetails, EnvironmentField } from '../types';

const list = (items: string[]) => items.length ? items.map((item, index) => `${index + 1}. ${item}`).join('\n') : '_Not provided._';
const bullets = (items: string[]) => items.length ? items.map((item) => `- ${item}`).join('\n') : '_None recorded._';
const environmentFields: EnvironmentField[] = ['browser', 'operatingSystem', 'deviceType', 'applicationUrl', 'applicationVersion'];
const environmentLabels: Record<EnvironmentField, string> = { browser: 'Browser and version', operatingSystem: 'Operating system', deviceType: 'Device type', applicationUrl: 'Application URL', applicationVersion: 'Application version' };

function environmentToMarkdown(environment: EnvironmentDetails) {
  const known = environmentFields.filter((field) => environment.sources[field] === 'detected').map((field) => `- ${environmentLabels[field]}: ${environment[field]}`);
  const userProvided = environmentFields.filter((field) => environment.sources[field] === 'user-provided').map((field) => `- ${environmentLabels[field]}: ${environment[field]}`);
  const missing = environmentFields.filter((field) => environment.sources[field] === 'missing').map((field) => `- ${environmentLabels[field]}: Not provided`);
  const technical = environment.technicalMetadataIncluded ? [
    environment.userAgent ? `- Browser user-agent: ${environment.userAgent}` : '',
    environment.viewport ? `- Viewport: ${environment.viewport.width} × ${environment.viewport.height}` : '',
    environment.screen ? `- Screen: ${environment.screen.width} × ${environment.screen.height}` : '',
  ].filter(Boolean) : [];
  return `### Known environment details\n${known.length ? known.join('\n') : '_None detected._'}${technical.length ? `\n${technical.join('\n')}` : ''}\n\n### User-provided details\n${userProvided.length ? userProvided.join('\n') : '_None provided._'}\n\n### Missing environment information\n${missing.length ? missing.join('\n') : '_No environment details are currently missing._'}`;
}

export function reportToMarkdown(report: BugReport): string {
  return `# ${report.title}\n\n## Summary\n${report.summary}\n\n## Observed behavior\n${report.observedBehavior}\n\n## Expected behavior\n${report.expectedBehavior}\n\n## Reproduction steps\n${list(report.reproductionSteps)}\n\n## Environment\n${environmentToMarkdown(report.environment)}\n\n## Visible evidence\n${bullets(report.visibleEvidence)}\n\n## Missing information\n${bullets(report.missingInformation)}\n\n## Unverified hypotheses\n${bullets(report.hypotheses)}\n\n## Suggested severity\n${report.severitySuggestion}\n\n---\n_Generated with BugSnap AI. Evidence, user-provided facts, unknowns, and hypotheses are kept separate._`;
}

export function downloadMarkdown(report: BugReport) {
  const blob = new Blob([reportToMarkdown(report)], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${report.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'bug-report'}.md`;
  anchor.click();
  URL.revokeObjectURL(url);
}
