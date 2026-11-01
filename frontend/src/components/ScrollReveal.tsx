"use client";

import { useEffect } from "react";

// Fades sections and cards up as they scroll into view, a few at a time, on
// the Newsroom, Gallery, Community and Careers pages. Items added later (Show
// more) animate too. Anything already on screen when the page opens is left
// alone, so nothing flickers; reduced-motion users see no animation.
const SELECTOR = [
  // Newsroom and Gallery
  ".nr-jump-band", ".newsroom-group-heading", ".newsroom-card", ".newsroom-notice", ".newsroom-video",
  ".nr-photos li", ".nr-videos li", ".nr-story-main", ".nr-story-card", ".nr-share",
  // Community
  ".community-foundation-copy", ".community-foundation-photo", ".community-gallery-photo", ".community-gallery-note",
  // Careers
  ".cr-intro", ".cr-toolbar", ".cr-card", ".cr-note", ".vc-list-head", ".vc-role",
].join(",");

export default function ScrollReveal({ scope }: { scope: string }) {
  useEffect(() => {
    if (!("IntersectionObserver" in window) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const root = document.querySelector("main") ?? document.body;

    const reveal = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const el = entry.target as HTMLElement;
        reveal.unobserve(el);
        el.classList.add("rv-in");
        // Hand control back to the element's own hover effects afterwards.
        const delay = parseInt(el.style.getPropertyValue("--rv-delay") || "0", 10);
        window.setTimeout(() => el.classList.remove("rv", "rv-in"), 900 + delay);
      }
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });

    const seen = new WeakSet<HTMLElement>();
    const prepare = (el: HTMLElement) => {
      if (seen.has(el)) return;
      seen.add(el);
      const box = el.getBoundingClientRect();
      if (box.top < window.innerHeight && box.bottom > 0) return; // already visible: leave as is
      if (box.width === 0 && box.height === 0) return; // not displayed (e.g. a closed tab): never hide it
      const index = el.parentElement ? Array.prototype.indexOf.call(el.parentElement.children, el) : 0;
      el.style.setProperty("--rv-delay", `${(index % 6) * 80}ms`);
      el.classList.add("rv");
      reveal.observe(el);
    };

    root.querySelectorAll<HTMLElement>(SELECTOR).forEach(prepare);
    const added = new MutationObserver(() => root.querySelectorAll<HTMLElement>(SELECTOR).forEach(prepare));
    added.observe(root, { childList: true, subtree: true });
    return () => {
      reveal.disconnect();
      added.disconnect();
      // Never leave anything hidden once this stops watching.
      root.querySelectorAll<HTMLElement>(".rv").forEach((el) => el.classList.remove("rv", "rv-in"));
    };
  }, [scope]);
  return null;
}
