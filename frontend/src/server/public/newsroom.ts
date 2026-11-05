import { prisma, isDatabaseConfigured } from "@/server/db";
import { formatKathmandu } from "@/server/time";
import {
  companyNotices, galleryPhotos, galleryVideos, latestEvents, latestNews, latestPressReleases, youtubeVideos,
  type CompanyNotice, type GalleryPhoto, type GalleryVideo, type NewsroomStory,
} from "@/data/newsroom";
import { canUseBundledSamples } from "@/server/public/sample-content";

// The public Newsroom and Gallery read only published database content.

export type Story = NewsroomStory & { href?: string };

export type NewsroomData = {
  noticeStories: Story[];
  pressReleases: Story[];
  news: Story[];
  events: Story[];
  notices: CompanyNotice[];
  youtube: { url: string; title: string; thumbnail?: string }[];
  photos: GalleryPhoto[];
  galleryVideos: GalleryVideo[];
};

export const NEWS_KINDS = {
  news: { title: "News", types: ["NEWS", "ANNOUNCEMENT"] as const },
  "press-releases": { title: "Press releases", types: ["PRESS_RELEASE"] as const },
  events: { title: "Events", types: [] as const },
  notices: { title: "Notices", types: [] as const },
} as const;
export type NewsKind = keyof typeof NEWS_KINDS;

// The address of a sample story (src/data/newsroom.ts), made from its title.
export const storySlug = (title: string) =>
  title.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
const withPages = (kind: NewsKind, stories: NewsroomStory[]): Story[] => stories.map((s) => ({ ...s, href: `/newsroom/${kind}/${storySlug(s.title)}` }));

// Notices as cards for the Notices page (they have no photo of their own).
const NOTICE_IMAGE = "/news/news.png";
const noticeStories = (notices: (CompanyNotice & { href?: string; image?: string; summary?: string })[]): Story[] =>
  notices.map((n) => ({ image: n.image ?? NOTICE_IMAGE, alt: n.title, date: n.date, title: n.title, summary: n.summary ?? n.company, href: n.href ?? `/newsroom/notices/${storySlug(n.title)}` }));

const BUNDLED: NewsroomData = {
  noticeStories: noticeStories(companyNotices),
  pressReleases: withPages("press-releases", latestPressReleases),
  news: withPages("news", latestNews),
  events: withPages("events", latestEvents),
  notices: companyNotices.map((n) => ({ ...n, href: `/newsroom/notices/${storySlug(n.title)}` })),
  youtube: youtubeVideos,
  photos: galleryPhotos,
  galleryVideos,
};

const EMPTY: NewsroomData = {
  noticeStories: [],
  pressReleases: [],
  news: [],
  events: [],
  notices: [],
  youtube: [],
  photos: [],
  galleryVideos: [],
};

const image = { select: { url: true, altText: true } } as const;
const pathFor = (type: string) => (type === "PRESS_RELEASE" ? "press-releases" : "news");

