import { NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { businessDirectoryInclude, businessGroupFor, hasPrismaCode, isUuid, toBusinessRecord, updatePrimaryBusinessLocation } from "@/server/business-directory";
import { hasAdminConfiguration, isAdminAuthenticated } from "@/lib/admin-session";
import { validateBusinessInput } from "@/lib/business-validation";
import { toCompanyCategory } from "../../../../../../prisma/seed-helpers";
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

export async function PATCH(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const unauthorized = await authorizationError();
  if (unauthorized) return unauthorized;
  if (!isUuid(params.id)) {
    return NextResponse.json({ message: "Business not found." }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Enter valid business details." }, { status: 400 });
  }

  const validated = validateBusinessInput(body, true);
  if (!validated.success) {
    return NextResponse.json({ message: validated.message }, { status: 400 });
  }
  if (Object.keys(validated.data).length === 0) {
    return NextResponse.json({ message: "Include at least one field to update." }, { status: 400 });
  }

  try {
    const current = await prisma.company.findUnique({
      where: { id: params.id },
      include: businessDirectoryInclude,
    });
    if (!current) return NextResponse.json({ message: "Business not found." }, { status: 404 });

    const changes = validated.data;
    const currentRecord = toBusinessRecord(current);
    const nextRecord = { ...currentRecord, ...changes };
    const updateData: Record<string, unknown> = {};
    if (changes.name !== undefined) {
      updateData.name = changes.name;
      updateData.slug = getCompanySlug(changes.name);
    }
    if (changes.category !== undefined) updateData.category = toCompanyCategory(changes.category);
    if (changes.sector !== undefined) updateData.sectorLabel = changes.sector;
    if (changes.description !== undefined) updateData.description = changes.description;
    if (changes.website !== undefined) updateData.website = changes.website || null;
    if (changes.order !== undefined) updateData.sortOrder = changes.order;
    if (changes.published !== undefined) {
      updateData.status = changes.published ? "PUBLISHED" : "DRAFT";
      updateData.publishedAt = changes.published ? current.publishedAt ?? new Date() : null;
    }

    if (changes.name !== undefined || changes.category !== undefined || changes.sector !== undefined) {
      const sectorGroup = businessGroupFor(nextRecord);
      const matchingSector = sectorGroup
        ? await prisma.sector.findUnique({ where: { slug: sectorGroup.value }, select: { id: true } })
        : null;
      updateData.sectorId = matchingSector?.id ?? null;
    }

    const business = await prisma.$transaction(async (tx) => {
      await tx.company.update({ where: { id: params.id }, data: updateData });
      if (changes.location !== undefined) {
        await updatePrimaryBusinessLocation(tx, params.id, changes.location);
      }
      return tx.company.findUniqueOrThrow({
        where: { id: params.id },
        include: businessDirectoryInclude,
      });
    });
    return NextResponse.json({ data: toBusinessRecord(business) });
  } catch (error) {
    if (hasPrismaCode(error, "P2002")) {
      return NextResponse.json({ message: "A business with that name already exists." }, { status: 409 });
    }
    console.error("Could not update a directory business:", error);
    return NextResponse.json({ message: "Could not update the business." }, { status: 503 });
  }
}

export async function DELETE(_request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const unauthorized = await authorizationError();
  if (unauthorized) return unauthorized;
  if (!isUuid(params.id)) {
    return NextResponse.json({ message: "Business not found." }, { status: 404 });
  }

  try {
    const business = await prisma.company.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        _count: {
          select: {
            departments: true,
            memberships: true,
            leaderAssignments: true,
            careerAreas: true,
            vacancies: true,
            applications: true,
            newsArticles: true,
            events: true,
            notices: true,
            galleries: true,
            contactMessages: true,
            offerings: true,
            achievements: true,
            relations: true,
            relatedTo: true,
          },
        },
      },
    });
    if (!business) return NextResponse.json({ message: "Business not found." }, { status: 404 });
    if (Object.values(business._count).some((count) => count > 0)) {
      return NextResponse.json(
        { message: "This company has related content and cannot be deleted. Archive it instead." },
        { status: 409 },
      );
    }
    await prisma.company.delete({ where: { id: params.id } });
    return NextResponse.json({ deleted: true });
  } catch (error) {
    if (hasPrismaCode(error, "P2003")) {
      return NextResponse.json(
        { message: "This company has related content and cannot be deleted. Archive it instead." },
        { status: 409 },
      );
    }
    console.error("Could not delete a directory business:", error);
    return NextResponse.json({ message: "Could not delete the business." }, { status: 503 });
  }
}
