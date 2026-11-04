"use client";

export default function NewsroomPagination({
  page,
  totalItems,
  pageSize,
  onPageChange,
  label,
}: {
  page: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  label: string;
}) {
  const pageCount = Math.ceil(totalItems / pageSize);
  if (pageCount <= 1) return null;

  const visiblePages = Array.from(
    new Set([1, page - 1, page, page + 1, pageCount].filter((value) => value >= 1 && value <= pageCount)),
  ).sort((a, b) => a - b);

  return (
    <nav className="newsroom-pagination" aria-label={`${label} pagination`}>
      <button type="button" onClick={() => onPageChange(page - 1)} disabled={page === 1}>
        Previous
      </button>
      <div className="newsroom-pagination-pages">
        {visiblePages.map((value, index) => (
          <span className="newsroom-pagination-page" key={value}>
            {index > 0 && value - visiblePages[index - 1] > 1 && <span aria-hidden="true">…</span>}
            <button
              type="button"
              onClick={() => onPageChange(value)}
              aria-current={value === page ? "page" : undefined}
              aria-label={`Page ${value}`}
            >
              {value}
            </button>
          </span>
        ))}
      </div>
      <button type="button" onClick={() => onPageChange(page + 1)} disabled={page === pageCount}>
        Next
      </button>
      <span className="visually-hidden" aria-live="polite">Page {page} of {pageCount}</span>
    </nav>
  );
}