async function fromDatabase(): Promise<NewsroomData> {
  const now = new Date();
  const [articles, events, notices, videos, galleries] = await Promise.all([
    prisma.newsArticle.findMany({
      where: { status: "PUBLISHED", OR: [{ publishAt: null }, { publishAt: { lte: now } }] },
      include: { coverImage: image },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      take: 200,
    }),
    prisma.event.findMany({ where: { status: "PUBLISHED" }, include: { coverImage: image }, orderBy: { startsAt: "desc" }, take: 200 }),
    prisma.notice.findMany({ where: { status: "PUBLISHED" }, include: { company: { select: { name: true } }, attachment: image }, orderBy: { noticeDate: "desc" }, take: 100 }),
    prisma.video.findMany({ where: { status: "PUBLISHED" }, include: { thumbnail: image, file: image }, orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }] }),
    prisma.gallery.findMany({ where: { status: "PUBLISHED" }, include: { items: { include: { media: image }, orderBy: { sortOrder: "asc" } } }, orderBy: { createdAt: "desc" } }),
  ]);

  const story = (a: (typeof articles)[number]): Story => ({
    image: a.coverImage?.url ?? "/business/business.png",
    alt: a.coverImage?.altText ?? a.title,
    date: formatKathmandu(a.publishedAt ?? a.createdAt),
    title: a.title,
    summary: a.excerpt ?? "",
    href: `/newsroom/${pathFor(a.type)}/${a.slug}`,
  });

  return {
    noticeStories: noticeStories(notices.map((n) => ({
      company: n.company?.name ?? "Sanjeevani Group", date: formatKathmandu(n.noticeDate), title: n.title,
      href: `/newsroom/notices/${n.id}`, image: n.attachment?.url, summary: `${n.company?.name ?? "Sanjeevani Group"}${n.body ? `: ${n.body.slice(0, 140)}` : ""}`,
    }))),
    pressReleases: articles.filter((a) => a.type === "PRESS_RELEASE").map(story),
    news: articles.filter((a) => a.type !== "PRESS_RELEASE").map(story),
    events: events.map((e) => ({
      image: e.coverImage?.url ?? "/education.jpg",
      alt: e.coverImage?.altText ?? e.title,
      date: formatKathmandu(e.startsAt),
      location: e.venue ?? undefined,
      title: e.title,
      summary: e.summary ?? "",
      href: `/newsroom/events/${e.slug}`,
    })),
    notices: notices.map((n) => ({ company: n.company?.name ?? "Sanjeevani Group", date: formatKathmandu(n.noticeDate), title: n.title, href: `/newsroom/notices/${n.id}` })),
    youtube: videos.filter((v) => v.placement === "NEWSROOM_YOUTUBE" && v.url).map((v) => ({ url: v.url!, title: v.title, thumbnail: v.thumbnail?.url })),
    photos: galleries.flatMap((g) => g.items.map((i) => ({ src: i.media.url, alt: i.altText, caption: i.caption }))),
    galleryVideos: videos.filter((v) => v.placement === "GALLERY").flatMap((v): GalleryVideo[] =>
      v.url ? [{ kind: "youtube", url: v.url, title: v.title, thumbnail: v.thumbnail?.url }]
        : v.file ? [{ kind: "file", src: v.file.url, title: v.title, poster: v.thumbnail?.url }] : []),
  };
}

export async function loadNewsroom(): Promise<NewsroomData> {
  const databaseConfigured = isDatabaseConfigured();
  if (!databaseConfigured) return canUseBundledSamples(databaseConfigured) ? BUNDLED : EMPTY;
  try {
    return await fromDatabase();
  } catch (error) {
    console.error("Could not load the newsroom:", error instanceof Error ? error.message.split("\n")[0] : error);
    return EMPTY;
  }
}

// One story's page: /newsroom/<news | press-releases | events>/<slug>. It is a
// published record, or one of the sample stories while that kind has nothing
// published yet. Body blocks are returned as data and rendered as plain text
// by the page (never as HTML).
export type StoryPage = {
  kind: NewsKind;
  title: string;
  excerpt: string | null;
  date: string;
  cover: { url: string; alt: string } | null;
  blocks: unknown[];
  company: { name: string; slug: string } | null;
  tags: string[];
  link: string | null;
  venue: string | null;
  when: string | null;
  related: Story[];
  relatedNotices?: CompanyNotice[];
  photos: GalleryPhoto[];
  videos: GalleryVideo[];
};

type MediaRow = { mediaId: string | null; videoUrl: string | null; caption: string | null; altText: string | null; media: { url: string; altText: string | null } | null };
function storyGallery(rows: MediaRow[], title: string) {
  const photos: GalleryPhoto[] = [];
  const videos: GalleryVideo[] = [];
  for (const r of rows) {
    if (r.videoUrl) videos.push({ kind: "youtube", url: r.videoUrl, title: r.caption ?? title, thumbnail: r.media?.url });
    else if (r.media) photos.push({ src: r.media.url, alt: r.altText ?? r.media.altText ?? title, caption: r.caption ?? "" });
  }
  return { photos, videos };
}
const mediaInclude = { orderBy: { sortOrder: "asc" as const }, include: { media: image } };

