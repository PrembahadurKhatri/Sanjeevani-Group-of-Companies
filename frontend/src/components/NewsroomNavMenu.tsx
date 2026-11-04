"use client";

import Link from "next/link";
import { useState } from "react";

const newsroomLinks = [
  { label: "News", href: "/newsroom/news" },
  { label: "Events", href: "/newsroom/events" },
  { label: "Press Releases", href: "/newsroom/press-releases" },
  { label: "Notices", href: "/newsroom/notices" },
  { label: "Gallery", href: "/gallery" },
];

// Same pattern as the About us menu: hover or keyboard focus opens the list
// on desktop; in the mobile menu the links are listed under Newsroom.
export default function NewsroomNavMenu({
  isCurrent = false,
  onNavigate,
}: {
  isCurrent?: boolean;
  onNavigate?: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`reference-nav-item newsroom-nav-item${open ? " is-open" : ""}`}>
      <Link className={isCurrent ? "is-current" : ""} href="/newsroom" onClick={onNavigate}>
        Newsroom <span className="reference-nav-chevron" aria-hidden="true">⌄</span>
      </Link>
      <button className="nav-expand-button" type="button" aria-label="Show newsroom links" aria-expanded={open} onClick={() => setOpen(!open)}>⌄</button>
      <div className="nav-simple-dropdown">
        {newsroomLinks.map((item) => (
          <Link href={item.href} key={item.href} onClick={onNavigate}>{item.label}</Link>
        ))}
      </div>
    </div>
  );
}
