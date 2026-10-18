import { render } from '@testing-library/react';
import { screen } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { AppShell } from './AppShell';

const report = { title: 'Button clipped', summary: 'A button is cut off.', observedBehavior: 'The button is clipped.', expectedBehavior: 'The button should be visible.', reproductionSteps: [], environment: { browser: 'Chrome 140', operatingSystem: 'Windows', deviceType: 'Desktop', applicationUrl: 'Not provided', applicationVersion: 'Not provided', userAgent: 'Mozilla/5.0 test', viewport: { width: 1280, height: 720 }, screen: { width: 1920, height: 1080 }, technicalMetadataIncluded: true, pageUrlIncluded: false, sources: { browser: 'detected' as const, operatingSystem: 'detected' as const, deviceType: 'detected' as const, applicationUrl: 'missing' as const, applicationVersion: 'missing' as const } }, visibleEvidence: ['The screenshot shows a clipped button.'], missingInformation: ['Viewport size'], hypotheses: ['Unverified hypothesis: overflow.'], severitySuggestion: 'medium' as const };

describe('AppShell', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ report }) }));
    vi.stubGlobal('URL', { ...URL, createObjectURL: vi.fn(() => 'blob:test'), revokeObjectURL: vi.fn() });
    HTMLElement.prototype.scrollIntoView = vi.fn();
  });
  afterEach(() => vi.unstubAllGlobals());

  it('enables generation after an image and description are provided', async () => {
    const user = userEvent.setup();
    render(<AppShell />);
    const generate = screen.getByRole('button', { name: /generate bug report/i });
    expect(generate).toBeDisabled();
    const file = new File([new Uint8Array([137, 80, 78, 71])], 'bug.png', { type: 'image/png' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(input, file);
    await user.type(screen.getByLabelText(/what happened/i), 'The button is clipped; I expected it to fit.');
    expect(generate).toBeEnabled();
    await user.click(generate);
    expect(await screen.findByDisplayValue('Button clipped')).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith('/api/bug-reports/generate', expect.objectContaining({ method: 'POST' }));
    const body = (vi.mocked(fetch).mock.calls[0][1] as RequestInit).body as FormData;
    const submittedEnvironment = JSON.parse(body.get('environmentMetadata') as string);
    expect(submittedEnvironment.userAgent).toBeTruthy();
    expect(submittedEnvironment.viewport.width).toBeTypeOf('number');
    expect(submittedEnvironment.applicationUrl).toBe('Not provided');
    const browserFields = screen.getAllByLabelText('Browser and version');
    const reportBrowserField = browserFields[browserFields.length - 1];
    await user.clear(reportBrowserField);
    await user.type(reportBrowserField, 'Firefox 142');
    const markdownPreview = document.querySelector('.markdown-preview pre');
    expect(markdownPreview).toHaveTextContent('Browser and version: Firefox 142');
    expect(markdownPreview).toHaveTextContent('Application version: Not provided');
  });
});
