import { notFound } from "next/navigation";
import SectionPage from "@/components/SectionPage";
import { getCareerArea } from "@/data/careers";
import { loadSiteVacancies } from "@/server/public/vacancies";
import { loadCompanyOffering, loadCompanyProfile, previewAllowed } from "@/server/public/company-profile";
import { loadArticle, NEWS_KINDS, type NewsKind } from "@/server/public/newsroom";

const isNewsKind = (value: string): value is NewsKind => value in NEWS_KINDS;

// /careers/<area-slug>/<vacancy-slug>: one vacancy's detail page. Vacancies
// come from the database, so pages are rendered on request and refreshed
// at most once a minute. Also:
//   /businesses/<company>/<item>   a service or product's detail page
//   /businesses/<company>/preview  the company page with drafts, for signed-in staff
//   /newsroom/<kind>/<article>     one published news article or press release
export const revalidate = 60;

export async function generateMetadata({ params }: { params: { section: string; slug: string; item: string } }) {
  if (params.section === "businesses" && params.item === "preview") return { title: "Preview | Sanjeevani Group", robots: { index: false, follow: false } };
  if (params.section === "businesses") {
    const offering = await loadCompanyOffering(params.slug, params.item).catch(() => null);
    return { title: `${offering ? `${offering.title}, ${offering.company.name}` : "Our businesses"} | Sanjeevani Group of Companies` };
  }
  if (params.section === "newsroom" && isNewsKind(params.slug)) {
    const article = await loadArticle(params.slug, params.item).catch(() => null);
    return { title: `${article?.title ?? NEWS_KINDS[params.slug].title} | Sanjeevani Group of Companies`, description: article?.excerpt ?? undefined };
  }
  const vacancy = (await loadSiteVacancies()).find((entry) => entry.id === params.item && entry.areaSlug === params.slug);
  return { title: `${vacancy ? `${vacancy.title}, ${vacancy.company}` : "Careers"} | Sanjeevani Group of Companies` };
}

export default async function VacancyPage({ params }: { params: { section: string; slug: string; item: string } }) {
  if (params.section === "businesses" && params.item === "preview") {
    if (!(await previewAllowed(params.slug))) notFound();
    const profile = await loadCompanyProfile(params.slug, { preview: true });
    if (!profile) notFound();
    return <SectionPage section="businesses" companySlug={params.slug} companyProfile={profile} />;
  }
  if (params.section === "businesses") {
    const offering = await loadCompanyOffering(params.slug, params.item);
    if (!offering) notFound();
    return <SectionPage section="businesses" companySlug={params.slug} offering={offering} />;
  }
  if (params.section === "newsroom") {
    if (!isNewsKind(params.slug)) notFound();
    const article = await loadArticle(params.slug, params.item);
    if (!article) notFound();
    return <SectionPage section="newsroom" newsKind={{ key: params.slug, title: NEWS_KINDS[params.slug].title }} article={article} />;
  }
  if (params.section !== "careers" || !getCareerArea(params.slug)) notFound();
  const siteVacancies = await loadSiteVacancies();
  if (!siteVacancies.some((entry) => entry.id === params.item && entry.areaSlug === params.slug)) notFound();
  return <SectionPage section="careers" careerAreaSlug={params.slug} vacancyId={params.item} siteVacancies={siteVacancies} />;
}
