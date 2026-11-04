import type { CompanyCategory, Prisma } from "@prisma/client";
import { businessGroups, type Business, type BusinessCategory } from "@/data/businesses";
import type { BusinessRecord } from "@/lib/business-validation";

export const businessDirectoryInclude = {
  locations: {
    orderBy: [{ isPrimary: "desc" as const }, { createdAt: "asc" as const }],
    take: 1,
    select: { addressLine: true },
  },
};

type BusinessDirectoryRow = Prisma.CompanyGetPayload<{
  include: typeof businessDirectoryInclude;
}>;

const categoryByCompany: Record<CompanyCategory, BusinessCategory> = {
  HEALTHCARE: "healthcare",
  EDUCATION: "education",
  AGRICULTURE: "agriculture",
  OTHER: "other",
};

export function toBusinessRecord(company: BusinessDirectoryRow): Business {
  return {
    _id: company.id,
    name: company.name,
    category: categoryByCompany[company.category],
    sector: company.sectorLabel,
    description: company.description,
    website: company.website ?? "",
    location: company.locations[0]?.addressLine ?? "",
    published: company.status === "PUBLISHED",
    order: company.sortOrder,
  };
}

export function businessGroupFor(record: Pick<BusinessRecord, "name" | "category" | "sector">) {
  const business: Business = {
    _id: "",
    name: record.name,
    category: record.category,
    sector: record.sector,
    description: "",
    website: "",
    location: "",
    published: true,
    order: 0,
  };
  return businessGroups.find((group) => group.matches(business));
}

export async function updatePrimaryBusinessLocation(
  tx: Prisma.TransactionClient,
  companyId: string,
  addressLine: string,
) {
  const primary = await tx.location.findFirst({
    where: { companyId, isPrimary: true },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });

  if (primary) {
    await tx.location.update({
      where: { id: primary.id },
      data: { addressLine: addressLine || null },
    });
  } else if (addressLine) {
    await tx.location.create({
      data: { companyId, name: "Main office", addressLine, isPrimary: true },
    });
  }
}

export function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export function hasPrismaCode(error: unknown, code: string) {
  return typeof error === "object" && error !== null && "code" in error && error.code === code;
}
