import { prisma, isDatabaseConfigured } from "@/server/db";
import { formatKathmandu } from "@/server/time";
import {
  companyNotices, galleryPhotos, galleryVideos, latestEvents, latestPressReleases, youtubeVideos,
  type CompanyNotice, type GalleryPhoto, type GalleryVideo, type NewsroomStory,
} from "@/data/newsroom";

// The public Newsroom and Gallery read what is published in the admin. While
// nothing of a kind has been published yet, that kind keeps showing the
// site's existing bundled content (src/data/newsroom.ts), so pages never go
// blank. Drafts are never read.

export type Story = NewsroomStory & { href?: string };

export type NewsroomData = {
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
} as const;
export type NewsKind = keyof typeof NEWS_KINDS;

const BUNDLED: NewsroomData = {
  pressReleases: latestPressReleases,
  news: [],
  events: latestEvents,
  notices: companyNotices,
  youtube: youtubeVideos,
  photos: galleryPhotos,
  galleryVideos,
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
    prisma.notice.findMany({ where: { status: "PUBLISHED" }, include: { company: { select: { name: true } } }, orderBy: { noticeDate: "desc" }, take: 100 }),
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
    pressReleases: articles.filter((a) => a.type === "PRESS_RELEASE").map(story),
    news: articles.filter((a) => a.type !== "PRESS_RELEASE").map(story),
    events: events.map((e) => ({
      image: e.coverImage?.url ?? "/education.jpg",
      alt: e.coverImage?.altText ?? e.title,
      date: formatKathmandu(e.startsAt) + (e.venue ? `, ${e.venue}` : ""),
      title: e.title,
      summary: e.summary ?? "",
    })),
    notices: notices.map((n) => ({ company: n.company?.name ?? "Sanjeevani Group", date: formatKathmandu(n.noticeDate), title: n.title })),
    youtube: videos.filter((v) => v.placement === "NEWSROOM_YOUTUBE" && v.url).map((v) => ({ url: v.url!, title: v.title, thumbnail: v.thumbnail?.url })),
    photos: galleries.flatMap((g) => g.items.map((i) => ({ src: i.media.url, alt: i.altText, caption: i.caption }))),
    galleryVideos: videos.filter((v) => v.placement === "GALLERY").flatMap((v): GalleryVideo[] =>
      v.url ? [{ kind: "youtube", url: v.url, title: v.title, thumbnail: v.thumbnail?.url }]
        : v.file ? [{ kind: "file", src: v.file.url, title: v.title, poster: v.thumbnail?.url }] : []),
  };
}

export async function loadNewsroom(): Promise<NewsroomData> {
  if (!isDatabaseConfigured()) return BUNDLED;
  try {
    const db = await fromDatabase();
    // Per kind: published records, or the bundled content until there are any.
    return Object.fromEntries(
      (Object.keys(BUNDLED) as (keyof NewsroomData)[]).map((key) => [key, db[key].length ? db[key] : BUNDLED[key]]),
    ) as NewsroomData;
  } catch (error) {
    console.error("Could not load the newsroom:", error instanceof Error ? error.message.split("\n")[0] : error);
    return BUNDLED;
  }
}

// One published article for /newsroom/<kind>/<slug>. Body blocks are returned
// as data and rendered as plain text by the page (never as HTML).
export async function loadArticle(kind: NewsKind, slug: string) {
  if (!isDatabaseConfigured()) return null;
  const article = await prisma.newsArticle.findFirst({
    where: { slug, status: "PUBLISHED", type: { in: [...NEWS_KINDS[kind].types] }, OR: [{ publishAt: null }, { publishAt: { lte: new Date() } }] },
    include: { coverImage: image, company: { select: { name: true, slug: true, status: true } } },
  });
  if (!article) return null;
  return {
    title: article.title,
    excerpt: article.excerpt,
    date: formatKathmandu(article.publishedAt ?? article.createdAt),
    cover: article.coverImage ? { url: article.coverImage.url, alt: article.coverImage.altText ?? article.title } : null,
    blocks: Array.isArray(article.body) ? (article.body as unknown[]) : [],
    company: article.company?.status === "PUBLISHED" ? { name: article.company.name, slug: article.company.slug } : null,
    tags: article.tags,
  };
}

export type ArticleData = NonNullable<Awaited<ReturnType<typeof loadArticle>>>;
