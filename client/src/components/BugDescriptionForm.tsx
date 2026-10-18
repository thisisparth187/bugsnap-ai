type Props = { value: string; onChange: (value: string) => void; disabled?: boolean };

export function BugDescriptionForm({ value, onChange, disabled }: Props) {
  return <div className="field-group"><label htmlFor="bug-description">What happened? <span>REQUIRED</span></label><textarea id="bug-description" value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled} maxLength={5000} placeholder="Tell us what you did, what went wrong, and what you expected to happen…" /><div className="field-foot"><span>Be specific about the gap between actual and expected.</span><span>{value.length}/5000</span></div></div>;
}
