"use client";

import Image from "next/image";
import Link from "next/link";
import { type FormEvent, type ReactNode, useEffect, useState } from "react";
import GroupEmblem from "@/components/GroupEmblem";
import NewsroomGallery from "@/components/NewsroomGallery";
import type { CompanyProfileData, ProfileLeader } from "@/server/public/company-profile";
import type { SectionKey } from "@/lib/company-sections";

// One company's profile page (/businesses/<slug>), built from what is
// published in Admin → Companies. The sections, their order and labels are
// the company's own (see lib/company-sections.ts); anything not provided is
// simply not shown. Below the hero it reads like the company's own homepage:
// an introduction card with key figures, then each section in turn.

type Img = { url: string; alt: string } | null;
const remote = (src: string) => /^https?:\/\//.test(src);
const TIER_LABEL = { BOARD: "Board of directors", EXECUTIVE: "Executive leadership", TEAM: "Management team" } as const;
const KIND_LABEL: Record<string, string> = { PROJECT: "Project", AWARD: "Award", CERTIFICATION: "Certification", ACHIEVEMENT: "Achievement" };
const RELATION_LABEL: Record<string, string> = { SUBSIDIARY: "Subsidiary", BRAND: "Brand", DIVISION: "Division", ASSOCIATE: "Associate", PARTNER: "Partner" };
const EYEBROW: Partial<Record<SectionKey, string>> = {
  overview: "Who we are", about: "Our story", services: "What we offer", leadership: "Our people", businesses: "Our family of businesses",
  projects: "Our work", news: "Latest updates", careers: "Join us", gallery: "In pictures", contact: "Contact",
};
const paragraphs = (text: string | null | undefined) => (text ?? "").split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
const initials = (name: string) => name.split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
const host = (url: string) => url.replace(/^https?:\/\//, "").replace(/\/$/, "");
const anchor = (key: SectionKey) => (key === "gallery" ? "gallery-section" : key);

// Shown until a company adds its own map or social accounts in the admin.
const GROUP_MAP = "https://maps.google.com/maps?q=Sanjeevani%20Group%20Nepal&output=embed";
const GROUP_SOCIAL = [
  { label: "Facebook", href: "https://www.facebook.com/" },
  { label: "X", href: "https://x.com/" },
  { label: "YouTube", href: "https://www.youtube.com/" },
  { label: "LinkedIn", href: "https://www.linkedin.com/" },
];
const SOCIAL_ICONS: Record<string, ReactNode> = {
  Facebook: <path d="M13.5 21v-8h2.7l.4-3.1h-3.1v-2c0-.9.3-1.5 1.6-1.5h1.7V3.6c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3v2.1H7.3V13h2.8v8h3.4Z" />,
  X: <path d="M18.9 3h2.9l-6.4 7.3L23 21h-6l-4.7-6.2L6.9 21H4l6.8-7.8L3.3 3h6.2l4.2 5.7L18.9 3Zm-1 16h1.6L8.4 4.9H6.7L17.9 19Z" />,
  YouTube: <path d="M23.2 7a3 3 0 0 0-2.1-2.1C19.2 4.4 12 4.4 12 4.4s-7.2 0-9.1.5A3 3 0 0 0 .8 7 31 31 0 0 0 .3 12a31 31 0 0 0 .5 5 3 3 0 0 0 2.1 2.1c1.9.5 9.1.5 9.1.5s7.2 0 9.1-.5a3 3 0 0 0 2.1-2.1 31 31 0 0 0 .5-5 31 31 0 0 0-.5-5ZM9.7 15.5v-7l6 3.5-6 3.5Z" />,
  LinkedIn: <path d="M5.2 7.6a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM3.4 9h3.6v11H3.4V9Zm5.8 0h3.4v1.5h.1a3.7 3.7 0 0 1 3.3-1.8c3.5 0 4.1 2.3 4.1 5.2V20h-3.6v-5.4c0-1.3 0-3-1.8-3s-2.1 1.4-2.1 2.9V20H9.2V9Z" />,
  Instagram: <path d="M12 7.3a4.7 4.7 0 1 0 0 9.4 4.7 4.7 0 0 0 0-9.4Zm0 7.7a3 3 0 1 1 0-6 3 3 0 0 1 0 6Zm6-7.9a1.1 1.1 0 1 1-2.2 0 1.1 1.1 0 0 1 2.2 0ZM21 8.2c-.1-1.5-.4-2.8-1.5-3.8-1-1-2.4-1.4-3.8-1.5-1.5-.1-6-.1-7.5 0-1.5.1-2.8.4-3.8 1.5-1 1-1.4 2.3-1.5 3.8-.1 1.5-.1 6 0 7.5.1 1.5.4 2.8 1.5 3.8 1 1 2.3 1.4 3.8 1.5 1.5.1 6 .1 7.5 0 1.5-.1 2.8-.4 3.8-1.5 1-1 1.4-2.3 1.5-3.8.1-1.5.1-6 0-7.5Zm-2 9.1a3 3 0 0 1-1.7 1.7c-1.2.5-4 .4-5.3.4s-4.1.1-5.3-.4A3 3 0 0 1 5 17.3c-.5-1.2-.4-4-.4-5.3s-.1-4.1.4-5.3A3 3 0 0 1 6.7 5c1.2-.5 4-.4 5.3-.4s4.1-.1 5.3.4A3 3 0 0 1 19 6.7c.5 1.2.4 4 .4 5.3s.1 4.1-.4 5.3Z" />,
};

// Line icons drawn on a 24px grid, inheriting the text colour.
const ICONS = {
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></>,
  pin: <><path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21Z" /><circle cx="12" cy="9.5" r="2.5" /></>,
  phone: <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z" />,
  mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>,
  globe: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3Z" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  building: <><path d="M4 21V5l8-3v19M12 21h8V9l-8-3" /><path d="M8 8h1M8 12h1M8 16h1M15 12h2M15 16h2" /></>,
  target: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.5" /></>,
  eye: <><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></>,
  spark: <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6" />,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  briefcase: <><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18" /></>,
  users: <><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.2a6.5 6.5 0 0 1 3.5 5.8" /></>,
  news: <><path d="M4 5h13v14a2 2 0 0 0 2 2H6a2 2 0 0 1-2-2V5Z" /><path d="M17 9h3v10a2 2 0 0 1-2 2M8 9h5M8 13h5M8 17h3" /></>,
  award: <><circle cx="12" cy="9" r="6" /><path d="m8.5 14-1.5 7 5-2.5 5 2.5-1.5-7" /></>,
} as const;
function Icon({ name }: { name: keyof typeof ICONS }) {
  return <svg className="cxp-icon" viewBox="0 0 24 24" aria-hidden="true">{ICONS[name]}</svg>;
}

function Photo({ image, sizes, className }: { image: Img; sizes: string; className?: string }) {
  if (!image) return null;
  return <Image className={className} src={image.url} alt={image.alt} fill sizes={sizes} unoptimized={remote(image.url)} />;
}

function SectionHead({ id, eyebrow, label, intro, align }: { id: string; eyebrow?: string; label: string; intro?: string; align?: "center" }) {
  return (
    <header className={`cxp-head${align === "center" ? " is-center" : ""}`}>
      {eyebrow && <p className="cxp-eyebrow">{eyebrow}</p>}
      <h2 id={`${id}-title`}>{label}</h2>
      {intro && <p className="cxp-lead">{intro}</p>}
    </header>
  );
}

function LeaderCard({ person }: { person: ProfileLeader }) {
  const bio = paragraphs(person.biography);
  return (
    <li className="cx-person">
      <div className="cx-person-photo">
        {person.photo ? <Photo image={person.photo} sizes="120px" /> : <span aria-hidden="true">{initials(person.name)}</span>}
      </div>
      <div className="cx-person-copy">
        <h4>{person.name}</h4>
        <p className="cx-person-role">{person.title}{person.managingDirector && !/managing director/i.test(person.title) ? ", Managing Director" : ""}</p>
        {person.summary && <p className="cx-person-summary">{person.summary}</p>}
        {(bio.length > 0 || person.career.length > 0) && (
          <details className="cx-person-more">
            <summary>Profile</summary>
            {bio.map((p) => <p key={p}>{p}</p>)}
            {person.career.length > 0 && (
              <ul className="cx-person-career">
                {person.career.map((c) => <li key={`${c.period}-${c.position}`}><strong>{c.position}</strong>, {c.organisation} <span className="num">({c.period})</span></li>)}
              </ul>
            )}
          </details>
        )}
        {person.linkedin && <a className="cx-text-link" href={person.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn profile</a>}
      </div>
    </li>
  );
}

// A leader on the company page: portrait on a green panel, then name, role
// and their message. A long message opens with Read more.
const SHORT_MESSAGE = 260;
function LeaderFeature({ photo, name, role, org, message, fallback, linkedin, pending }: { photo: string; name: string; role: string; org: string; message: string[]; fallback: string; linkedin?: string; pending?: boolean }) {
  const [open, setOpen] = useState(false);
  const text = message.join(" ");
  const long = text.length > SHORT_MESSAGE;
  const preview = long ? `${text.slice(0, text.lastIndexOf(" ", SHORT_MESSAGE)).replace(/[,.;:]$/, "")}…` : text;
  return (
    <article className={`cxp-leader${pending ? " is-pending" : ""}`}>
      <div className="cxp-leader-visual">
        <span className="cxp-leader-mark" aria-hidden="true"><GroupEmblem /></span>
        <div className="cxp-leader-photo"><Image src={photo} alt={pending ? "" : name} fill sizes="(max-width: 780px) 80vw, 320px" unoptimized={remote(photo)} /></div>
        <span className="cxp-leader-role">{role}</span>
      </div>
      <div className="cxp-leader-info">
        <p className="cxp-leader-org">{org}</p>
        <h3>{name}</h3>
        {message.length ? (
          <blockquote className="cxp-leader-message">
            {open ? message.map((p) => <p key={p}>{p}</p>) : <p>{preview}</p>}
          </blockquote>
        ) : <p className="cxp-leader-text">{fallback}</p>}
        {(long || linkedin) && (
          <div className="cxp-leader-links">
            {long && <button type="button" className="cxp-more cxp-readmore" aria-expanded={open} onClick={() => setOpen(!open)}>{open ? "Show less" : "Read more"} <Icon name="arrow" /></button>}
            {linkedin && <a className="cxp-more is-quiet" href={linkedin} target="_blank" rel="noopener noreferrer">LinkedIn <Icon name="arrow" /></a>}
          </div>
        )}
      </div>
    </article>
  );
}

function ContactForm({ companySlug, companyName }: { companySlug: string; companyName: string }) {
  const [state, setState] = useState<{ busy: boolean; ok: boolean; message: string }>({ busy: false, ok: false, message: "" });

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form)) as Record<string, string>;
    setState({ busy: true, ok: false, message: "" });
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, companySlug }),
      });
      const result = (await response.json().catch(() => ({}))) as { message?: string; error?: { message?: string } };
      if (response.ok) {
        form.reset();
        setState({ busy: false, ok: true, message: result.message ?? "Thank you. Your message has been sent." });
      } else {
        setState({ busy: false, ok: false, message: result.error?.message ?? "Please check your details and try again." });
      }
    } catch {
      setState({ busy: false, ok: false, message: "Your message could not be sent. Please check your connection and try again." });
    }
  }

  return (
    <form className="cx-form cxp-form" onSubmit={submit} aria-label={`Send a message to ${companyName}`}>
      <h3>Send us a message</h3>
      <p className="cxp-form-intro">We usually reply within two working days.</p>
      <div className="cx-form-grid">
        <label>Full name<input name="name" required minLength={2} maxLength={120} autoComplete="name" /></label>
        <label>Email<input name="email" type="email" required maxLength={254} autoComplete="email" /></label>
        <label>Phone (optional)<input name="phone" type="tel" maxLength={40} autoComplete="tel" /></label>
        <label>Subject (optional)<input name="subject" maxLength={160} /></label>
        <label className="cx-form-wide">Message<textarea name="message" required minLength={10} maxLength={4000} rows={5} /></label>
        {/* Honeypot: hidden from people, filled in by bots. */}
        <label className="visually-hidden" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
      </div>
      {state.message && <p className={state.ok ? "cx-form-note" : "cx-form-note is-error"} role={state.ok ? "status" : "alert"}>{state.message}</p>}
      <button className="bx-button" type="submit" disabled={state.busy}>{state.busy ? "Sending…" : "Send message"}</button>
    </form>
  );
}

