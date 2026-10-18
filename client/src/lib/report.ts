import type { BugReport } from '../types';

const list = (items: string[]) => items.length ? items.map((item, index) => `${index + 1}. ${item}`).join('\n') : '_Not provided._';
const bullets = (items: string[]) => items.length ? items.map((item) => `- ${item}`).join('\n') : '_None recorded._';

export function reportToMarkdown(report: BugReport): string {
  return `# ${report.title}\n\n## Summary\n${report.summary}\n\n## Observed behavior\n${report.observedBehavior}\n\n## Expected behavior\n${report.expectedBehavior}\n\n## Reproduction steps\n${list(report.reproductionSteps)}\n\n## Environment\n${report.environment}\n\n## Visible evidence\n${bullets(report.visibleEvidence)}\n\n## Missing information\n${bullets(report.missingInformation)}\n\n## Unverified hypotheses\n${bullets(report.hypotheses)}\n\n## Suggested severity\n${report.severitySuggestion}\n\n---\n_Generated with BugSnap AI. Evidence, user-provided facts, unknowns, and hypotheses are kept separate._`;
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
