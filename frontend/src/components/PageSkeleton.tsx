// Shown by Next.js while a website page is still loading. Fast pages never
// show it: only a thin progress bar appears at once, and the skeleton fades
// in after a short delay (see .site-skeleton in globals.css).
export default function PageSkeleton() {
  return (
    <div className="site-skeleton" role="status" aria-live="polite" aria-label="Loading the page">
      <span className="site-skeleton-progress" aria-hidden="true"><span /></span>
      <div className="site-skeleton-body" aria-hidden="true">
        <div className="site-skeleton-header">
          <div className="site-skeleton-wrap">
            <span className="sk sk-logo" />
            <span className="site-skeleton-nav">{Array.from({ length: 6 }, (_, i) => <span className="sk sk-nav" key={i} />)}</span>
          </div>
        </div>
        <div className="site-skeleton-hero">
          <div className="site-skeleton-wrap">
            <span className="sk sk-tag" />
            <span className="sk sk-line is-wide" />
            <span className="sk sk-line" />
          </div>
        </div>
        <div className="site-skeleton-wrap site-skeleton-content">
          <span className="sk sk-kicker" />
          <span className="sk sk-title" />
          <span className="sk sk-line is-mid" />
          <div className="site-skeleton-cards">
            {Array.from({ length: 3 }, (_, i) => (
              <div className="site-skeleton-card" key={i}>
                <span className="sk sk-photo" />
                <span className="sk sk-line is-short" />
                <span className="sk sk-line" />
                <span className="sk sk-line is-mid" />
              </div>
            ))}
          </div>
        </div>
      </div>
      <span className="visually-hidden">Loading…</span>
    </div>
  );
}
