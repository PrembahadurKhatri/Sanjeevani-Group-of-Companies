import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/server/auth/guard";
import { createItem, listItems, reorderItems } from "@/server/companies/items";
import { handle, readJson } from "@/server/http/errors";
import { requestMeta } from "@/server/http/request";
import { ITEM_SCHEMAS, itemKind } from "@/server/validation/company-items";

export const dynamic = "force-dynamic";

type Context = { params: { id: string; kind: string } };
const parse = (params: Context["params"]) => ({ companyId: z.string().uuid().parse(params.id), kind: itemKind.parse(params.kind) });

export const GET = handle(async (request: Request, { params }: Context) => {
  const user = await requireUser(request);
  const { companyId, kind } = parse(params);
  return NextResponse.json({ items: await listItems(user, companyId, kind) });
});

export const POST = handle(async (request: Request, { params }: Context) => {
  const user = await requireUser(request);
  const { companyId, kind } = parse(params);
  const input = ITEM_SCHEMAS[kind].create.parse(await readJson(request));
  const { ipHash, userAgent } = requestMeta(request);
  const { item, companySlug } = await createItem(user, companyId, kind, input, { ipHash, userAgent });
  revalidatePath(`/businesses/${companySlug}`);
  return NextResponse.json({ item }, { status: 201 });
});

// Body: { ids: [...] } in the new order.
export const PUT = handle(async (request: Request, { params }: Context) => {
  const user = await requireUser(request);
  const { companyId, kind } = parse(params);
  const { ids } = z.object({ ids: z.array(z.string().uuid()).min(1).max(200) }).parse(await readJson(request));
  const { ipHash, userAgent } = requestMeta(request);
  const { companySlug } = await reorderItems(user, companyId, kind, ids, { ipHash, userAgent });
  revalidatePath(`/businesses/${companySlug}`);
  return NextResponse.json({ ok: true });
});
