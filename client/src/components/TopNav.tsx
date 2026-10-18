import { Github, Moon, Sun } from 'lucide-react';
import { BrandMark } from './BrandMark';

type Props = { dark: boolean; onToggleTheme: () => void };

export function TopNav({ dark, onToggleTheme }: Props) {
  const repoUrl = import.meta.env.VITE_REPOSITORY_URL as string | undefined;
  return (
    <header className="top-nav">
      <BrandMark />
      <div className="nav-right">
        <span className="engine-chip"><i /> GEMMA 4 ENGINE</span>
        <a className="nav-link" href="#workspace">WORKSPACE</a>
        {repoUrl && <a className="icon-link" href={repoUrl} target="_blank" rel="noreferrer" aria-label="Open repository"><Github size={17} /></a>}
        <button className="theme-button" onClick={onToggleTheme} aria-label={dark ? 'Use light theme' : 'Use dark theme'} title={dark ? 'Use light theme' : 'Use dark theme'}>{dark ? <Sun size={17} /> : <Moon size={17} />}</button>
      </div>
    </header>
  );
}
