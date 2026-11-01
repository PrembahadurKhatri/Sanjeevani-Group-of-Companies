import type { Prisma } from "@prisma/client";
import { prisma } from "@/server/db";
import { recordAudit } from "@/server/audit";
import { can } from "@/server/auth/access";
import type { SessionUser } from "@/server/auth/session";
import { badRequest, conflict, forbidden, notFound } from "@/server/http/errors";
import type { ItemKind } from "@/server/validation/company-items";
import { slugify } from "../../../prisma/seed-helpers";

// Services/products, projects & achievements and related businesses of one
// company. Every call is checked against that company: a person may only see
// or change records of companies their role covers, whatever ids they send.

type Meta = { ipHash: string; userAgent: string | null };
type Args = Record<string, unknown>;
type Row = Record<string, unknown> & { id: string; companyId: string; status: string; updatedAt: Date };
type Delegate = {
  findMany(args: Args): Promise<Row[]>;
  findFirst(args: Args): Promise<Row | null>;
  create(args: Args): Promise<Row>;
  update(args: Args): Promise<Row>;
  delete(args: Args): Promise<Row>;
};

const image = { select: { id: true, url: true, altText: true } } as const;

const MODELS: Record<ItemKind, { model: "companyOffering" | "companyAchievement" | "companyRelation"; entity: string; include: Args; orderBy: Args[] }> = {
  offerings: { model: "companyOffering", entity: "CompanyOffering", include: { image }, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] },
  achievements: { model: "companyAchievement", entity: "CompanyAchievement", include: { image }, orderBy: [{ sortOrder: "asc" }, { date: "desc" }] },
  relations: {
    model: "companyRelation", entity: "CompanyRelation",
    include: { logo: image, relatedCompany: { select: { id: true, name: true, slug: true, status: true, logo: image } } },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  },
};

const delegate = (db: Prisma.TransactionClient, kind: ItemKind) => db[MODELS[kind].model] as unknown as Delegate;

// Company admins and editors write drafts; publishers decide what goes live.
export function itemRights(user: SessionUser, companyId: string) {
  const write = can(user.access, "company.update", companyId) || can(user.access, "content.update", companyId);
  return {
    read: write || can(user.access, "company.read", companyId),
    write,
    publish: can(user.access, "company.publish", companyId) || can(user.access, "content.publish", companyId),
  };
}

async function companyFor(user: SessionUser, companyId: string) {
  // Unknown and out-of-scope companies look the same, so ids cannot be probed.
  if (!itemRights(user, companyId).read) throw notFound("Company not found.");
  const company = await prisma.company.findUnique({ where: { id: companyId }, select: { id: true, slug: true } });
  if (!company) throw notFound("Company not found.");
  return company;
}

export async function listItems(user: SessionUser, companyId: string, kind: ItemKind) {
  await companyFor(user, companyId);
  return delegate(prisma, kind).findMany({ where: { companyId }, include: MODELS[kind].include, orderBy: MODELS[kind].orderBy });
}

async function assertImages(db: Prisma.TransactionClient, ids: (string | null | undefined)[]) {
  for (const mediaId of ids) {
    if (!mediaId) continue;
    const media = await db.mediaAsset.findUnique({ where: { id: mediaId }, select: { kind: true } });
    if (!media || media.kind !== "IMAGE") throw badRequest("The selected image does not exist.");
  }
}

async function assertRelatedCompany(db: Prisma.TransactionClient, companyId: string, relatedId: string | null | undefined) {
  if (!relatedId) return;
  if (relatedId === companyId) throw badRequest("A company cannot be listed as its own business.");
  if (!(await db.company.findUnique({ where: { id: relatedId }, select: { id: true } }))) throw badRequest("The selected company does not exist.");
}

async function uniqueSlug(db: Prisma.TransactionClient, companyId: string, base: string, exceptId?: string) {
  const root = (base || "item").slice(0, 70);
  for (let n = 1; n < 50; n += 1) {
    const slug = n === 1 ? root : `${root}-${n}`;
    const clash = await db.companyOffering.findFirst({ where: { companyId, slug, ...(exceptId ? { id: { not: exceptId } } : {}) }, select: { id: true } });
    if (!clash && slug !== "preview") return slug;
  }
  throw conflict("Choose a different web address for this item.");
}

function statusData(status: string | undefined, before?: string) {
  if (!status || status === before) return {};
  return status === "PUBLISHED" ? { status, publishedAt: new Date() } : { status };
}

