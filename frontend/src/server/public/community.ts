import { prisma, isDatabaseConfigured } from "@/server/db";

// The Community page reads what is published in Admin → Community. While
// nothing of a kind is published, that part keeps the page's current content
// (passed in by the page). Drafts are never read.

export type CommunityProgramData = { name: string; logo?: string; photo: string; tagline?: string; description: string; website: string };
export type CommunityTileData = { type: "photo"; src: string; alt: string } | { type: "text"; text: string };
export type CommunityData = { programs: CommunityProgramData[] | null; gallery: CommunityTileData[] | null };

const image = { select: { url: true } } as const;

export async function loadCommunity(): Promise<CommunityData> {
  if (!isDatabaseConfigured()) return { programs: null, gallery: null };
  try {
    const [programs, tiles] = await Promise.all([
      prisma.communityProgram.findMany({ where: { status: "PUBLISHED" }, include: { logo: image, photo: image }, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] }),
      prisma.communityGalleryItem.findMany({ where: { status: "PUBLISHED" }, include: { image }, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] }),
    ]);
    const gallery = tiles.flatMap((t): CommunityTileData[] =>
      t.image ? [{ type: "photo", src: t.image.url, alt: t.altText ?? "" }] : t.text ? [{ type: "text", text: t.text }] : []);
    return {
      programs: programs.length
        ? programs.map((p) => ({ name: p.name, logo: p.logo?.url, photo: p.photo?.url ?? "/aama.jpg", tagline: p.tagline ?? undefined, description: p.description, website: p.websiteUrl ?? "" }))
        : null,
      gallery: gallery.length ? gallery : null,
    };
  } catch (error) {
    console.error("Could not load the community page:", error instanceof Error ? error.message.split("\n")[0] : error);
    return { programs: null, gallery: null };
  }
}
