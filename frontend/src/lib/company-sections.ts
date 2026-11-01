// Which sections a company's profile page shows, in what order and under what
// labels. Shared by the admin form and the public page (no I/O).

export const SECTION_KEYS = ["overview", "about", "services", "leadership", "branches", "businesses", "projects", "news", "careers", "gallery", "contact"] as const;
export type SectionKey = (typeof SECTION_KEYS)[number];

export type SectionSetting = { key: SectionKey; enabled: boolean; label?: string; showEmpty?: boolean };
export type ResolvedSection = { key: SectionKey; label: string; enabled: boolean; showEmpty: boolean; core: boolean };

// Overview and Get in touch are always on.
export const CORE_SECTIONS: SectionKey[] = ["overview", "contact"];

export const SECTION_DEFAULTS: Record<SectionKey, { label: string; enabled: boolean; showEmpty: boolean }> = {
  overview: { label: "Overview", enabled: true, showEmpty: true },
  about: { label: "About us", enabled: true, showEmpty: false },
  services: { label: "Services", enabled: true, showEmpty: false },
  leadership: { label: "Leadership", enabled: true, showEmpty: true },
  branches: { label: "Our branches", enabled: true, showEmpty: false },
  businesses: { label: "Our businesses", enabled: true, showEmpty: false },
  projects: { label: "Projects & achievements", enabled: true, showEmpty: false },
  news: { label: "News & updates", enabled: true, showEmpty: false },
  careers: { label: "Careers", enabled: true, showEmpty: false },
  gallery: { label: "Gallery", enabled: true, showEmpty: false },
  contact: { label: "Get in touch", enabled: true, showEmpty: true },
};

const isKey = (value: unknown): value is SectionKey => typeof value === "string" && (SECTION_KEYS as readonly string[]).includes(value);

// The stored settings (any order, possibly missing sections or written by an
// older version) merged with the defaults: every section exactly once, in the
// stored order. A section the company has never set (such as one added in a
// later version) goes right after the section that precedes it by default.
export function resolveSections(stored: unknown, servicesTitle?: string | null): ResolvedSection[] {
  const list = Array.isArray(stored) ? stored : [];
  const seen = new Set<SectionKey>();
  const ordered: SectionSetting[] = [];
  for (const raw of list) {
    if (!raw || typeof raw !== "object") continue;
    const entry = raw as Record<string, unknown>;
    if (!isKey(entry.key) || seen.has(entry.key)) continue;
    seen.add(entry.key);
    ordered.push({
      key: entry.key,
      enabled: typeof entry.enabled === "boolean" ? entry.enabled : SECTION_DEFAULTS[entry.key].enabled,
      label: typeof entry.label === "string" && entry.label.trim() ? entry.label.trim().slice(0, 40) : undefined,
      showEmpty: typeof entry.showEmpty === "boolean" ? entry.showEmpty : undefined,
    });
  }
  for (const [index, key] of SECTION_KEYS.entries()) {
    if (seen.has(key)) continue;
    const before = SECTION_KEYS.slice(0, index).reverse().find((k) => ordered.some((s) => s.key === k));
    const at = before ? ordered.findIndex((s) => s.key === before) + 1 : 0;
    ordered.splice(at, 0, { key, enabled: SECTION_DEFAULTS[key].enabled });
    seen.add(key);
  }

  return ordered.map((s) => {
    const core = CORE_SECTIONS.includes(s.key);
    const fallback = s.key === "services" && servicesTitle?.trim() ? servicesTitle.trim() : SECTION_DEFAULTS[s.key].label;
    return { key: s.key, label: s.label ?? fallback, enabled: core || s.enabled, showEmpty: core || (s.showEmpty ?? SECTION_DEFAULTS[s.key].showEmpty), core };
  });
}

// The sections the public page shows: switched on, and either with published
// content or set to show even when empty.
export function visibleSections(sections: ResolvedSection[], hasContent: Partial<Record<SectionKey, boolean>>): ResolvedSection[] {
  return sections.filter((s) => s.enabled && (s.core || s.showEmpty || hasContent[s.key]));
}