export async function createItem(user: SessionUser, companyId: string, kind: ItemKind, input: Args, meta: Meta) {
  const company = await companyFor(user, companyId);
  const rights = itemRights(user, companyId);
  if (!rights.write) throw forbidden();
  if (input.status === "PUBLISHED" && !rights.publish) throw forbidden("Only a publisher can publish this. Save it as a draft and send it for review.");

  const { status, ...fields } = input;
  const row = await prisma.$transaction(async (tx) => {
    await assertImages(tx, [fields.imageId as string | null, fields.logoId as string | null]);
    if (kind === "relations") await assertRelatedCompany(tx, companyId, fields.relatedCompanyId as string | null);
    const data: Args = { ...fields, companyId, ...statusData(status as string | undefined) };
    if (kind === "offerings") data.slug = await uniqueSlug(tx, companyId, String(fields.slug ?? slugify(String(fields.title))));
    if (kind === "achievements" && typeof fields.date === "string") data.date = new Date(fields.date);
    const created = await delegate(tx, kind).create({ data, include: MODELS[kind].include });
    await recordAudit({ actorId: user.id, action: `company.${kind}.create`, entityType: MODELS[kind].entity, entityId: created.id, companyId, metadata: { title: fields.title ?? fields.name ?? null, status: created.status }, ...meta }, tx);
    return created;
  });
  return { item: row, companySlug: company.slug };
}

export async function updateItem(user: SessionUser, companyId: string, kind: ItemKind, itemId: string, input: Args, meta: Meta) {
  const company = await companyFor(user, companyId);
  const rights = itemRights(user, companyId);
  if (!rights.write) throw forbidden();
  const { expectedUpdatedAt, status, ...fields } = input;

  const row = await prisma.$transaction(async (tx) => {
    // companyId in the filter: an id from another company is simply not found.
    const before = await delegate(tx, kind).findFirst({ where: { id: itemId, companyId } });
    if (!before) throw notFound("Item not found.");
    if (typeof expectedUpdatedAt === "string" && before.updatedAt.toISOString() !== new Date(expectedUpdatedAt).toISOString()) {
      throw conflict("Someone else saved this item while you were editing. Reload to see their changes.");
    }
    const goingLive = status === "PUBLISHED" && before.status !== "PUBLISHED";
    if ((goingLive || before.status === "PUBLISHED") && !rights.publish) {
      throw forbidden(goingLive ? "Only a publisher can publish this." : "This item is live. Ask a publisher to change it.");
    }
    await assertImages(tx, [fields.imageId as string | null, fields.logoId as string | null]);
    if (kind === "relations") await assertRelatedCompany(tx, companyId, fields.relatedCompanyId as string | null);
    const data: Args = { ...fields, ...statusData(status as string | undefined, before.status) };
    if (kind === "offerings" && typeof fields.slug === "string") data.slug = await uniqueSlug(tx, companyId, fields.slug, itemId);
    if (kind === "achievements" && "date" in fields) data.date = typeof fields.date === "string" ? new Date(fields.date) : null;
    const updated = await delegate(tx, kind).update({ where: { id: itemId }, data, include: MODELS[kind].include });
    await recordAudit({ actorId: user.id, action: `company.${kind}.update`, entityType: MODELS[kind].entity, entityId: itemId, companyId, metadata: { fields: Object.keys(fields), status: { before: before.status, after: updated.status } }, ...meta }, tx);
    return updated;
  });
  return { item: row, companySlug: company.slug };
}

// Changes only the order of a company's items (a list of ids, first to last).
export async function reorderItems(user: SessionUser, companyId: string, kind: ItemKind, ids: string[], meta: Meta) {
  const company = await companyFor(user, companyId);
  if (!itemRights(user, companyId).write) throw forbidden();
  await prisma.$transaction(async (tx) => {
    const owned = await delegate(tx, kind).findMany({ where: { companyId, id: { in: ids } } });
    if (owned.length !== ids.length) throw badRequest("Some items do not belong to this company.");
    for (const [index, itemId] of ids.entries()) await delegate(tx, kind).update({ where: { id: itemId }, data: { sortOrder: index } });
    await recordAudit({ actorId: user.id, action: `company.${kind}.reorder`, entityType: "Company", entityId: companyId, companyId, metadata: { count: ids.length }, ...meta }, tx);
  });
  return { companySlug: company.slug };
}

export async function deleteItem(user: SessionUser, companyId: string, kind: ItemKind, itemId: string, meta: Meta) {
  const company = await companyFor(user, companyId);
  const rights = itemRights(user, companyId);
  if (!rights.write) throw forbidden();
  await prisma.$transaction(async (tx) => {
    const before = await delegate(tx, kind).findFirst({ where: { id: itemId, companyId } });
    if (!before) throw notFound("Item not found.");
    if (before.status === "PUBLISHED" && !rights.publish) throw forbidden("This item is live. Ask a publisher to remove it.");
    await delegate(tx, kind).delete({ where: { id: itemId } });
    await recordAudit({ actorId: user.id, action: `company.${kind}.delete`, entityType: MODELS[kind].entity, entityId: itemId, companyId, metadata: { title: before.title ?? before.name ?? null }, ...meta }, tx);
  });
  return { companySlug: company.slug };
}