export async function loadArticle(kind: NewsKind, slug: string): Promise<StoryPage | null> {
  const newsroom = await loadNewsroom();
  const list = kind === "events" ? newsroom.events : kind === "press-releases" ? newsroom.pressReleases : kind === "notices" ? newsroom.noticeStories : newsroom.news;
  const related = (href: string) => list.filter((s) => s.href !== href).slice(0, 3);
  const relatedNotices = (href: string) => (kind === "notices" ? { relatedNotices: newsroom.notices.filter((n) => n.href !== href).slice(0, 3) } : {});
  const company = (c: { name: string; slug: string; status: string } | null) => (c?.status === "PUBLISHED" ? { name: c.name, slug: c.slug } : null);

  if (isDatabaseConfigured()) {
    try {
      if (kind === "notices") {
        const n = /^[0-9a-f-]{36}$/.test(slug)
          ? await prisma.notice.findFirst({ where: { id: slug, status: "PUBLISHED" }, include: { attachment: image, company: { select: { name: true, slug: true, status: true } }, media: mediaInclude } })
          : null;
        if (n) {
          return {
            kind, title: n.title, excerpt: null, date: formatKathmandu(n.noticeDate),
            cover: n.attachment ? { url: n.attachment.url, alt: n.attachment.altText ?? n.title } : null,
            blocks: (n.body ?? "").split(/\n\s*\n/).map((t) => t.trim()).filter(Boolean).map((text) => ({ type: "paragraph", text })),
            company: company(n.company), tags: [], link: null, venue: null, when: null,
            related: related(`/newsroom/notices/${n.id}`), ...relatedNotices(`/newsroom/notices/${n.id}`), ...storyGallery(n.media, n.title),
          };
        }
      } else if (kind === "events") {
        const e = await prisma.event.findFirst({ where: { slug, status: "PUBLISHED" }, include: { coverImage: image, company: { select: { name: true, slug: true, status: true } }, media: mediaInclude } });
        if (e) {
          return {
            kind, title: e.title, excerpt: e.summary, date: formatKathmandu(e.startsAt),
            cover: e.coverImage ? { url: e.coverImage.url, alt: e.coverImage.altText ?? e.title } : null,
            blocks: Array.isArray(e.body) ? (e.body as unknown[]) : [], // the summary is already shown as the lead
            company: company(e.company), tags: [], link: e.linkUrl, venue: e.venue,
            when: `${formatKathmandu(e.startsAt, true)}${e.endsAt ? ` to ${formatKathmandu(e.endsAt, true)}` : ""}`,
            related: related(`/newsroom/events/${e.slug}`), ...storyGallery(e.media, e.title),
          };
        }
      } else {
        const a = await prisma.newsArticle.findFirst({
          where: { slug, status: "PUBLISHED", type: { in: [...NEWS_KINDS[kind].types] }, OR: [{ publishAt: null }, { publishAt: { lte: new Date() } }] },
          include: { coverImage: image, company: { select: { name: true, slug: true, status: true } }, media: mediaInclude },
        });
        if (a) {
          return {
            kind, title: a.title, excerpt: a.excerpt, date: formatKathmandu(a.publishedAt ?? a.createdAt),
            cover: a.coverImage ? { url: a.coverImage.url, alt: a.coverImage.altText ?? a.title } : null,
            blocks: Array.isArray(a.body) ? (a.body as unknown[]) : [],
            company: company(a.company), tags: a.tags, link: a.linkUrl, venue: null, when: null,
            related: related(`/newsroom/${kind}/${a.slug}`), ...storyGallery(a.media, a.title),
          };
        }
      }
    } catch (error) {
      console.error("Could not load the story:", error instanceof Error ? error.message.split("\n")[0] : error);
    }
  }

  // A sample story, while this kind still shows the bundled content.
  const sample = list.find((s) => s.href === `/newsroom/${kind}/${slug}`);
  if (!sample) return null;
  return {
    kind, title: sample.title, excerpt: kind === "notices" ? `Notice from ${sample.summary}.` : sample.summary || null, date: sample.date,
    cover: kind === "notices" ? null : { url: sample.image, alt: sample.alt }, blocks: [],
    company: null, tags: [], link: sample.link ?? null, venue: null, when: kind === "events" ? sample.date : null,
    related: related(sample.href ?? ""), ...relatedNotices(sample.href ?? ""), photos: [], videos: [],
  };
}

export type ArticleData = StoryPage;
