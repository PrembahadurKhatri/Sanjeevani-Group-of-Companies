"use client";

import type { MouseEvent } from "react";
import { useState } from "react";
import Link from "next/link";
import { businessGroups, type Business } from "@/data/businesses";
import { getCompanySlug } from "@/data/companyProfiles";

// Full page loads on purpose: the Businesses page only reads ?group/?search
// on mount, so a client-side navigation from /businesses to itself wouldn't
// re-filter the directory.
function navigate(event: MouseEvent<HTMLAnchorElement>, href: string) {
  event.preventDefault();
  window.location.assign(href);
}

export default function BusinessNavMenu({
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
    <div className={`reference-nav-item${open ? " is-open" : ""}`}>
      <Link
        className={isCurrent ? "is-current" : ""}
        href="/businesses"
        onClick={(event) => { onNavigate?.(); navigate(event, "/businesses"); }}
      >
        Business <span className="reference-nav-chevron" aria-hidden="true">⌄</span>
      </Link>
      <button className="nav-expand-button" type="button" aria-label="Show business categories" aria-expanded={open} onClick={() => setOpen(!open)}>⌄</button>
      <div className="nav-simple-dropdown">
        {businessGroups.map((category) => {
          const categoryHref = `/businesses?group=${category.value}`;
          const companies = businesses.filter(category.matches);
          return (
            <div className={`nav-sub-item${openCategory === category.value ? " is-open" : ""}`} key={category.value}>
              <Link
                className={companies.length ? "has-sub" : ""}
                href={categoryHref}
                onClick={(event) => { onNavigate?.(); navigate(event, categoryHref); }}
              >
                {category.label}
              </Link>
              {companies.length > 0 && (
                <>
                  <button className="nav-expand-button nav-sub-expand-button" type="button" aria-label={`Show ${category.label} companies`} aria-expanded={openCategory === category.value} onClick={() => setOpenCategory(openCategory === category.value ? null : category.value)}>⌄</button>
                  <div className="nav-subflyout" aria-label={`${category.label} companies`}>
                    <span className="nav-subflyout-title">{category.label}</span>
                    {companies.map((business) => (
                      <Link href={`/businesses/${getCompanySlug(business.name)}`} key={business._id} onClick={onNavigate}>
                        {business.name}
                      </Link>
                    ))}
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