export default function CompanyProfilePage({ data }: { data: CompanyProfileData }) {
  const { company: c } = data;
  const label = (key: SectionKey) => data.sections.find((s) => s.key === key)?.label ?? key;
  const has = (key: SectionKey) => data.sections.some((s) => s.key === key);
  const intro = c.fullDescription ? paragraphs(c.fullDescription) : [];
  const md = data.leaders.flatMap((g) => g.people).find((p) => p.managingDirector);
  const mdPhoto = md?.photo?.url ?? data.chairman?.photo?.url ?? "/chairman.png";
  const primary = c.locations.find((l) => l.isPrimary) ?? c.locations[0];
  const branches = c.locations.filter((l) => l !== primary);
  const otherLocations = has("branches") ? [] : branches;
  const phone = c.phone ?? primary?.phone ?? null;
  const email = c.email ?? primary?.email ?? "info@sanjeevanigroup.com";
  const address = primary?.address || c.headquarters || "Nepal";
  const serviceCount = data.offerings.length || c.services.length;
  const [active, setActive] = useState<SectionKey>("overview");

  // Key figures for the introduction card: founding year, years of service,
  // the company's own numeric facts, and how many services it lists.
  const stats: { value: string; label: string; note?: string }[] = [];
  if (c.establishedYear) {
    stats.push({ value: String(c.establishedYear), label: "Established" });
    const years = new Date().getFullYear() - c.establishedYear;
    if (years >= 2) stats.push({ value: `${years}+`, label: "Years of service" });
  }
  for (const fact of c.keyFacts) {
    const match = /^([\d][\d,.]*\+?)\s*(.*)$/.exec(fact.value);
    if (match) stats.push({ value: match[1], label: fact.label, note: match[2] || undefined });
  }
  if (c.locations.length > 1) stats.push({ value: String(c.locations.length), label: "Locations" });
  if (serviceCount > 1) stats.push({ value: String(serviceCount), label: label("services") });
  if (data.vacancies.length) stats.push({ value: String(data.vacancies.length), label: data.vacancies.length === 1 ? "Open role" : "Open roles" });

  const glance: { icon: keyof typeof ICONS; label: string; value: ReactNode }[] = [
    { icon: "building", label: "Sector", value: c.sectorLabel },
    ...(c.industry ? [{ icon: "briefcase" as const, label: "Industry", value: c.industry }] : []),
    ...(c.establishedYear ? [{ icon: "calendar" as const, label: "Established", value: <span className="num">{c.establishedYear}</span> }] : []),
    ...(c.headquarters ? [{ icon: "pin" as const, label: "Headquarters", value: c.headquarters }] : []),
    ...c.keyFacts.map((f) => ({ icon: "spark" as const, label: f.label, value: f.value })),
    ...(c.sector ? [{ icon: "users" as const, label: "Part of", value: <Link href={`/businesses?group=${c.sector.slug}`}>Sanjeevani Group · {c.sector.name}</Link> }] : []),
    { icon: "globe", label: "Website", value: c.website ? <a href={c.website} target="_blank" rel="noreferrer">{host(c.website)}</a> : "Coming soon" },
  ];

  // Highlight the section in view in the section bar.
  useEffect(() => {
    if (!("IntersectionObserver" in window)) return;
    const targets = data.sections.map((s) => document.getElementById(anchor(s.key))).filter((el): el is HTMLElement => Boolean(el));
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      const key = visible ? data.sections.find((s) => anchor(s.key) === visible.target.id)?.key : undefined;
      if (key) setActive(key);
    }, { rootMargin: "-35% 0px -55% 0px" });
    targets.forEach((t) => observer.observe(t));
    return () => observer.disconnect();
  }, [data.sections]);

  // Sections fade up as they come into view (not for reduced-motion users).
  useEffect(() => {
    const items = Array.from(document.querySelectorAll<HTMLElement>(".cxp-reveal"));
    if (!("IntersectionObserver" in window) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      items.forEach((el) => el.classList.add("is-in"));
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("is-in"); observer.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    items.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [data.sections]);

  const sections: Record<SectionKey, () => JSX.Element | null> = {
    overview: () => (
      <section className="cxp-section cxp-overview cx-block" id="overview" aria-labelledby="overview-title">
        <div className="bx-wrap cxp-overview-grid cxp-reveal">
          <div className="cxp-overview-copy">
            <SectionHead id="overview" eyebrow={EYEBROW.overview} label={label("overview")} />
            <p className="cxp-statement">{c.description}</p>
            {intro.map((p) => <p className="cxp-body" key={p}>{p}</p>)}
            {!intro.length && <p className="cxp-body">{c.name} is one of the independent businesses of Sanjeevani Group, working across {c.sectorLabel.toLowerCase()} in Nepal.</p>}
          </div>
          <aside className="cxp-glance" aria-label={`${c.name} at a glance`}>
            <h3>At a glance</h3>
            <dl>
              {glance.map((g) => (
                <div key={g.label}>
                  <dt><Icon name={g.icon} />{g.label}</dt>
                  <dd>{g.value}</dd>
                </div>
              ))}
            </dl>
            <span className="cxp-glance-mark" aria-hidden="true"><GroupEmblem /></span>
          </aside>
        </div>
        {explore()}
      </section>
    ),
    about: () => (
      <section className="cxp-section cxp-tint cx-block" id="about" aria-labelledby="about-title">
        <div className="bx-wrap">
          <div className="cxp-reveal"><SectionHead id="about" eyebrow={EYEBROW.about} label={label("about")} /></div>
          {(c.mission || c.vision) && (
            <div className="cxp-purpose cxp-reveal">
              {c.mission && <article className="cxp-purpose-card"><span className="cxp-purpose-icon"><Icon name="target" /></span><h3>Our mission</h3><p>{c.mission}</p></article>}
              {c.vision && <article className="cxp-purpose-card is-light"><span className="cxp-purpose-icon"><Icon name="eye" /></span><h3>Our vision</h3><p>{c.vision}</p></article>}
            </div>
          )}
          {(c.background || c.history) && (
            <div className="cxp-story cxp-reveal">
              {c.background && <div><h3>Background</h3>{paragraphs(c.background).map((p) => <p key={p}>{p}</p>)}</div>}
              {c.history && <div><h3>Our history</h3>{paragraphs(c.history).map((p) => <p key={p}>{p}</p>)}</div>}
            </div>
          )}
          {c.coreValues.length > 0 && (
            <div className="cxp-values cxp-reveal">
              <h3>Our core values</h3>
              <ol>{c.coreValues.map((v, i) => <li key={v}><span className="num">{String(i + 1).padStart(2, "0")}</span>{v}</li>)}</ol>
            </div>
          )}
          {c.philosophy && <blockquote className="cxp-quote cxp-reveal"><p>{paragraphs(c.philosophy)[0]}</p>{paragraphs(c.philosophy).slice(1).map((p) => <p className="cxp-quote-more" key={p}>{p}</p>)}<cite>Our philosophy</cite></blockquote>}
          {data.milestones.length > 0 && (
            <div className="cxp-timeline cxp-reveal">
              <h3>Milestones</h3>
              <ol>
                {data.milestones.map((m) => (
                  <li key={m.id}>
                    {m.date && <span className="cxp-timeline-date num">{m.date}</span>}
                    <strong>{m.title}</strong>
                    {m.description && <p>{m.description}</p>}
                  </li>
                ))}
              </ol>
            </div>
          )}
          {!c.background && !c.history && !c.mission && !c.vision && !c.coreValues.length && !c.philosophy && !data.milestones.length && <p className="cx-empty">More about {c.name} will be added soon.</p>}
        </div>
      </section>
    ),
    services: () => (
      <section className="cxp-section cx-block" id="services" aria-labelledby="services-title">
        <div className="bx-wrap">
          <div className="cxp-reveal"><SectionHead id="services" eyebrow={EYEBROW.services} label={label("services")} intro={serviceCount ? `${serviceCount} ${label("services").toLowerCase()} offered by ${c.shortName ?? c.name}.` : undefined} /></div>
          {data.offerings.length > 0 ? (
            <ul className="cxp-offerings cxp-reveal">
              {data.offerings.map((o, i) => (
                <li key={o.slug} className="cxp-offering">
                  <div className="cxp-offering-media">
                    {o.image ? <Photo image={o.image} sizes="(max-width: 640px) 92vw, 380px" /> : <span className="cxp-offering-num num">{String(i + 1).padStart(2, "0")}</span>}
                  </div>
                  <div className="cxp-offering-body">
                    <h3>{o.title}</h3>
                    {o.summary && <p>{o.summary}</p>}
                    {o.hasDetail && <Link className="cxp-more" href={`/businesses/${c.slug}/${o.slug}`}>Learn more <Icon name="arrow" /><span className="visually-hidden"> about {o.title}</span></Link>}
                  </div>
                </li>
              ))}
            </ul>
          ) : c.services.length > 0 ? (
            <ul className="cxp-tiles cxp-reveal">
              {c.services.map((s, i) => <li key={s}><span className="num">{String(i + 1).padStart(2, "0")}</span><strong>{s}</strong></li>)}
            </ul>
          ) : (
            <p className="cx-empty">Details of our {label("services").toLowerCase()} will be added soon.</p>
          )}
        </div>
      </section>
    ),
    leadership: () => (
      <section className="cxp-section cxp-tint cx-block cxp-leaders" id="leadership" aria-labelledby="leadership-title">
        <div className="bx-wrap">
          <div className="cxp-reveal"><SectionHead id="leadership" eyebrow={EYEBROW.leadership} label={label("leadership")} intro={`The people guiding ${c.shortName ?? c.name} as part of Sanjeevani Group.`} /></div>
          <div className="cxp-leader-grid cxp-reveal">
            <LeaderFeature
              photo={data.chairman?.photo?.url ?? "/chairman.png"}
              name={data.chairman?.name ?? "C.A. Khuma Parsad Aryal"}
              role="Chairman"
              org="Sanjeevani Group"
              message={data.chairman?.message ?? []}
              fallback={`Leads Sanjeevani Group, the family of businesses that ${c.name} belongs to.`}
            />
            <LeaderFeature
              photo={mdPhoto}
              name={md?.name ?? "To be announced"}
              role="Managing Director"
              org={c.name}
              message={md?.message ?? []}
              fallback={md?.summary ?? (md ? `Leads ${c.shortName ?? c.name} day to day.` : `The Managing Director of ${c.shortName ?? c.name} will be introduced here soon.`)}
              linkedin={md?.linkedin ?? undefined}
              pending={!md}
            />
          </div>
          {data.leaders.map((group) => {
            const people = group.people.filter((p) => p !== md);
            if (!people.length) return null;
            return (
              <div className="cx-tier cxp-reveal" key={group.tier}>
                <h3>{TIER_LABEL[group.tier]}</h3>
                <ul className="cx-people">{people.map((p) => <LeaderCard key={p.key} person={p} />)}</ul>
              </div>
            );
          })}
        </div>
      </section>
    ),
    branches: () => (
      <section className="cxp-section cx-block" id="branches" aria-labelledby="branches-title">
        <div className="bx-wrap">
          <div className="cxp-reveal"><SectionHead id="branches" eyebrow="Where to find us" label={label("branches")} intro={branches.length ? `${c.shortName ?? c.name} serves people from ${branches.length + 1} locations.` : undefined} /></div>
          {branches.length ? (
            <ul className="cxp-branches cxp-reveal">
              {branches.map((b) => (
                <li key={b.name + b.address} className="cxp-branch">
                  <div className="cxp-branch-photo">
                    {b.image ? <Photo image={b.image} sizes="(max-width: 640px) 92vw, 380px" /> : c.banner ? <Photo image={{ url: c.banner.url, alt: "" }} sizes="(max-width: 640px) 92vw, 380px" /> : null}
                    <span className="cxp-branch-tag">Branch</span>
                  </div>
                  <div className="cxp-branch-body">
                    <h3>{b.name}</h3>
                    {b.address && <p className="cxp-branch-line"><Icon name="pin" />{b.address}</p>}
                    {b.phone && <p className="cxp-branch-line"><Icon name="phone" /><a href={`tel:${b.phone.replace(/\s+/g, "")}`}>{b.phone}</a></p>}
                    {b.email && <p className="cxp-branch-line"><Icon name="mail" /><a href={`mailto:${b.email}`}>{b.email}</a></p>}
                    <div className="cxp-branch-actions">
                      {b.website && <a className="cxp-more" href={b.website} target="_blank" rel="noopener noreferrer">Visit website <Icon name="arrow" /><span className="visually-hidden"> of {b.name}</span></a>}
                      <a className="cxp-more is-quiet" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${c.name} ${b.name}, ${b.address}`)}`} target="_blank" rel="noopener noreferrer">Directions <Icon name="arrow" /></a>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : <p className="cx-empty">Our branches will be listed here.</p>}
        </div>
      </section>
    ),
    businesses: () => (
      <section className="cxp-section cx-block" id="businesses" aria-labelledby="businesses-title">
        <div className="bx-wrap">
          <div className="cxp-reveal"><SectionHead id="businesses" eyebrow={EYEBROW.businesses} label={label("businesses")} /></div>
          {data.relations.length ? (
            <ul className="cx-cards cx-cards-compact cxp-reveal">
              {data.relations.map((r) => {
                const body = (
                  <>
                    <span className="cx-mini-logo" aria-hidden="true">{r.logo ? <Photo image={r.logo} sizes="56px" /> : initials(r.name)}</span>
                    <span className="cx-card-body">
                      <span className="cx-badge">{RELATION_LABEL[r.type] ?? r.type}</span>
                      <strong>{r.name}</strong>
                      {r.description && <span className="cx-card-text">{r.description}</span>}
                    </span>
                  </>
                );
                return (
                  <li key={r.id} className="cx-card cx-card-row">
                    {r.href ? (r.external ? <a href={r.href} target="_blank" rel="noopener noreferrer">{body}</a> : <Link href={r.href}>{body}</Link>) : <div>{body}</div>}
                  </li>
                );
              })}
            </ul>
          ) : <p className="cx-empty">Related businesses will be listed here.</p>}
        </div>
      </section>
    ),
    projects: () => (
      <section className="cxp-section cxp-tint cx-block" id="projects" aria-labelledby="projects-title">
        <div className="bx-wrap">
          <div className="cxp-reveal"><SectionHead id="projects" eyebrow={EYEBROW.projects} label={label("projects")} /></div>
          {data.achievements.length ? (
            <ul className="cx-cards cxp-reveal">
              {data.achievements.map((a) => (
                <li key={a.id} className="cx-card">
                  <div className="cx-card-photo">{a.image ? <Photo image={a.image} sizes="(max-width: 640px) 92vw, 380px" /> : <span className="cx-card-placeholder" aria-hidden="true"><Icon name="award" /></span>}</div>
                  <div className="cx-card-body">
                    <p className="cx-card-meta"><span className="cx-badge">{KIND_LABEL[a.kind] ?? a.kind}</span>{a.date && <span className="num">{a.date}</span>}</p>
                    <h3>{a.title}</h3>
                    {a.description && <p>{a.description}</p>}
                  </div>
                </li>
              ))}
            </ul>
          ) : <p className="cx-empty">Projects and achievements will be added soon.</p>}
        </div>
      </section>
    ),
    news: () => (
      <section className="cxp-section cx-block" id="news" aria-labelledby="news-title">
        <div className="bx-wrap">
          <div className="cxp-head-row cxp-reveal">
            <SectionHead id="news" eyebrow={EYEBROW.news} label={label("news")} />
            <Link className="cxp-more" href="/newsroom">All news <Icon name="arrow" /></Link>
          </div>
          {data.news.length ? (
            <ul className="cx-cards cxp-reveal">
              {data.news.map((n) => (
                <li key={n.id} className="cx-card">
                  <Link href={n.href} className="cx-card-link">
                    <div className="cx-card-photo">{n.cover ? <Photo image={n.cover} sizes="(max-width: 640px) 92vw, 380px" /> : <span className="cx-card-placeholder" aria-hidden="true"><GroupEmblem /></span>}</div>
                    <div className="cx-card-body">
                      <time className="cx-card-meta num">{n.date}</time>
                      <h3>{n.title}</h3>
                      {n.excerpt && <p>{n.excerpt}</p>}
                      <span className="cxp-more">Read more <Icon name="arrow" /></span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : <p className="cx-empty">News from {c.name} will appear here.</p>}
        </div>
      </section>
    ),
    careers: () => (
      <section className="cxp-careers cx-block" id="careers" aria-labelledby="careers-title">
        <div className="bx-wrap cxp-careers-grid cxp-reveal">
          <div className="cxp-careers-copy">
            <p className="cxp-eyebrow">{EYEBROW.careers}</p>
            <h2 id="careers-title">{label("careers")}</h2>
            <p>{data.vacancies.length ? `Build your career with ${c.shortName ?? c.name}. ${data.vacancies.length} ${data.vacancies.length === 1 ? "role is" : "roles are"} open right now.` : `There are no open vacancies at ${c.shortName ?? c.name} right now. New roles across Sanjeevani Group are posted on our careers page.`}</p>
            <Link className="cxp-button is-light" href="/careers">Explore careers <Icon name="arrow" /></Link>
          </div>
          {data.vacancies.length > 0 && (
            <ul className="cxp-jobs">
              {data.vacancies.map((v) => (
                <li key={v.id}>
                  <Link href={v.href}>
                    <span className="cxp-job-title">{v.title}</span>
                    <span className="cxp-job-meta"><span>{v.location}</span><span>{v.type}</span><span>Apply by <span className="num">{v.deadline}</span></span></span>
                    <Icon name="arrow" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    ),
    gallery: () => (
      <section className="cxp-section cx-block cx-gallery" id="gallery-section" aria-label={label("gallery")}>
        <div className="bx-wrap cxp-reveal">
          {data.gallery.length ? (
            <NewsroomGallery renderYouTube={() => null} photos={data.gallery} videos={[]} heading={label("gallery")} idPrefix="company-gallery" photosOnly pageSize={9} />
          ) : (
            <><SectionHead id="gallery-section" eyebrow={EYEBROW.gallery} label={label("gallery")} /><p className="cx-empty">Photos will be added soon.</p></>
          )}
        </div>
      </section>
    ),
    contact: () => (
      <section className="cxp-section cxp-tint cxp-contact cx-block" id="contact" aria-labelledby="contact-title">
        <div className="bx-wrap">
          <div className="cxp-reveal"><SectionHead id="contact" eyebrow={EYEBROW.contact} label={label("contact")} intro={`Questions, appointments or partnerships: reach ${c.shortName ?? c.name} directly.`} /></div>
          <div className="cxp-contact-grid cxp-reveal">
            <aside className="cxp-contact-card">
              <ul className="cxp-contact-list">
                <li><Icon name="pin" /><span><small>{primary ? primary.name : "Address"}</small>{address}</span></li>
                {phone && <li><Icon name="phone" /><span><small>Phone</small><a href={`tel:${phone.replace(/\s+/g, "")}`}>{phone}</a></span></li>}
                <li><Icon name="mail" /><span><small>Email</small><a href={`mailto:${email}`}>{email}</a></span></li>
                {c.website && <li><Icon name="globe" /><span><small>Website</small><a href={c.website} target="_blank" rel="noreferrer">{host(c.website)}</a></span></li>}
                {c.officeHours && <li><Icon name="clock" /><span><small>Office hours</small>{c.officeHours}</span></li>}
                {c.registeredAddress && <li><Icon name="building" /><span><small>Registered office</small>{c.registeredAddress}</span></li>}
              </ul>
              {otherLocations.length > 0 && (
                <div className="cxp-offices">
                  <h3>Other offices</h3>
                  <ul>
                    {otherLocations.map((l) => (
                      <li key={l.name + l.address}><strong>{l.name}</strong>{l.address && <span>{l.address}</span>}{l.phone && <a href={`tel:${l.phone.replace(/\s+/g, "")}`}>{l.phone}</a>}</li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="cxp-map">
                <iframe src={c.mapUrl ?? GROUP_MAP} title={`Map: ${c.mapUrl ? c.name : "Sanjeevani Group"}`} loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen />
              </div>
              <div className="cxp-contact-actions">
                <span className="cxp-follow">Follow us</span>
                <ul className="cxp-socials">
                  {(c.social.length ? c.social : GROUP_SOCIAL).map((s) => (
                    <li key={s.label}>
                      <a href={s.href} target="_blank" rel="noopener noreferrer" aria-label={`${c.social.length ? c.name : "Sanjeevani Group"} on ${s.label}`}>
                        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">{SOCIAL_ICONS[s.label]}</svg>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
              <span className="cxp-glance-mark" aria-hidden="true"><GroupEmblem /></span>
            </aside>
            <ContactForm companySlug={c.slug} companyName={c.name} />
          </div>
        </div>
      </section>
    ),
  };

  // A row of links into the page's other sections, under the overview.
  function explore() {
    const tiles: { key: SectionKey; icon: keyof typeof ICONS; text: string }[] = [];
    if (has("about")) tiles.push({ key: "about", icon: "eye", text: c.mission ? "Mission, vision and story" : "Our story" });
    if (has("services") && serviceCount) tiles.push({ key: "services", icon: "spark", text: `${serviceCount} ${label("services").toLowerCase()}` });
    if (has("leadership")) tiles.push({ key: "leadership", icon: "users", text: md ? `${md.name}, Managing Director` : "Chairman and leadership team" });
    if (has("branches") && branches.length) tiles.push({ key: "branches", icon: "pin", text: `${branches.length} ${branches.length === 1 ? "branch" : "branches"}` });
    if (has("projects") && data.achievements.length) tiles.push({ key: "projects", icon: "award", text: `${data.achievements.length} highlights` });
    if (has("news") && data.news.length) tiles.push({ key: "news", icon: "news", text: data.news[0].title });
    if (has("careers")) tiles.push({ key: "careers", icon: "briefcase", text: data.vacancies.length ? `${data.vacancies.length} open ${data.vacancies.length === 1 ? "role" : "roles"}` : "Work with us" });
    tiles.push({ key: "contact", icon: "phone", text: phone ?? "Send us a message" });
    return (
      <div className="bx-wrap cxp-reveal">
        <ul className="cxp-explore">
          {tiles.map((t) => (
            <li key={t.key}>
              <a href={`#${anchor(t.key)}`}>
                <span className="cxp-explore-icon"><Icon name={t.icon} /></span>
                <span className="cxp-explore-text"><strong>{label(t.key)}</strong><span>{t.text}</span></span>
                <span className="cxp-explore-arrow"><Icon name="arrow" /></span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <>
      {data.preview && (
        <p className="cx-preview-bar" role="status">
          Preview{data.status !== "PUBLISHED" ? `: this company is ${data.status.toLowerCase().replace("_", " ")} and not on the website` : ": drafts are shown"}. Visitors only see published content.
        </p>
      )}
      <section className="cx-hero" aria-labelledby="cx-name">
        {c.banner && <Image className="cx-hero-photo" src={c.banner.url} alt="" fill priority sizes="100vw" unoptimized={remote(c.banner.url)} />}
        <div className="reference-wrap cx-hero-copy">
          <div className="mission-hero-copy">
            <h1 id="cx-name" className="mission-hero-tag">{c.name}</h1>
            <p className="mission-hero-text">
              {c.name} is part of Sanjeevani Group&rsquo;s {(c.sector?.name ?? c.sectorLabel).toLowerCase()} businesses{c.headquarters ? `, based in ${c.headquarters}` : ""}. {c.description}
            </p>
          </div>
        </div>
      </section>

      {/* Introduction card: who the company is, what to do next, key figures. */}
      <section className="cxp-intro" aria-label={`About ${c.name}`}>
        <div className="bx-wrap">
          <div className="cxp-intro-card">
            <div className="cxp-intro-main">
              <span className="cxp-intro-logo" aria-hidden="true">
                {c.logo ? <Image src={c.logo.url} alt="" fill sizes="88px" unoptimized={remote(c.logo.url)} /> : <strong>{initials(c.name)}</strong>}
              </span>
              <div className="cxp-intro-copy">
                <p className="cxp-eyebrow">{c.sector?.name ?? c.sectorLabel} · Sanjeevani Group</p>
                <h2>{c.name}</h2>
                {c.headquarters && <p className="cxp-intro-place"><Icon name="pin" />{c.headquarters}</p>}
              </div>
              <div className="cxp-intro-actions">
                {c.website && <a className="cxp-button" href={c.website} target="_blank" rel="noreferrer">Visit website <Icon name="arrow" /></a>}
                <a className={c.website ? "cxp-button is-ghost" : "cxp-button"} href="#contact">Get in touch</a>
                {data.vacancies.length > 0 && <a className="cxp-button is-ghost" href="#careers">Careers</a>}
              </div>
            </div>
            {stats.length > 0 && (
              <dl className="cxp-stats">
                {stats.slice(0, 4).map((s) => (
                  <div key={s.label}>
                    <dt>{s.label}{s.note && <small>{s.note}</small>}</dt>
                    <dd className="num">{s.value}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
        </div>
      </section>

      {data.sections.length > 2 && (
        <nav className="cx-tabs cxp-tabs" aria-label={`${c.name} sections`}>
          <div className="bx-wrap">
            <ul>{data.sections.map((s) => <li key={s.key}><a href={`#${anchor(s.key)}`} aria-current={active === s.key ? "true" : undefined}>{s.label}</a></li>)}</ul>
          </div>
        </nav>
      )}

      {data.sections.map((s) => <div key={s.key}>{sections[s.key]()}</div>)}

      {data.related.length > 0 && (
        <section className="cx-related cxp-related" aria-labelledby="cx-related-title">
          <div className="bx-wrap">
            <div className="cxp-head-row">
              <SectionHead id="cx-related" eyebrow="Sanjeevani Group" label={`More in ${(c.sector?.name ?? "Sanjeevani Group").toLowerCase()}`} />
              {c.sector && <Link className="cxp-more" href={`/businesses?group=${c.sector.slug}`}>View all <Icon name="arrow" /></Link>}
            </div>
            <ul className="cx-related-list">
              {data.related.map((item) => (
                <li key={item.slug}>
                  <Link className="cx-related-card" href={`/businesses/${item.slug}`}>
                    <span className="cx-related-photo">{item.photo && <Image src={item.photo} alt="" fill sizes="(max-width: 780px) 90vw, 360px" unoptimized={remote(item.photo)} />}</span>
                    <strong>{item.name}</strong>
                    <span>{item.place ?? c.sectorLabel}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </>
  );
}
