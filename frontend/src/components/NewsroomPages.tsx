"use client";

import Image from "next/image";
import Link from "next/link";
import { type ReactNode, useEffect, useState } from "react";
import NewsroomGallery from "@/components/NewsroomGallery";
import NewsroomPagination from "@/components/NewsroomPagination";
import type { Story } from "@/server/public/newsroom";
import type { CompanyNotice } from "@/data/newsroom";
import { getBusinessLogo } from "@/data/businessLogos";
import type { ArticleData } from "@/server/public/newsroom";
import type { CompanyOfferingData } from "@/server/public/company-profile";

// The Newsroom's News / Events / Press releases pages, a single article, and
// a company's service or product detail page. They reuse the Newsroom's own
// card and layout styles.

const remote = (src: string) => /^https?:\/\//.test(src);
// Newsroom lists use six items per page.
export const NEWSROOM_PAGE = 6;
const PAGE = NEWSROOM_PAGE;

// The green notice cards, shared by the Newsroom page, the Notices page and
// "More notices" under a notice.
export function NoticeCards({ notices, start = 0 }: { notices: CompanyNotice[]; start?: number }) {
  return (
    <ul className="newsroom-notices">
      {notices.map((notice, index) => {
        const logo = getBusinessLogo(notice.company);
        return (
          <li className="newsroom-notice" key={`${notice.company}-${notice.title}`}>
            <div className="newsroom-notice-top">
              <span className="newsroom-notice-badge">Notice {String(start + index + 1).padStart(2, "0")}</span>
              <time>
                <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></svg>
                {notice.date}
              </time>
            </div>
            <h3>{notice.href ? <Link className="newsroom-card-title-link" href={notice.href}>{notice.title}</Link> : notice.title}</h3>
            <div className="newsroom-notice-company">
              <span className="newsroom-notice-logo">
                {logo ? <Image src={logo} alt="" fill sizes="44px" /> : notice.company.split(/\s+/).map((word) => word[0]).slice(0, 2).join("").toUpperCase()}
              </span>
              <span>{notice.company}</span>
            </div>
            {notice.href && <Link className="newsroom-notice-link" href={notice.href}>View notice <span aria-hidden="true">→</span></Link>}
          </li>
        );
      })}
    </ul>
  );
}

// "Read full story" for press releases; "Read more" for news and events.
const readLabel = (href: string) => (href.startsWith("/newsroom/press-releases/") ? "Read full story" : href.startsWith("/newsroom/notices/") ? "View notice" : "Read more");

// Click-to-play YouTube player for story galleries (the video loads only when played).
function StoryVideo({ id, title, thumbnail }: { id: string; title: string; thumbnail?: string }) {
  const [playing, setPlaying] = useState(false);
  if (playing) {
    return <iframe src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1`} title={title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />;
  }
  return (
    <button className="newsroom-video-cover" type="button" onClick={() => setPlaying(true)} aria-label={`Play video: ${title}`}>
      {/* eslint-disable-next-line @next/next/no-img-element -- remote YouTube thumbnail */}
      <img src={thumbnail ?? `https://i.ytimg.com/vi/${id}/hqdefault.jpg`} alt="" />
      <span className="newsroom-video-play" aria-hidden="true">▶</span>
    </button>
  );
}

