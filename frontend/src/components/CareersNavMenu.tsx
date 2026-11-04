"use client";

import type { MouseEvent } from "react";
import { useState } from "react";
import Link from "next/link";
import { businessGroups, type Business } from "@/data/businesses";

// Full page loads on purpose: the Careers page only reads ?company on mount,
// so a client-side navigation from /careers to itself wouldn't re-filter it.
function navigate(event: MouseEvent<HTMLAnchorElement>, href: string) {
  event.preventDefault();
  window.location.assign(href);
}

export default function CareersNavMenu({
  businesses,
  isCurrent = false,
  onNavigate,
}: {
  businesses: Business[];
  isCurrent?: boolean;
  onNavigate?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [openCategory, setOpenCategory] = useState<string | null>(null);
  return (
    <div className={`reference-nav-item careers-nav-item${open ? " is-open" : ""}`}>
      <Link
        className={isCurrent ? "is-current" : ""}
        href="/careers"
        onClick={(event) => { onNavigate?.(); navigate(event, "/careers"); }}
      >
        Careers <span className="reference-nav-chevron" aria-hidden="true">⌄</span>
      </Link>
      <button className="nav-expand-button" type="button" aria-label="Show careers categories" aria-expanded={open} onClick={() => setOpen(!open)}>⌄</button>
      <div className="nav-simple-dropdown">
        {businessGroups.map((category) => {
          const companies = businesses.filter(category.matches);
          return (
            <div className={`nav-sub-item${openCategory === category.value ? " is-open" : ""}`} key={category.value}>
              <Link
                className={companies.length ? "has-sub" : ""}
                href="/careers"
                onClick={(event) => { onNavigate?.(); navigate(event, "/careers"); }}
              >
                {category.label}
              </Link>
              {companies.length > 0 && (
                <>
                  <button className="nav-expand-button nav-sub-expand-button" type="button" aria-label={`Show ${category.label} companies`} aria-expanded={openCategory === category.value} onClick={() => setOpenCategory(openCategory === category.value ? null : category.value)}>⌄</button>
                  <div className="nav-subflyout" aria-label={`${category.label} companies`}>
                    <span className="nav-subflyout-title">{category.label}</span>
                    {companies.map((business) => {
                      const href = `/careers?company=${encodeURIComponent(business.name)}`;
                      return (
                        <Link href={href} key={business._id} onClick={(event) => { onNavigate?.(); navigate(event, href); }}>
                          {business.name}
                        </Link>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
