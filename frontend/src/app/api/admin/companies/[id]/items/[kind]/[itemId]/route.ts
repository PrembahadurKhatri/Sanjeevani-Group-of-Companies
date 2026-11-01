import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/server/auth/guard";
import { deleteItem, updateItem } from "@/server/companies/items";
import { handle, readJson } from "@/server/http/errors";
import { requestMeta } from "@/server/http/request";
import { ITEM_SCHEMAS, itemKind } from "@/server/validation/company-items";

export const dynamic = "force-dynamic";

type Context = { params: { id: string; kind: string; itemId: string } };
const parse = (params: Context["params"]) => ({
  companyId: z.string().uuid().parse(params.id),
  kind: itemKind.parse(params.kind),
  itemId: z.string().uuid().parse(params.itemId),
});

export const PATCH = handle(async (request: Request, { params }: Context) => {
  const user = await requireUser(request);
  const { companyId, kind, itemId } = parse(params);
  const input = ITEM_SCHEMAS[kind].update.parse(await readJson(request));
  const { ipHash, userAgent } = requestMeta(request);
  const { item, companySlug } = await updateItem(user, companyId, kind, itemId, input, { ipHash, userAgent });
  revalidatePath(`/businesses/${companySlug}`);
  return NextResponse.json({ item });
});

export const DELETE = handle(async (request: Request, { params }: Context) => {
  const user = await requireUser(request);
  const { companyId, kind, itemId } = parse(params);
  const { ipHash, userAgent } = requestMeta(request);
  const { companySlug } = await deleteItem(user, companyId, kind, itemId, { ipHash, userAgent });
  revalidatePath(`/businesses/${companySlug}`);
  return NextResponse.json({ ok: true });
});
