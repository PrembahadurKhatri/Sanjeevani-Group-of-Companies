import { prisma } from "@/server/db";
import { can } from "@/server/auth/access";
import { getSessionUser } from "@/server/auth/session";
import { businesses as bundledBusinesses } from "@/data/businesses";
import { getCompanyProfile, toWebsiteUrl } from "@/data/companyProfiles";
import { resolveSections, visibleSections, type ResolvedSection, type SectionKey } from "@/lib/company-sections";
import { loadSiteVacancies } from "@/server/public/vacancies";
import { formatKathmandu } from "@/server/time";

// Everything one company's profile page (/businesses/<slug>) shows, read from
// the database. Only published records are included, except in a preview,
// where drafts show too (archived records never do). Sections without any
// content are left out unless the company has chosen to show them anyway.

type Img = { url: string; alt: string } | null;
const img = (m: { url: string; altText: string | null } | null | undefined, alt = ""): Img => (m ? { url: m.url, alt: m.altText ?? alt } : null);

export type ProfileLeader = { key: string; name: string; title: string; photo: Img; summary: string | null; biography: string | null; linkedin: string | null; career: { period: string; position: string; organisation: string }[]; managingDirector: boolean };

export type CompanyProfileData = {
  preview: boolean;
  status: string;
  company: {
    id: string; slug: string; name: string; shortName: string | null;
    sectorLabel: string; sector: { slug: string; name: string } | null; industry: string | null;
    establishedYear: number | null; headquarters: string | null;
    description: string; fullDescription: string | null; keyFacts: { label: string; value: string }[];
    background: string | null; history: string | null; mission: string | null; vision: string | null; coreValues: string[]; philosophy: string | null;
    services: string[];
    logo: Img; banner: Img;
    website: string | null; email: string | null; phone: string | null;
    registeredAddress: string | null; officeHours: string | null; mapUrl: string | null;
    social: { label: string; href: string }[];
    locations: { name: string; address: string; phone: string | null; email: string | null; isPrimary: boolean; image: Img; website: string | null }[];
  };
  sections: ResolvedSection[];
  offerings: { slug: string; title: string; summary: string | null; image: Img; hasDetail: boolean }[];
  achievements: { id: string; kind: string; title: string; description: string | null; date: string | null; image: Img }[];
  milestones: { id: string; title: string; description: string | null; date: string | null }[];
  relations: { id: string; name: string; description: string | null; type: string; logo: Img; href: string | null; external: boolean }[];
  chairman: { name: string; photo: Img } | null;
  leaders: { tier: "BOARD" | "EXECUTIVE" | "TEAM"; people: ProfileLeader[] }[];
  hasManagingDirector: boolean;
  news: { id: string; title: string; excerpt: string | null; cover: Img; date: string; href: string }[];
  vacancies: { id: string; title: string; location: string; type: string; deadline: string; href: string }[];
  gallery: { id: string; src: string; alt: string; caption: string }[];
  related: { slug: string; name: string; photo: string | null; place: string | null }[];
};

const NEWS_PATH: Record<string, string> = { PRESS_RELEASE: "press-releases", NEWS: "news", ANNOUNCEMENT: "news" };

function address(l: { addressLine: string | null; municipality: string | null; district: string | null; province: string | null; country: string }) {
  const parts = [l.addressLine, l.municipality, l.district, l.province].filter((p): p is string => Boolean(p?.trim()));
  // Older addresses already end in the country ("Pokhara, Nepal"); don't repeat it.
  const hasCountry = parts.some((p) => p.toLowerCase().split(/,\s*/).includes(l.country.toLowerCase()));
  return [...parts, ...(hasCountry ? [] : [l.country])].join(", ");
}

function keyFacts(value: unknown): { label: string; value: string }[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((f) => (f && typeof f === "object" && typeof (f as { label?: unknown }).label === "string" && typeof (f as { value?: unknown }).value === "string" ? [{ label: (f as { label: string }).label, value: (f as { value: string }).value }] : []));
}

