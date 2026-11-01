"use client";

import Image from "next/image";
import Link from "next/link";
import { type FormEvent, useState } from "react";
import GroupEmblem from "@/components/GroupEmblem";
import NewsroomGallery from "@/components/NewsroomGallery";
import type { CompanyProfileData, ProfileLeader } from "@/server/public/company-profile";
import type { SectionKey } from "@/lib/company-sections";

// One company's profile page (/businesses/<slug>), built from what is
// published in Admin → Companies. The sections, their order and labels are
// the company's own (see lib/company-sections.ts); anything not provided is
// simply not shown.

type Img = { url: string; alt: string } | null;
const remote = (src: string) => /^https?:\/\//.test(src);
const TIER_LABEL = { BOARD: "Board of directors", EXECUTIVE: "Executive leadership", TEAM: "Management team" } as const;
const KIND_LABEL: Record<string, string> = { PROJECT: "Project", AWARD: "Award", CERTIFICATION: "Certification", ACHIEVEMENT: "Achievement" };
const RELATION_LABEL: Record<string, string> = { SUBSIDIARY: "Subsidiary", BRAND: "Brand", DIVISION: "Division", ASSOCIATE: "Associate", PARTNER: "Partner" };
const paragraphs = (text: string | null | undefined) => (text ?? "").split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
const initials = (name: string) => name.split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
const host = (url: string) => url.replace(/^https?:\/\//, "").replace(/\/$/, "");

function Photo({ image, sizes, className }: { image: Img; sizes: string; className?: string }) {
  if (!image) return null;
  return <Image className={className} src={image.url} alt={image.alt} fill sizes={sizes} unoptimized={remote(image.url)} />;
}

function SectionHead({ id, label, intro }: { id: string; label: string; intro?: string }) {
  return (
    <header className="cx-section-head">
      <h2 id={`${id}-title`}>{label}</h2>
      {intro && <p className="bx-lead">{intro}</p>}
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
    <form className="cx-form" onSubmit={submit} aria-label={`Send a message to ${companyName}`}>
      <h3>Send a message</h3>
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
  const otherLocations = c.locations.filter((l) => l !== primary);
  const facts: { label: string; value: string; href?: string; external?: boolean }[] = [
    { label: "Sector", value: c.sectorLabel },
    ...(c.sector ? [{ label: "Part of", value: c.sector.name, href: `/businesses?group=${c.sector.slug}` }] : []),
    ...(c.industry ? [{ label: "Industry", value: c.industry }] : []),
    ...(c.establishedYear ? [{ label: "Established", value: String(c.establishedYear) }] : []),
    ...(c.headquarters ? [{ label: "Headquarters", value: c.headquarters }] : []),
    ...c.keyFacts,
    { label: "Website", value: c.website ? host(c.website) : "Coming soon", href: c.website ?? undefined, external: true },
  ];

  const sections: Record<SectionKey, () => JSX.Element | null> = {
    overview: () => (
      <section className="cx-overview cx-block" id="overview" aria-labelledby="overview-title">
        <div className="bx-wrap cx-overview-grid">
          <div className="cx-overview-copy">
            <span className="cx-logo" aria-hidden="true">
              {c.logo ? <Image src={c.logo.url} alt="" fill sizes="96px" unoptimized={remote(c.logo.url)} /> : <strong>{initials(c.name)}</strong>}
            </span>
            <h2 id="overview-title">{label("overview")}</h2>
            <p className="bx-lead">{c.description}</p>
            {intro.map((p) => <p className="cx-body" key={p}>{p}</p>)}
          </div>
          <dl className="cx-facts">
            {facts.map((f) => (
              <div key={f.label}>
                <dt>{f.label}</dt>
                <dd className={/^\d+$/.test(f.value) ? "num" : undefined}>
                  {f.href ? (f.external ? <a href={f.href} target="_blank" rel="noreferrer">{f.value}</a> : <Link href={f.href}>{f.value}</Link>) : f.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
        <Highlights />
      </section>
    ),
    about: () => (
      <section className="cx-block cx-about" id="about" aria-labelledby="about-title">
        <div className="bx-wrap">
          <SectionHead id="about" label={label("about")} />
          <div className="cx-about-grid">
            {(c.background || c.history) && (
              <div className="cx-about-story">
                {c.background && <><h3>Background</h3>{paragraphs(c.background).map((p) => <p key={p}>{p}</p>)}</>}
                {c.history && <><h3>Our history</h3>{paragraphs(c.history).map((p) => <p key={p}>{p}</p>)}</>}
              </div>
            )}
            {(c.mission || c.vision) && (
              <div className="cx-about-cards">
                {c.mission && <article className="cx-statement"><h3>Mission</h3><p>{c.mission}</p></article>}
                {c.vision && <article className="cx-statement"><h3>Vision</h3><p>{c.vision}</p></article>}
              </div>
            )}
          </div>
          {c.coreValues.length > 0 && (
            <div className="cx-values">
              <h3>Core values</h3>
              <ul>{c.coreValues.map((v) => <li key={v}>{v}</li>)}</ul>
            </div>
          )}
          {c.philosophy && <blockquote className="cx-philosophy"><h3>Our philosophy</h3>{paragraphs(c.philosophy).map((p) => <p key={p}>{p}</p>)}</blockquote>}
          {data.milestones.length > 0 && (
            <div className="cx-milestones">
              <h3>Milestones</h3>
              <ol>
                {data.milestones.map((m) => (
                  <li key={m.id}>
                    {m.date && <span className="cx-milestone-date num">{m.date}</span>}
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
      <section className="cx-block cx-services" id="services" aria-labelledby="services-title">
        <div className="bx-wrap">
          <SectionHead id="services" label={label("services")} />
          {data.offerings.length > 0 ? (
            <ul className="cx-cards">
              {data.offerings.map((o) => (
                <li key={o.slug} className="cx-card">
                  {o.image && <div className="cx-card-photo"><Photo image={o.image} sizes="(max-width: 640px) 92vw, 380px" /></div>}
                  <div className="cx-card-body">
                    <h3>{o.title}</h3>
                    {o.summary && <p>{o.summary}</p>}
                    {o.hasDetail && <Link className="cx-text-link" href={`/businesses/${c.slug}/${o.slug}`}>Learn more<span className="visually-hidden"> about {o.title}</span></Link>}
                  </div>
                </li>
              ))}
            </ul>
          ) : c.services.length > 0 ? (
            <ul className="cx-chips">{c.services.map((s) => <li key={s}>{s}</li>)}</ul>
          ) : (
            <p className="cx-empty">Details of our {label("services").toLowerCase()} will be added soon.</p>
          )}
        </div>
      </section>
    ),
    leadership: () => (
      <section className="cx-leaders cx-block" id="leadership" aria-labelledby="leadership-title">
        <div className="bx-wrap">
          <h2 id="leadership-title">{label("leadership")}</h2>
          <div className="cx-leader-grid">
            {/* Both cards follow the Leadership page's chairman panel. */}
            <article className="cx-leader">
              <div className="cx-leader-photo">
                <Image src={data.chairman?.photo?.url ?? "/chairman.png"} alt={data.chairman?.name ?? "C.A. Khuma Parsad Aryal"} fill sizes="(max-width: 780px) 70vw, 300px" unoptimized={remote(data.chairman?.photo?.url ?? "")} />
              </div>
              <div className="cx-leader-copy">
                <h3>{data.chairman?.name ?? "C.A. Khuma Parsad Aryal"}</h3>
                <p className="cx-leader-role">Chairman</p>
                <p className="cx-leader-org">Sanjeevani Group</p>
                <Link className="cx-leader-link" href="/chairman">View details</Link>
              </div>
              <span className="cx-leader-mark" aria-hidden="true"><GroupEmblem /></span>
            </article>
            <article className="cx-leader">
              <div className="cx-leader-photo">
                {/* The Managing Director shows the Chairman's portrait until their own photo is added. */}
                <Image src={mdPhoto} alt={md?.name ?? "Managing director"} fill sizes="(max-width: 780px) 70vw, 300px" unoptimized={remote(mdPhoto)} />
              </div>
              <div className="cx-leader-copy">
                <h3>{md?.name ?? "To be announced"}</h3>
                <p className="cx-leader-role">Managing Director</p>
                <p className="cx-leader-org">{c.name}</p>
              </div>
              <span className="cx-leader-mark" aria-hidden="true"><GroupEmblem /></span>
            </article>
          </div>
          {data.leaders.map((group) => {
            const people = group.people.filter((p) => p !== md);
            if (!people.length) return null;
            return (
              <div className="cx-tier" key={group.tier}>
                <h3>{TIER_LABEL[group.tier]}</h3>
                <ul className="cx-people">{people.map((p) => <LeaderCard key={p.key} person={p} />)}</ul>
              </div>
            );
          })}
        </div>
      </section>
    ),
    businesses: () => (
      <section className="cx-block" id="businesses" aria-labelledby="businesses-title">
        <div className="bx-wrap">
          <SectionHead id="businesses" label={label("businesses")} />
          {data.relations.length ? (
            <ul className="cx-cards cx-cards-compact">
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
      <section className="cx-block cx-alt" id="projects" aria-labelledby="projects-title">
        <div className="bx-wrap">
          <SectionHead id="projects" label={label("projects")} />
          {data.achievements.length ? (
            <ul className="cx-cards">
              {data.achievements.map((a) => (
                <li key={a.id} className="cx-card">
                  {a.image && <div className="cx-card-photo"><Photo image={a.image} sizes="(max-width: 640px) 92vw, 380px" /></div>}
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
      <section className="cx-block" id="news" aria-labelledby="news-title">
        <div className="bx-wrap">
          <SectionHead id="news" label={label("news")} />
          {data.news.length ? (
            <ul className="cx-cards">
              {data.news.map((n) => (
                <li key={n.id} className="cx-card">
                  <Link href={n.href} className="cx-card-link">
                    <div className="cx-card-photo">{n.cover ? <Photo image={n.cover} sizes="(max-width: 640px) 92vw, 380px" /> : <span className="cx-card-placeholder" aria-hidden="true"><GroupEmblem /></span>}</div>
                    <div className="cx-card-body">
                      <time className="cx-card-meta num">{n.date}</time>
                      <h3>{n.title}</h3>
                      {n.excerpt && <p>{n.excerpt}</p>}
                      <span className="cx-text-link">Read more</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : <p className="cx-empty">News from {c.name} will appear here.</p>}
          <p className="cx-more"><Link className="cx-text-link" href="/newsroom">All news from Sanjeevani Group</Link></p>
        </div>
      </section>
    ),
    careers: () => (
      <section className="cx-block cx-alt" id="careers" aria-labelledby="careers-title">
        <div className="bx-wrap">
          <SectionHead id="careers" label={label("careers")} />
          {data.vacancies.length ? (
            <ul className="cx-jobs">
              {data.vacancies.map((v) => (
                <li key={v.id} className="cx-job">
                  <div>
                    <h3>{v.title}</h3>
                    <p className="cx-job-meta"><span>{v.location}</span><span>{v.type}</span><span>Apply by <span className="num">{v.deadline}</span></span></p>
                  </div>
                  <Link className="bx-button" href={v.href}>View and apply<span className="visually-hidden">: {v.title}</span></Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="cx-empty">There are no open vacancies at {c.name} right now. <Link className="cx-text-link" href="/careers">See careers across Sanjeevani Group</Link>.</p>
          )}
        </div>
      </section>
    ),
    gallery: () => (
      <section className="cx-block cx-gallery" id="gallery-section" aria-label={label("gallery")}>
        <div className="bx-wrap">
          {data.gallery.length ? (
            <NewsroomGallery renderYouTube={() => null} photos={data.gallery} videos={[]} heading={label("gallery")} idPrefix="company-gallery" photosOnly pageSize={9} />
          ) : (
            <><SectionHead id="gallery-section" label={label("gallery")} /><p className="cx-empty">Photos will be added soon.</p></>
          )}
        </div>
      </section>
    ),
    contact: () => (
      <section className="cx-contact cx-block" id="contact" aria-labelledby="contact-title">
        <div className="bx-wrap cx-contact-grid">
          <h2 id="contact-title">{label("contact")}</h2>
          <dl className="cx-contact-list">
            <div><dt>Email</dt><dd><a href={`mailto:${c.email ?? primary?.email ?? "info@sanjeevanigroup.com"}`}>{c.email ?? primary?.email ?? "info@sanjeevanigroup.com"}</a></dd></div>
            {(c.phone ?? primary?.phone) && <div><dt>Phone</dt><dd><a href={`tel:${(c.phone ?? primary?.phone ?? "").replace(/\s+/g, "")}`}>{c.phone ?? primary?.phone}</a></dd></div>}
            <div><dt>{primary ? primary.name : "Address"}</dt><dd>{primary?.address || c.headquarters || "Nepal"}</dd></div>
            {c.registeredAddress && <div><dt>Registered office</dt><dd>{c.registeredAddress}</dd></div>}
            {c.officeHours && <div><dt>Office hours</dt><dd>{c.officeHours}</dd></div>}
            {c.website && <div><dt>Website</dt><dd><a href={c.website} target="_blank" rel="noreferrer">{host(c.website)}</a></dd></div>}
          </dl>
          {otherLocations.length > 0 && (
            <div className="cx-locations">
              <h3>Other offices</h3>
              <ul>
                {otherLocations.map((l) => (
                  <li key={l.name + l.address}>
                    <strong>{l.name}</strong>
                    {l.address && <span>{l.address}</span>}
                    {l.phone && <a href={`tel:${l.phone.replace(/\s+/g, "")}`}>{l.phone}</a>}
                    {l.email && <a href={`mailto:${l.email}`}>{l.email}</a>}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="cx-contact-links">
            {(c.mapUrl || primary?.address || c.headquarters) && (
              <a className="cx-text-link" href={c.mapUrl ?? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${c.name}, ${primary?.address || c.headquarters}`)}`} target="_blank" rel="noopener noreferrer">Get directions</a>
            )}
            {c.social.map((s) => <a className="cx-text-link" key={s.label} href={s.href} target="_blank" rel="noopener noreferrer">{s.label}</a>)}
          </div>
          <ContactForm companySlug={c.slug} companyName={c.name} />
        </div>
      </section>
    ),
  };

  // Overview previews of the other sections that have something to show.
  function Highlights() {
    const blocks: JSX.Element[] = [];
    if (has("services") && data.offerings.length) blocks.push(
      <div key="services" className="cx-highlight"><h3>{label("services")}</h3><ul>{data.offerings.slice(0, 4).map((o) => <li key={o.slug}>{o.title}</li>)}</ul><a className="cx-text-link" href="#services">See all</a></div>,
    );
    if (has("leadership")) blocks.push(
      <div key="leadership" className="cx-highlight"><h3>{label("leadership")}</h3><ul><li>{data.chairman?.name ?? "C.A. Khuma Parsad Aryal"}, Chairman</li>{md && <li>{md.name}, Managing Director</li>}{data.leaders.flatMap((g) => g.people).filter((p) => p !== md).slice(0, 2).map((p) => <li key={p.key}>{p.name}, {p.title}</li>)}</ul><a className="cx-text-link" href="#leadership">Meet the team</a></div>,
    );
    if (has("projects") && data.achievements.length) blocks.push(
      <div key="projects" className="cx-highlight"><h3>{label("projects")}</h3><ul>{data.achievements.slice(0, 3).map((a) => <li key={a.id}>{a.title}</li>)}</ul><a className="cx-text-link" href="#projects">See all</a></div>,
    );
    if (has("news") && data.news.length) blocks.push(
      <div key="news" className="cx-highlight"><h3>Latest news</h3><ul>{data.news.slice(0, 2).map((n) => <li key={n.id}><Link href={n.href}>{n.title}</Link></li>)}</ul><a className="cx-text-link" href="#news">More news</a></div>,
    );
    if (has("careers") && data.vacancies.length) blocks.push(
      <div key="careers" className="cx-highlight"><h3>Current vacancies</h3><ul>{data.vacancies.slice(0, 3).map((v) => <li key={v.id}><Link href={v.href}>{v.title}</Link></li>)}</ul><a className="cx-text-link" href="#careers">{data.vacancies.length} open {data.vacancies.length === 1 ? "role" : "roles"}</a></div>,
    );
    blocks.push(
      <div key="contact" className="cx-highlight"><h3>Contact</h3><ul>{(c.phone ?? primary?.phone) && <li>{c.phone ?? primary?.phone}</li>}<li>{c.email ?? primary?.email ?? "info@sanjeevanigroup.com"}</li></ul><a className="cx-text-link" href="#contact">Get in touch</a></div>,
    );
    return <div className="bx-wrap"><div className="cx-highlights">{blocks}</div></div>;
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

      {data.sections.length > 2 && (
        <nav className="cx-tabs" aria-label={`${c.name} sections`}>
          <div className="bx-wrap">
            <ul>{data.sections.map((s) => <li key={s.key}><a href={`#${s.key === "gallery" ? "gallery-section" : s.key}`}>{s.label}</a></li>)}</ul>
          </div>
        </nav>
      )}

      {data.sections.map((s) => <div key={s.key}>{sections[s.key]()}</div>)}

      {data.related.length > 0 && (
        <section className="cx-related" aria-labelledby="cx-related-title">
          <div className="bx-wrap">
            <h2 id="cx-related-title">More in {(c.sector?.name ?? "Sanjeevani Group").toLowerCase()}</h2>
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
