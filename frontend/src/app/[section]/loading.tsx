import PageSkeleton from "@/components/PageSkeleton";

// Covers every website page under /[section] (About, Business, company pages,
// Newsroom, Careers, ...). Shown only while a page is still being prepared.
export default function Loading() {
  return <PageSkeleton />;
}
