import { render } from '@testing-library/react';
import { screen } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { AppShell } from './AppShell';

const report = { title: 'Button clipped', summary: 'A button is cut off.', observedBehavior: 'The button is clipped.', expectedBehavior: 'The button should be visible.', reproductionSteps: [], environment: 'Unknown', visibleEvidence: ['The screenshot shows a clipped button.'], missingInformation: ['Viewport size'], hypotheses: ['Unverified hypothesis: overflow.'], severitySuggestion: 'medium' as const };

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
  });
});