export async function loadCompanyProfile(slug: string, options: { preview?: boolean } = {}): Promise<CompanyProfileData | null> {
  const preview = Boolean(options.preview);
  const shown = preview ? { not: "ARCHIVED" as const } : ("PUBLISHED" as const);
  const image = { select: { url: true, altText: true } } as const;

  const company = await prisma.company.findFirst({
    where: { slug, status: shown },
    include: {
      sector: { select: { slug: true, name: true } },
      logo: image,
      banner: image,
      locations: { orderBy: [{ isPrimary: "desc" }, { name: "asc" }], include: { image } },
      offerings: { where: { status: shown }, include: { image }, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] },
      achievements: { where: { status: shown }, include: { image }, orderBy: [{ sortOrder: "asc" }, { date: "desc" }] },
      relations: {
        where: { status: shown },
        include: { logo: image, relatedCompany: { select: { name: true, slug: true, status: true, description: true, website: true, logo: image } } },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      },
      leaderAssignments: {
        where: { leader: { status: shown } },
        include: { leader: { include: { photo: image, career: { orderBy: { sortOrder: "asc" } } } } },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      },
      newsArticles: {
        where: preview ? { status: { not: "ARCHIVED" } } : { status: "PUBLISHED", OR: [{ publishAt: null }, { publishAt: { lte: new Date() } }] },
        include: { coverImage: image },
        orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
        take: 6,
      },
      galleries: { where: { status: shown }, include: { items: { include: { media: image }, orderBy: { sortOrder: "asc" } } }, orderBy: { createdAt: "desc" } },
    },
  });
  if (!company) return null;

  const [chairman, siblings, vacancies] = await Promise.all([
    prisma.leader.findFirst({ where: { isChairman: true, status: "PUBLISHED" }, include: { photo: image } }),
    company.sectorId
      ? prisma.company.findMany({ where: { sectorId: company.sectorId, status: "PUBLISHED", id: { not: company.id } }, include: { banner: image, locations: { where: { isPrimary: true }, take: 1 } }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }], take: 3 })
      : Promise.resolve([]),
    loadSiteVacancies(),
  ]);

  // Older details that are only in the bundled site data until set in the admin.
  const bundled = bundledBusinesses.find((b) => b.name === company.name);
  const bundledProfile = getCompanyProfile(company.name);
  const primary = company.locations.find((l) => l.isPrimary) ?? company.locations[0];

  const social = ([
    ["Facebook", company.facebookUrl], ["LinkedIn", company.linkedinUrl], ["Instagram", company.instagramUrl], ["YouTube", company.youtubeUrl],
  ] as const).flatMap(([label, href]) => (href ? [{ label, href }] : []));

  const people = company.leaderAssignments.map((a): ProfileLeader & { tier: "BOARD" | "EXECUTIVE" | "TEAM" } => ({
    key: a.id,
    tier: a.tier,
    name: a.leader.name,
    title: a.title,
    photo: img(a.leader.photo, a.leader.name),
    summary: a.leader.summary,
    biography: a.leader.biography,
    linkedin: a.leader.linkedinUrl,
    career: a.leader.career.map((c) => ({ period: c.period, position: c.position, organisation: c.organisation })),
    managingDirector: a.isManagingDirector,
  }));
  const leaders = (["BOARD", "EXECUTIVE", "TEAM"] as const)
    .map((tier) => ({ tier, people: people.filter((p) => p.tier === tier && !(chairman && p.name === chairman.name)) }))
    .filter((g) => g.people.length > 0);

  const achievements = company.achievements.map((a) => ({
    id: a.id, kind: a.kind, title: a.title, description: a.description,
    date: a.date ? formatKathmandu(a.date) : null, image: img(a.image, a.title),
  }));

  const data: CompanyProfileData = {
    preview,
    status: company.status,
    company: {
      id: company.id,
      slug: company.slug,
      name: company.name,
      shortName: company.shortName,
      sectorLabel: company.sectorLabel,
      sector: company.sector,
      industry: company.industry,
      establishedYear: company.establishedYear ?? (bundledProfile?.established ? Number(bundledProfile.established) || null : null),
      headquarters: company.headquarters ?? (primary ? address(primary) : null) ?? bundled?.location ?? null,
      description: company.description,
      fullDescription: company.fullDescription,
      keyFacts: keyFacts(company.keyFacts),
      background: company.background,
      history: company.history,
      mission: company.mission,
      vision: company.vision,
      coreValues: company.coreValues,
      philosophy: company.philosophy,
      services: company.services,
      logo: img(company.logo, `${company.name} logo`),
      banner: img(company.banner, company.name) ?? (bundledProfile?.photo ? { url: bundledProfile.photo, alt: company.name } : null),
      website: toWebsiteUrl(company.website ?? bundled?.website) ?? null,
      email: company.email,
      phone: company.phone,
      registeredAddress: company.registeredAddress,
      officeHours: company.officeHours,
      mapUrl: company.mapUrl,
      social,
      locations: company.locations.map((l) => ({
        name: l.name, address: address(l), phone: l.phone, email: l.email, isPrimary: l.isPrimary,
        image: img(l.image, l.name), website: toWebsiteUrl(l.websiteUrl ?? undefined) ?? null,
      })),
    },
    sections: [],
    offerings: company.offerings.map((o) => ({ slug: o.slug, title: o.title, summary: o.summary, image: img(o.image, o.title), hasDetail: Boolean(o.body?.trim()) })),
    achievements: achievements.filter((a) => a.kind !== "MILESTONE"),
    milestones: achievements.filter((a) => a.kind === "MILESTONE").map(({ id, title, description, date }) => ({ id, title, description, date })),
    relations: company.relations.flatMap((r) => {
      const own = r.relatedCompany;
      if (own && own.status !== "PUBLISHED" && !preview) return [];
      const name = own?.name ?? r.name;
      if (!name) return [];
      const website = toWebsiteUrl(r.websiteUrl ?? own?.website ?? undefined) ?? null;
      return [{
        id: r.id, name, type: r.relationType,
        description: r.description ?? own?.description ?? null,
        logo: img(r.logo ?? own?.logo, `${name} logo`),
        href: own ? `/businesses/${own.slug}` : website,
        external: !own && Boolean(website),
      }];
    }),
    chairman: chairman ? { name: chairman.name, photo: img(chairman.photo, chairman.name) } : null,
    leaders,
    hasManagingDirector: people.some((p) => p.managingDirector),
    news: company.newsArticles.map((n) => ({
      id: n.id, title: n.title, excerpt: n.excerpt, cover: img(n.coverImage, n.title),
      date: formatKathmandu(n.publishedAt ?? n.createdAt), href: `/newsroom/${NEWS_PATH[n.type] ?? "news"}/${n.slug}`,
    })),
    vacancies: vacancies.filter((v) => v.company === company.name).map((v) => ({
      id: v.id, title: v.title, location: v.location, type: v.employmentType, deadline: v.deadline, href: `/careers/${v.areaSlug}/${v.id}`,
    })),
    gallery: company.galleries.flatMap((g) => g.items.map((i) => ({ id: i.id, src: i.media.url, alt: i.altText, caption: i.caption }))),
    related: siblings.map((s) => ({ slug: s.slug, name: s.name, photo: s.banner?.url ?? null, place: s.locations[0]?.municipality ?? s.locations[0]?.district ?? null })),
  };

  const hasContent: Partial<Record<SectionKey, boolean>> = {
    about: Boolean(data.company.background || data.company.history || data.company.mission || data.company.vision || data.company.coreValues.length || data.company.philosophy || data.milestones.length),
    services: data.offerings.length > 0 || data.company.services.length > 0,
    leadership: true, // the Chairman is shown on every company page
    branches: company.locations.length > 1,
    businesses: data.relations.length > 0,
    projects: data.achievements.length > 0,
    news: data.news.length > 0,
    careers: data.vacancies.length > 0,
    gallery: data.gallery.length > 0,
  };
  data.sections = visibleSections(resolveSections(company.profileSections, company.servicesTitle), hasContent);
  return data;
}

