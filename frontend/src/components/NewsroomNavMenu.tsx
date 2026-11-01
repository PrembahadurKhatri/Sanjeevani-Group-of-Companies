"use client";

import Link from "next/link";

const newsroomLinks = [
  { label: "News", href: "/newsroom/news" },
  { label: "Events", href: "/newsroom/events" },
  { label: "Press Releases", href: "/newsroom/press-releases" },
  { label: "Notices", href: "/newsroom/notices" },
  { label: "Gallery", href: "/gallery" },
];

// Same pattern as the About us menu: hover or keyboard focus opens the list
// on desktop; in the mobile menu the links are listed under Newsroom.
export default function NewsroomNavMenu({ isCurrent = false }: { isCurrent?: boolean }) {
  return (
    <div className="reference-nav-item newsroom-nav-item">
      <Link className={isCurrent ? "is-current" : ""} href="/newsroom" aria-haspopup="true">
        Newsroom <span className="reference-nav-chevron" aria-hidden="true">⌄</span>
      </Link>
      <div className="nav-simple-dropdown">
        {newsroomLinks.map((item) => (
          <Link href={item.href} key={item.href}>{item.label}</Link>
        ))}
      </div>
    </div>
  );
}
