import { FileImage, RefreshCcw, UploadCloud, X } from 'lucide-react';
import { useRef, useState } from 'react';

const MAX_FILE_SIZE = 8 * 1024 * 1024;
const ACCEPT = ['image/png', 'image/jpeg', 'image/webp'];

type Props = { file: File | null; previewUrl: string | null; onChange: (file: File | null) => void; disabled?: boolean };

export function ScreenshotUploader({ file, previewUrl, onChange, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState('');

  function choose(next: File | undefined) {
    if (!next) return;
    if (!ACCEPT.includes(next.type)) return setError('Use a PNG, JPEG, or WebP image.');
    if (next.size > MAX_FILE_SIZE) return setError('Keep screenshots under 8 MB.');
    setError('');
    onChange(next);
  }

  return (
    <div className="uploader-wrap">
      <div className={`upload-zone ${dragging ? 'is-dragging' : ''} ${file ? 'has-file' : ''}`} onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={(event) => { event.preventDefault(); setDragging(false); choose(event.dataTransfer.files[0]); }}>
        {previewUrl ? <img className="screenshot-preview" src={previewUrl} alt="Uploaded bug screenshot preview" /> : <div className="upload-empty"><FileImage size={32} strokeWidth={1.5} /><strong>Drop a screenshot here</strong><span>or choose a file from your device</span><button type="button" className="secondary-button" onClick={() => inputRef.current?.click()} disabled={disabled}><UploadCloud size={16} /> CHOOSE IMAGE</button></div>}
        {previewUrl && <div className="preview-overlay"><span><FileImage size={15} /> {file?.name}</span><button type="button" className="replace-button" onClick={() => inputRef.current?.click()} disabled={disabled}><RefreshCcw size={15} /> REPLACE</button></div>}
      </div>
      <input ref={inputRef} type="file" accept={ACCEPT.join(',')} hidden onChange={(event) => choose(event.target.files?.[0])} />
      <div className="upload-meta"><span>PNG / JPG / WEBP</span><span>MAX 8 MB</span>{file && <button type="button" className="remove-file" onClick={() => { onChange(null); setError(''); if (inputRef.current) inputRef.current.value = ''; }} disabled={disabled}><X size={13} /> REMOVE</button>}</div>
      {error && <p className="field-error" role="alert">{error}</p>}
    </div>
  );
}
