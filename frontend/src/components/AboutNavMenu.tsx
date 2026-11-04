"use client";

import Link from "next/link";
import { useState } from "react";

const aboutLinks = [
  { label: "Mission, Vision & Values", href: "/mission-vision-values" },
  { label: "Leadership", href: "/leadership" },
];

export default function AboutNavMenu({ isCurrent = false, onNavigate }: { isCurrent?: boolean; onNavigate?: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`reference-nav-item about-nav-item${open ? " is-open" : ""}`}>
      <Link
        className={isCurrent ? "is-current" : ""}
        href="/about-us"
        onClick={(event) => {
          event.preventDefault();
          onNavigate?.();
          window.location.assign("/about-us");
        }}
      >
        About us <span className="reference-nav-chevron" aria-hidden="true">⌄</span>
      </Link>
      <button className="nav-expand-button" type="button" aria-label="Show About us links" aria-expanded={open} onClick={() => setOpen(!open)}>⌄</button>
      <div className="nav-simple-dropdown">
        {aboutLinks.map((item) => (
          <Link href={item.href} key={item.href} onClick={onNavigate}>{item.label}</Link>
        ))}
      </div>
    </div>
  );
}
