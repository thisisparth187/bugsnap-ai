export function HeroSection() {
  return (
    <section className="hero-section" aria-labelledby="hero-title">
      <div className="hero-copy">
        <p className="eyebrow">SCREENSHOT → ISSUE / 01</p>
        <h1 id="hero-title">From messy screenshots<br /><span>to actionable issues.</span></h1>
        <p className="hero-description">BugSnap AI turns the visual evidence you already have into a clear, editable bug report — without pretending it knows what it cannot see.</p>
      </div>
      <div className="hero-art" aria-hidden="true">
        <div className="art-window"><div className="art-bar"><b /><b /><b /></div><div className="art-lines"><i /><i /><i /><strong /></div><div className="art-cursor" /></div>
        <span className="art-sticker">EVIDENCE<br />FIRST<span>✦</span></span>
      </div>
    </section>
  );
}