export function NewsroomCards({ stories }: { stories: Story[] }) {
  return (
    <div className="newsroom-grid">
      {stories.map((story) => (
        <article className="newsroom-card" key={story.href ?? story.title}>
          <div className="newsroom-card-photo">
            <Image src={story.image} alt={story.alt} fill sizes="(max-width: 600px) 100vw, (max-width: 1050px) 50vw, 33vw" unoptimized={remote(story.image)} />
          </div>
          <div className="newsroom-card-body">
            <time>{story.date}</time>
            <h3>{story.href ? <Link className="newsroom-card-title-link" href={story.href}>{story.title}</Link> : story.title}</h3>
            <p>{story.summary}</p>
            {(story.href || story.link || story.location) && (
              <div className="newsroom-card-foot">
                {story.href ? (
                  <Link className="newsroom-card-link" href={story.href}>{readLabel(story.href)} <span aria-hidden="true">→</span></Link>
                ) : story.link ? (
                  <a className="newsroom-card-link" href={story.link} target="_blank" rel="noopener noreferrer">Read more <span aria-hidden="true">↗</span></a>
                ) : null}
                {story.location && (
                  <span className="newsroom-card-location">
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7-6.1-7-11a7 7 0 0 1 14 0c0 4.9-7 11-7 11Z" /><circle cx="12" cy="10" r="2.5" /></svg>
                    {story.location}
                  </span>
                )}
              </div>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}

// A group of story cards on the Newsroom page, 6 at a time.
export function PagedCards({ stories }: { stories: Story[] }) {
  const [page, setPage] = useState(1);
  const start = (page - 1) * PAGE;
  return (
    <>
      <NewsroomCards stories={stories.slice(start, start + PAGE)} />
      <NewsroomPagination page={page} totalItems={stories.length} pageSize={PAGE} onPageChange={setPage} label="Newsroom stories" />
    </>
  );
}

// Line icons for the Newsroom section bar (24px grid, current colour).
const JUMP_ICONS: Record<string, JSX.Element> = {
  news: <><path d="M4 5h13v14a2 2 0 0 0 2 2H6a2 2 0 0 1-2-2V5Z" /><path d="M17 9h3v10a2 2 0 0 1-2 2M8 9h5M8 13h5M8 17h3" /></>,
  "press-releases": <><path d="M4 10v4a1 1 0 0 0 1 1h3l6 4V5L8 9H5a1 1 0 0 0-1 1Z" /><path d="M18 9a4 4 0 0 1 0 6" /></>,
  events: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></>,
  notices: <><path d="M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8" /><path d="M10 20a2 2 0 0 0 4 0" /></>,
  youtube: <><rect x="2.5" y="5" width="19" height="14" rx="4" /><path d="m10 9 5 3-5 3V9Z" /></>,
  gallery: <><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="9" cy="10" r="2" /><path d="m21 16-5-5-9 9" /></>,
};

// The Newsroom's section bar: a pill bar on the patterned band, used on the
// Newsroom page (in-page links) and on each listing page (page links).
export function NewsroomJump({ items, current }: { items: { key: string; label: string; href: string }[]; current?: string }) {
  return (
    <div className="nr-jump-band">
      <p className="nr-jump-kicker">Explore the newsroom</p>
      <nav className="newsroom-jump nr-jump" aria-label="Newsroom sections">
        {items.map((item) => {
          const inner = (
            <>
              <svg viewBox="0 0 24 24" aria-hidden="true">{JUMP_ICONS[item.key]}</svg>
              <span>{item.label}</span>
            </>
          );
          return item.href.startsWith("#")
            ? <a key={item.key} href={item.href}>{inner}</a>
            : <Link key={item.key} href={item.href} aria-current={item.key === current ? "page" : undefined}>{inner}</Link>;
        })}
      </nav>
    </div>
  );
}

const KIND_LINKS = [
  { key: "news", label: "News", href: "/newsroom/news" },
  { key: "events", label: "Events", href: "/newsroom/events" },
  { key: "press-releases", label: "Press releases", href: "/newsroom/press-releases" },
  { key: "notices", label: "Notices", href: "/newsroom/notices" },
];

export function NewsroomListing({ kind, title, stories, notices }: { kind: string; title: string; stories: Story[]; notices?: CompanyNotice[] }) {
  const [page, setPage] = useState(1);
  const start = (page - 1) * PAGE;
  return (
    <section className="newsroom">
      <div className="reference-wrap">
        <NewsroomJump items={[...KIND_LINKS, { key: "gallery", label: "Gallery", href: "/gallery" }]} current={kind} />
        <section className="newsroom-group" aria-labelledby="listing-title">
          <div className="newsroom-group-heading">
            <h2 id="listing-title">{title}</h2>
            <span>{stories.length} {stories.length === 1 ? "update" : "updates"}</span>
          </div>
          {stories.length ? (
            <>
              {notices ? <NoticeCards notices={notices.slice(start, start + PAGE)} start={start} /> : <NewsroomCards stories={stories.slice(start, start + PAGE)} />}
              <NewsroomPagination page={page} totalItems={stories.length} pageSize={PAGE} onPageChange={setPage} label={title} />
            </>
          ) : (
            <p className="newsroom-empty">There is nothing published here yet. Please check back soon.</p>
          )}
        </section>
        <p className="newsroom-contact">For media enquiries, email <a href="mailto:info@sanjeevanigroup.com">info@sanjeevanigroup.com</a>.</p>
      </div>
    </section>
  );
}

type Block = { type?: string; text?: string; items?: string[]; href?: string };

// Article text is stored as blocks and rendered as plain text, never as HTML.
function ArticleBlock({ block }: { block: Block }) {
  if (block.type === "heading" && block.text) return <h2>{block.text}</h2>;
  if (block.type === "list" && Array.isArray(block.items)) return <ul>{block.items.map((item) => <li key={item}>{item}</li>)}</ul>;
  if (block.type === "quote" && block.text) return <blockquote>{block.text}</blockquote>;
  if (block.type === "link" && block.text && block.href && /^(https:\/\/|\/(?!\/))/.test(block.href)) {
    return <p><a href={block.href} {...(block.href.startsWith("/") ? {} : { target: "_blank", rel: "noopener noreferrer" })}>{block.text}</a></p>;
  }
  return block.text ? <p>{block.text}</p> : null;
}

// Share links are built in the browser from the page's own address.
function ShareStory({ title }: { title: string }) {
  const [url, setUrl] = useState("");
  const [copied, setCopied] = useState(false);
  useEffect(() => setUrl(window.location.href), []);
  const u = encodeURIComponent(url);
  const t = encodeURIComponent(title);
  const links = [
    { label: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${u}` },
    { label: "X", href: `https://x.com/intent/post?url=${u}&text=${t}` },
    { label: "LinkedIn", href: `https://www.linkedin.com/sharing/share-offsite/?url=${u}` },
    { label: "WhatsApp", href: `https://wa.me/?text=${t}%20${u}` },
  ];
  return (
    <div className="nr-share">
      <span>Share</span>
      {url && links.map((l) => <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer">{l.label}</a>)}
      <button type="button" onClick={() => { void navigator.clipboard?.writeText(url).then(() => setCopied(true)); }}>{copied ? "Link copied" : "Copy link"}</button>
    </div>
  );
}

const STORY_ICON: Record<string, JSX.Element> = {
  date: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  pin: <><path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21Z" /><circle cx="12" cy="9.5" r="2.5" /></>,
  kind: <><path d="M4 5h13v14a2 2 0 0 0 2 2H6a2 2 0 0 1-2-2V5Z" /><path d="M17 9h3v10a2 2 0 0 1-2 2M8 9h5M8 13h5" /></>,
  company: <><path d="M4 21V5l8-3v19M12 21h8V9l-8-3" /></>,
};

// One story's page: a news article, press release or event.
export function NewsArticle({ article, kind, kindTitle }: { article: ArticleData; kind: string; kindTitle: string }) {
  const facts: { icon: string; label: string; value: ReactNode }[] = [
    { icon: "date", label: kind === "events" ? "Date" : "Published", value: article.date },
    ...(article.when && article.when !== article.date ? [{ icon: "clock", label: "When", value: article.when }] : []),
    ...(article.venue ? [{ icon: "pin", label: "Venue", value: article.venue }] : []),
    { icon: "kind", label: "Category", value: kindTitle },
    ...(article.company ? [{ icon: "company", label: "Company", value: <Link href={`/businesses/${article.company.slug}`}>{article.company.name}</Link> }] : []),
  ];
  const external = article.link && /^https?:/.test(article.link);
  return (
    <article className="newsroom nr-story">
      <div className="reference-wrap">
        <nav className="nr-breadcrumb" aria-label="Breadcrumb">
          <Link href="/newsroom">Newsroom</Link><span aria-hidden="true">/</span><Link href={`/newsroom/${kind}`}>{kindTitle}</Link>
        </nav>
        <div className="nr-story-grid">
          <div className="nr-story-main">
            <header className="nr-story-head">
              <p className="nr-story-meta"><span className="nr-story-badge">{kindTitle}</span><time>{article.date}</time></p>
              <h1>{article.title}</h1>
              {article.excerpt && <p className="nr-article-lead">{article.excerpt}</p>}
            </header>
            {article.cover && (
              <div className="nr-article-cover">
                <Image src={article.cover.url} alt={article.cover.alt} fill priority sizes="(max-width: 1000px) 100vw, 760px" unoptimized={remote(article.cover.url)} />
              </div>
            )}
            <div className="nr-article-body">
              {(article.blocks as Block[]).map((block, index) => <ArticleBlock key={index} block={block} />)}
            </div>
            {article.tags.length > 0 && <ul className="nr-article-tags">{article.tags.map((t) => <li key={t}>{t}</li>)}</ul>}
            {(article.photos.length > 0 || article.videos.length > 0) && (
              <div className="nr-story-gallery">
                <NewsroomGallery
                  renderYouTube={(id, title, thumbnail) => <StoryVideo id={id} title={title} thumbnail={thumbnail} />}
                  photos={article.photos} videos={article.videos} heading="Photos and videos" idPrefix="story-gallery"
                  photosOnly={article.videos.length === 0} pageSize={NEWSROOM_PAGE}
                />
              </div>
            )}
            <ShareStory title={article.title} />
          </div>
          <aside className="nr-story-side">
            <div className="nr-story-card">
              <h2>{kind === "events" ? "Event details" : kind === "notices" ? "Notice details" : "Story details"}</h2>
              <dl>
                {facts.map((f) => (
                  <div key={f.label}>
                    <dt><svg viewBox="0 0 24 24" aria-hidden="true">{STORY_ICON[f.icon]}</svg>{f.label}</dt>
                    <dd>{f.value}</dd>
                  </div>
                ))}
              </dl>
              {article.link && (
                <a className="nr-story-cta" href={article.link} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                  {kind === "press-releases" ? "Read full story" : "Read more"} <span aria-hidden="true">{external ? "↗" : "→"}</span>
                </a>
              )}
              <Link className="nr-story-back" href={`/newsroom/${kind}`}>← All {kindTitle.toLowerCase()}</Link>
            </div>
          </aside>
        </div>
        {article.related.length > 0 && (
          <section className="newsroom-group nr-story-related" aria-labelledby="related-title">
            <div className="newsroom-group-heading">
              <h2 id="related-title">More {kindTitle.toLowerCase()}</h2>
              <Link className="newsroom-card-link" href={`/newsroom/${kind}`}>View all <span aria-hidden="true">→</span></Link>
            </div>
            {article.relatedNotices ? <NoticeCards notices={article.relatedNotices} /> : <NewsroomCards stories={article.related} />}
          </section>
        )}
      </div>
    </article>
  );
}

export function CompanyOfferingPage({ offering }: { offering: CompanyOfferingData }) {
  return (
    <article className="newsroom nr-article cx-offering">
      <div className="reference-wrap nr-article-wrap">
        <nav className="nr-breadcrumb" aria-label="Breadcrumb">
          <Link href={`/businesses/${offering.company.slug}`}>{offering.company.name}</Link><span aria-hidden="true">/</span><Link href={`/businesses/${offering.company.slug}#services`}>{offering.sectionLabel}</Link>
        </nav>
        <header className="nr-article-head">
          <h1>{offering.title}</h1>
          {offering.summary && <p className="nr-article-lead">{offering.summary}</p>}
        </header>
        {offering.image && (
          <div className="nr-article-cover">
            <Image src={offering.image.url} alt={offering.image.alt} fill priority sizes="(max-width: 900px) 100vw, 860px" unoptimized={remote(offering.image.url)} />
          </div>
        )}
        <div className="nr-article-body">{offering.body.map((p) => <p key={p}>{p}</p>)}</div>
        <p><Link className="newsroom-card-link" href={`/businesses/${offering.company.slug}#contact`}>Contact {offering.company.name} <span aria-hidden="true">→</span></Link></p>
      </div>
    </article>
  );
}
