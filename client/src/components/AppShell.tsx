import { AlertCircle, Check, Clipboard, Download, RotateCcw, Sparkles } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { BugDescriptionForm } from './BugDescriptionForm';
import { BugReportEditor } from './BugReportEditor';
import { EnvironmentFields } from './EnvironmentFields';
import { HeroSection } from './HeroSection';
import { AnalysisProgress } from './AnalysisProgress';
import { MarkdownPreview } from './MarkdownPreview';
import { ScreenshotUploader } from './ScreenshotUploader';
import { TopNav } from './TopNav';
import type { BugReport } from '../types';
import { detectEnvironment, refreshClientMetadata } from '../lib/environment';
import { downloadMarkdown, reportToMarkdown } from '../lib/report';
import { apiUrl } from '../lib/api';

function initialDarkMode() {
  const storage = window.localStorage;
  const saved = typeof storage?.getItem === 'function' ? storage.getItem('bugsnap-theme') : null;
  if (saved === 'dark') return true;
  if (saved === 'light') return false;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
}

function apiMessage(body: unknown) {
  if (typeof body === 'object' && body && 'error' in body) {
    const error = (body as { error?: { message?: string } }).error;
    if (error?.message) return error.message;
  }
  return 'We could not generate the report. Check your connection and retry.';
}

export function AppShell() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [report, setReport] = useState<BugReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [dark, setDark] = useState(initialDarkMode);
  const [environment, setEnvironment] = useState(() => detectEnvironment());

  useEffect(() => { if (!file) return setPreviewUrl(null); const url = URL.createObjectURL(file); setPreviewUrl(url); return () => URL.revokeObjectURL(url); }, [file]);
  useEffect(() => { document.documentElement.dataset.theme = dark ? 'dark' : 'light'; if (typeof window.localStorage?.setItem === 'function') window.localStorage.setItem('bugsnap-theme', dark ? 'dark' : 'light'); }, [dark]);
  const canGenerate = Boolean(file && description.trim() && !loading);
  const markdown = useMemo(() => report ? reportToMarkdown(report) : '', [report]);

  async function generate() {
    if (!file) return setError('Add a screenshot before generating a report.');
    if (!description.trim()) return setError('Describe what happened and what you expected.');
    setLoading(true); setError(''); setNotice('');
    const currentEnvironment = refreshClientMetadata(environment);
    setEnvironment(currentEnvironment);
    const formData = new FormData(); formData.append('screenshot', file); formData.append('description', description.trim());
    formData.append('environmentMetadata', JSON.stringify(currentEnvironment));
    try {
      const response = await fetch(apiUrl('/api/bug-reports/generate'), { method: 'POST', body: formData });
      const body = await response.json() as { report?: BugReport };
      if (!response.ok || !body.report) throw new Error(apiMessage(body));
      setReport(body.report); setNotice('Report ready — review every field before filing.');
      document.getElementById('report-workspace')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'The request failed. Retry when ready.'); }
    finally { setLoading(false); }
  }

  async function copyMarkdown() {
    if (!report) return;
    await navigator.clipboard.writeText(markdown); setNotice('Markdown copied to your clipboard.');
  }

  function startOver() { setFile(null); setDescription(''); setReport(null); setEnvironment(detectEnvironment()); setError(''); setNotice(''); window.scrollTo({ top: 0, behavior: 'smooth' }); }

  return <div className="app-shell"><TopNav dark={dark} onToggleTheme={() => setDark((value) => !value)} /><main><HeroSection /><section className="workspace" id="workspace"><div className="section-kicker"><span>01 / CAPTURE</span><i /><span>02 / CONTEXT</span><i /><span>03 / REPORT</span></div><div className="workspace-grid"><section className="capture-column" aria-labelledby="capture-heading"><div className="section-heading"><div><p className="eyebrow">START WITH THE SIGNAL</p><h2 id="capture-heading">Show us the bug.</h2></div><span className="step-number">01</span></div><ScreenshotUploader file={file} previewUrl={previewUrl} onChange={setFile} disabled={loading} /><BugDescriptionForm value={description} onChange={setDescription} disabled={loading} /><EnvironmentFields environment={environment} onChange={setEnvironment} /><button className="primary-button generate-button" onClick={generate} disabled={!canGenerate}>{loading ? <><Sparkles className="spin" size={18} /> ANALYZING EVIDENCE</> : <><Sparkles size={18} /> GENERATE BUG REPORT <span>↗</span></>}</button>{error && <div className="alert error" role="alert"><AlertCircle size={18} /><span>{error}</span><button onClick={() => setError('')} aria-label="Dismiss error">×</button></div>}{notice && <div className="alert success" role="status"><Check size={18} /><span>{notice}</span></div>}<div className="privacy-note"><span className="privacy-mark">◌</span><div><strong>Evidence-aware by design.</strong><p>Your screenshot is held in memory for this request only. The report keeps visible evidence, your facts, unknowns, and hypotheses in separate lanes.</p></div></div></section><section className="report-column" id="report-workspace" aria-labelledby="report-heading"><div className="section-heading report-heading"><div><p className="eyebrow">YOUR ISSUE, UNPOLISHED</p><h2 id="report-heading">Review the signal.</h2></div><span className="step-number">03</span></div>{loading ? <AnalysisProgress /> : report ? <><BugReportEditor report={report} onChange={setReport} /><MarkdownPreview report={report} /><div className="report-actions"><button className="secondary-button" onClick={copyMarkdown}><Clipboard size={16} /> COPY MARKDOWN</button><button className="secondary-button" onClick={() => downloadMarkdown(report)}><Download size={16} /> DOWNLOAD .MD</button><button className="text-button" onClick={startOver}><RotateCcw size={15} /> START OVER</button></div></> : <div className="report-empty"><div className="empty-graphic"><span>?</span><b /><b /><b /></div><h3>Your report will land here.</h3><p>Upload a screenshot and add the human context. You stay in control of the final issue.</p><div className="empty-legend"><span><i className="lime-dot" /> VISIBLE</span><span><i className="orange-dot" /> UNKNOWN</span><span><i className="blue-dot" /> UNVERIFIED</span></div></div>}</section></div></section><footer className="footer"><span>BUGSNAP AI / 2026</span><span>BUILT FOR CLEARER DEBUGGING</span><span>POWERED BY GEMMA 4</span></footer></main></div>;
}
