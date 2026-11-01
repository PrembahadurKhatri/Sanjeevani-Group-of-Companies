"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { Story } from "@/server/public/newsroom";
import type { ArticleData } from "@/server/public/newsroom";
import type { CompanyOfferingData } from "@/server/public/company-profile";

// The Newsroom's News / Events / Press releases pages, a single article, and
// a company's service or product detail page. They reuse the Newsroom's own
// card and layout styles.

const remote = (src: string) => /^https?:\/\//.test(src);
// Newsroom lists show 6 items, then 6 more each time Show more is pressed.
export const NEWSROOM_PAGE = 6;
const PAGE = NEWSROOM_PAGE;

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
            {story.href ? (
              <Link className="newsroom-card-link" href={story.href}>Read full story <span aria-hidden="true">→</span></Link>
            ) : story.link ? (
              <a className="newsroom-card-link" href={story.link} target="_blank" rel="noopener noreferrer">Read full story <span aria-hidden="true">↗</span></a>
            ) : null}
          </div>
        </article>
      ))}
    </div>
  );
}

// A group of story cards on the Newsroom page, 6 at a time.
export function PagedCards({ stories }: { stories: Story[] }) {
  const [shown, setShown] = useState(PAGE);
  return (
    <>
      <NewsroomCards stories={stories.slice(0, shown)} />
      {stories.length > shown && (
        <button type="button" className="nr-load-more" onClick={() => setShown((n) => n + PAGE)}>
          Show more <span className="num">({stories.length - shown} more)</span>
        </button>
      )}
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
];

export function NewsroomListing({ kind, title, stories }: { kind: string; title: string; stories: Story[] }) {
  const [shown, setShown] = useState(PAGE);
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
              <NewsroomCards stories={stories.slice(0, shown)} />
              {stories.length > shown && (
                <button type="button" className="nr-load-more" onClick={() => setShown((n) => n + PAGE)}>
                  Show more <span className="num">({stories.length - shown} more)</span>
                </button>
              )}
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

export function NewsArticle({ article, kind, kindTitle }: { article: ArticleData; kind: string; kindTitle: string }) {
  return (
    <article className="newsroom nr-article">
      <div className="reference-wrap nr-article-wrap">
        <nav className="nr-breadcrumb" aria-label="Breadcrumb">
          <Link href="/newsroom">Newsroom</Link><span aria-hidden="true">/</span><Link href={`/newsroom/${kind}`}>{kindTitle}</Link>
        </nav>
        <header className="nr-article-head">
          <time>{article.date}</time>
          <h2>{article.title}</h2>
          {article.excerpt && <p className="nr-article-lead">{article.excerpt}</p>}
          {article.company && <p className="nr-article-company">From <Link href={`/businesses/${article.company.slug}`}>{article.company.name}</Link></p>}
        </header>
        {article.cover && (
          <div className="nr-article-cover">
            <Image src={article.cover.url} alt={article.cover.alt} fill priority sizes="(max-width: 900px) 100vw, 860px" unoptimized={remote(article.cover.url)} />
          </div>
        )}
        <div className="nr-article-body">
          {(article.blocks as Block[]).map((block, index) => <ArticleBlock key={index} block={block} />)}
        </div>
        {article.tags.length > 0 && <ul className="nr-article-tags">{article.tags.map((t) => <li key={t}>{t}</li>)}</ul>}
        <p><Link className="newsroom-card-link" href={`/newsroom/${kind}`}>← All {kindTitle.toLowerCase()}</Link></p>
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
