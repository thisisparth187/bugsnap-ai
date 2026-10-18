import { describe, expect, it } from 'vitest';
import { bugReportSchema, parseModelJson } from './report.js';

const valid = { title: 'Button is clipped', summary: 'The button is partially hidden.', observedBehavior: 'The button is clipped at the right edge.', expectedBehavior: 'The button should be fully visible.', reproductionSteps: [], environment: 'Unknown', visibleEvidence: ['A dark button is visibly cut off.'], missingInformation: ['What browser and viewport size were used?'], hypotheses: ['Unverified hypothesis: the layout may overflow at this width.'], severitySuggestion: 'medium' as const };

describe('bug report schema', () => {
  it('accepts the required report shape', () => expect(bugReportSchema.parse(valid)).toEqual(valid));
  it('rejects an invalid severity', () => expect(() => bugReportSchema.parse({ ...valid, severitySuggestion: 'urgent' })).toThrow());
  it('parses fenced JSON', () => expect(parseModelJson(`\n\`\`\`json\n${JSON.stringify(valid)}\n\`\`\``)).toEqual(valid));
  it('rejects malformed model output', () => expect(() => parseModelJson('{wat}')).toThrow('MODEL_MALFORMED_JSON'));
});
