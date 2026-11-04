import { NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { businessDirectoryInclude, businessGroupFor, hasPrismaCode, toBusinessRecord } from "@/server/business-directory";
import { hasAdminConfiguration, isAdminAuthenticated } from "@/lib/admin-session";
import { validateBusinessInput } from "@/lib/business-validation";
import { toCompanyCategory } from "../../../../../prisma/seed-helpers";
import { getCompanySlug } from "@/data/companyProfiles";

export const dynamic = "force-dynamic";

async function authorizationError() {
  if (!hasAdminConfiguration()) {
    return NextResponse.json({ message: "Admin access is not configured on this server." }, { status: 503 });
  }
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ message: "Sign in to manage the business directory." }, { status: 401 });
  }
  return null;
}

export async function GET() {
  const unauthorized = await authorizationError();
  if (unauthorized) return unauthorized;

  try {
    const businesses = await prisma.company.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: businessDirectoryInclude,
    });
    return NextResponse.json({ data: businesses.map(toBusinessRecord) });
  } catch (error) {
    console.error("Could not load the admin business directory:", error);
    return NextResponse.json({ message: "Could not load the business directory." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const unauthorized = await authorizationError();
  if (unauthorized) return unauthorized;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Enter valid business details." }, { status: 400 });
  }

  const validated = validateBusinessInput(body);
  if (!validated.success) {
    return NextResponse.json({ message: validated.message }, { status: 400 });
  }

  try {
    const { name, category, sector, description, website, location, published, order } = validated.data;
    if (!name || !category || !sector || !description) {
      return NextResponse.json({ message: "Name, category, sector, and description are required." }, { status: 400 });
    }

    const group = await prisma.group.findFirst({ orderBy: { createdAt: "asc" }, select: { id: true } });
    if (!group) throw new Error("The PostgreSQL company group has not been seeded.");
    const sectorGroup = businessGroupFor({ name, category, sector });
    const matchingSector = sectorGroup
      ? await prisma.sector.findUnique({ where: { slug: sectorGroup.value }, select: { id: true } })
      : null;
    const business = await prisma.company.create({
      data: {
        groupId: group.id,
        sectorId: matchingSector?.id ?? null,
        name,
        slug: getCompanySlug(name),
        category: toCompanyCategory(category),
        sectorLabel: sector,
        description,
        website: website || null,
        sortOrder: order ?? 0,
        status: published === false ? "DRAFT" : "PUBLISHED",
        publishedAt: published === false ? null : new Date(),
        ...(location ? {
          locations: {
            create: { name: "Main office", addressLine: location, isPrimary: true },
          },
        } : {}),
      },
      include: businessDirectoryInclude,
    });
    return NextResponse.json({ data: toBusinessRecord(business) }, { status: 201 });
  } catch (error) {
    if (hasPrismaCode(error, "P2002")) {
      return NextResponse.json({ message: "A business with that name already exists." }, { status: 409 });
    }
    console.error("Could not create a directory business:", error);
    return NextResponse.json({ message: "Could not save the business." }, { status: 503 });
  }
}
