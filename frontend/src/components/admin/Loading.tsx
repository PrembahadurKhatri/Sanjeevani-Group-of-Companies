import GroupEmblem from "@/components/GroupEmblem";

// Loading states for the admin: a placeholder card in the shape of the list
// that is about to appear, a small inline spinner for counts, and the
// branded screen shown while the admin itself opens.

export function LoadingBlock({ label = "Loading…", rows = 5 }: { label?: string; rows?: number }) {
  return (
    <div className="adm-loading" role="status" aria-live="polite">
      <div className="adm-loading-head">
        <span className="adm-spinner-ring" aria-hidden="true" />
        <span>{label}</span>
      </div>
      <div className="adm-loading-rows" aria-hidden="true">
        {Array.from({ length: rows }, (_, i) => (
          <div className="adm-loading-row" key={i}>
            <span className="adm-shimmer is-avatar" />
            <span className="adm-loading-lines">
              <span className="adm-shimmer" style={{ width: `${62 - (i % 3) * 12}%` }} />
              <span className="adm-shimmer is-thin" style={{ width: `${38 - (i % 2) * 10}%` }} />
            </span>
            <span className="adm-shimmer is-pill" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function LoadingInline({ label = "Loading" }: { label?: string }) {
  return (
    <span className="adm-loading-inline" role="status">
      <span className="adm-spinner-ring is-small" aria-hidden="true" />
      {label}…
    </span>
  );
}

export function LoadingScreen({ label = "Opening your workspace" }: { label?: string }) {
  return (
    <main className="adm adm-center adm-loading-screen" aria-busy="true">
      <div className="adm-loading-brand" role="status">
        <span className="adm-loading-emblem" aria-hidden="true"><GroupEmblem /></span>
        <strong>Sanjeevani Group</strong>
        <span className="adm-loading-bar" aria-hidden="true"><span /></span>
        <span className="adm-muted">{label}…</span>
      </div>
    </main>
  );
}
