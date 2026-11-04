import { notFound } from "next/navigation";
import SectionPage from "@/components/SectionPage";
import { loadSiteVacancies } from "@/server/public/vacancies";
import { loadNewsroom } from "@/server/public/newsroom";
import { loadCommunity } from "@/server/public/community";

const sectionSlugs = [
  "our-story",
  "about-us",
  "mission-vision-values",
  "leadership",
  "chairman",
  "team",
  "businesses",
  "newsroom",
  "reviews",
  "gallery",
  "community",
  "careers",
  "contact",
  "faq",
  "privacy-policy",
  "terms-of-use",
  "accessibility",
  "sitemap",
];

export function generateStaticParams() {
  return sectionSlugs.map((section) => ({ section }));
}

export async function generateMetadata(props: { params: Promise<{ section: string }> }) {
  const params = await props.params;
  const titles: Record<string, string> = {
    "our-story": "Our story",
    "about-us": "About us",
    "mission-vision-values": "Mission, Vision & Values",
    leadership: "Leadership",
    chairman: "Chairman C.A. Khuma Parsad Aryal",
    team: "Our team",
    businesses: "Our businesses",
    newsroom: "Newsroom",
    reviews: "Reviews",
    gallery: "Gallery",
    community: "Our community",
    careers: "Careers",
    contact: "Contact",
    faq: "Frequently asked questions",
    "privacy-policy": "Privacy policy",
    "terms-of-use": "Terms of use",
    accessibility: "Accessibility",
    sitemap: "Sitemap",
  };
  const title = titles[params.section];
  return title
    ? { title: `${title} | Sanjeevani Group of Companies` }
    : { title: "Page not found | Sanjeevani Group" };
}

// Re-render at most once a minute so vacancy counts follow what HR publishes.
export const revalidate = 60;

export default async function GroupSectionPage(
  props: {
    params: Promise<{ section: string }>;
  }
) {
  const params = await props.params;
  if (!sectionSlugs.includes(params.section)) notFound();
  const siteVacancies = params.section === "careers" ? await loadSiteVacancies() : undefined;
  const newsroom = params.section === "newsroom" || params.section === "gallery" ? await loadNewsroom() : undefined;
  const community = params.section === "community" ? await loadCommunity() : undefined;
  return <SectionPage section={params.section} siteVacancies={siteVacancies} newsroom={newsroom} community={community} />;
}