// One service or product's detail page (/businesses/<company>/<item>).
export async function loadCompanyOffering(companySlug: string, itemSlug: string, options: { preview?: boolean } = {}) {
  const shown = options.preview ? { not: "ARCHIVED" as const } : ("PUBLISHED" as const);
  const offering = await prisma.companyOffering.findFirst({
    where: { slug: itemSlug, status: shown, company: { slug: companySlug, status: shown } },
    include: { image: { select: { url: true, altText: true } }, company: { select: { name: true, slug: true, servicesTitle: true, profileSections: true } } },
  });
  if (!offering?.body?.trim()) return null;
  const section = resolveSections(offering.company.profileSections, offering.company.servicesTitle).find((s) => s.key === "services");
  if (section && !section.enabled) return null;
  return {
    title: offering.title,
    summary: offering.summary,
    body: offering.body.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean),
    image: img(offering.image, offering.title),
    company: { name: offering.company.name, slug: offering.company.slug },
    sectionLabel: section?.label ?? "Services",
  };
}

export type CompanyOfferingData = NonNullable<Awaited<ReturnType<typeof loadCompanyOffering>>>;

// For the page routes: is there a company at this address that is not public?
// (Then the page is "not found", rather than falling back to older site data.)
export async function companyExists(slug: string) {
  return Boolean(await prisma.company.findUnique({ where: { slug }, select: { id: true } }));
}

// Search engine and sharing details for a published company.
export async function companyMetadata(slug: string) {
  const company = await prisma.company.findFirst({
    where: { slug, status: "PUBLISHED" },
    select: { name: true, description: true, seoTitle: true, seoDescription: true, shareImage: { select: { url: true } }, banner: { select: { url: true } } },
  });
  if (!company) return null;
  const title = company.seoTitle || `${company.name} | Sanjeevani Group of Companies`;
  const description = company.seoDescription || company.description || undefined;
  const image = company.shareImage?.url ?? company.banner?.url;
  return { title, description, openGraph: { title, description, ...(image ? { images: [image] } : {}) } };
}

// Preview is for signed-in staff who may see this company in the admin.
export async function previewAllowed(slug: string) {
  const user = await getSessionUser();
  if (!user) return false;
  const company = await prisma.company.findUnique({ where: { slug }, select: { id: true } });
  return Boolean(company && (can(user.access, "company.read", company.id) || can(user.access, "content.update", company.id)));
}
