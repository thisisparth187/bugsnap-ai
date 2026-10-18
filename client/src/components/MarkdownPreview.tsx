import { FileText } from 'lucide-react';
import type { BugReport } from '../types';
import { reportToMarkdown } from '../lib/report';

export function MarkdownPreview({ report }: { report: BugReport }) {
  return <section className="markdown-preview"><div className="preview-heading"><span><FileText size={16} /> MARKDOWN PREVIEW</span><span className="preview-note">READY FOR GITHUB ISSUES</span></div><pre>{reportToMarkdown(report)}</pre></section>;
}
