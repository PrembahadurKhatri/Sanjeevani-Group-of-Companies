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
        <nav className="newsroom-jump" aria-label="Newsroom sections">
          {KIND_LINKS.map((k) => <Link key={k.key} href={k.href} aria-current={k.key === kind ? "page" : undefined}>{k.label}</Link>)}
          <Link href="/gallery">Gallery</Link>
        </nav>
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
