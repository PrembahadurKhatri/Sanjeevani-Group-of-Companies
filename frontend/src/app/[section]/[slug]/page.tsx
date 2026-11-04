import { notFound } from "next/navigation";
import SectionPage from "@/components/SectionPage";
import { businesses } from "@/data/businesses";
import { getCompanySlug } from "@/data/companyProfiles";
import { allLeaders, getLeader } from "@/data/leaders";
import { careerAreas, getCareerArea } from "@/data/careers";
import { loadSiteVacancies } from "@/server/public/vacancies";
import { isDatabaseConfigured } from "@/server/db";
import { companyExists, companyMetadata, loadCompanyProfile } from "@/server/public/company-profile";
import { loadNewsroom, NEWS_KINDS } from "@/server/public/newsroom";

const NEWSROOM_PAGES: Record<string, string> = { news: NEWS_KINDS.news.title, events: "Events", "press-releases": NEWS_KINDS["press-releases"].title, notices: "Notices" };

// A company's page from the database. null: use the bundled page (no database,
// or it could not be reached). "missing": the company exists but is not public.
async function companyPage(slug: string) {
  if (!isDatabaseConfigured()) return null;
  // Two tries: the database host drops idle connections now and then, and a
  // fresh attempt usually succeeds.
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      const profile = await loadCompanyProfile(slug);
      if (profile) return profile;
      return (await companyExists(slug)) ? "missing" : null;
    } catch (error) {
      console.error(`Could not load the company page (try ${attempt}):`, error instanceof Error ? error.message.split("\n")[0] : error);
    }
  }
  return null;
}

// Sub-pages under two sections:
//   /businesses/<slug>  company profiles. Slugs not in the bundled list still
//                       render, so a company added through the admin directory
//                       gets a page too (CompanyProfile resolves it against
//                       /api/businesses on the client).
//   /leadership/<slug>  leader profiles (the chairman keeps /chairman).
//   /careers/<slug>     a career area's vacancies and the application form.
//   /newsroom/<kind>    News, Events or Press releases.
export function generateStaticParams() {
  return [
    ...businesses.map((business) => ({ section: "businesses", slug: getCompanySlug(business.name) })),
    ...careerAreas.map((area) => ({ section: "careers", slug: area.slug })),
    ...Object.keys(NEWSROOM_PAGES).map((slug) => ({ section: "newsroom", slug })),
    ...allLeaders.filter((leader) => leader.slug !== "chairman").map((leader) => ({ section: "leadership", slug: leader.slug })),
  ];
}

export async function generateMetadata(props: { params: Promise<{ section: string; slug: string }> }) {
  const params = await props.params;
  if (params.section === "newsroom") return { title: `${NEWSROOM_PAGES[params.slug] ?? "Newsroom"} | Sanjeevani Group of Companies` };
  if (params.section === "businesses" && isDatabaseConfigured()) {
    const meta = await companyMetadata(params.slug).catch(() => null);
    if (meta) return meta;
  }
  if (params.section === "leadership") {
    const leader = getLeader(params.slug);
    return { title: `${leader ? `${leader.name}, ${leader.role}` : "Our leadership"} | Sanjeevani Group of Companies` };
  }
  if (params.section === "careers") {
    const area = getCareerArea(params.slug);
    return { title: `${area ? `${area.title} vacancies` : "Careers"} | Sanjeevani Group of Companies` };
  }
  const business = businesses.find((item) => getCompanySlug(item.name) === params.slug);
  return { title: `${business?.name ?? "Our businesses"} | Sanjeevani Group of Companies` };
}

export const revalidate = 60;

export default async function SubPage(props: { params: Promise<{ section: string; slug: string }> }) {
  const params = await props.params;
  if (params.section === "businesses") {
    const profile = await companyPage(params.slug);
    if (profile === "missing") notFound();
    return <SectionPage section="businesses" companySlug={params.slug} companyProfile={profile} />;
  }
  if (params.section === "newsroom") {
    const title = NEWSROOM_PAGES[params.slug];
    if (!title) notFound();
    return <SectionPage section="newsroom" newsKind={{ key: params.slug, title }} newsroom={await loadNewsroom()} />;
  }
  if (params.section === "leadership") {
    const leader = getLeader(params.slug);
    if (!leader || leader.slug === "chairman") notFound();
    return <SectionPage section="leadership" leaderSlug={params.slug} />;
  }
  if (params.section === "careers") {
    if (!getCareerArea(params.slug)) notFound();
    return <SectionPage section="careers" careerAreaSlug={params.slug} siteVacancies={await loadSiteVacancies()} />;
  }
  notFound();
}
