import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/server/auth/guard";
import { changeApplicationStatus, downloadApplicationDocument, getApplication } from "@/server/recruitment/applications";
import { handle, notFound, readJson } from "@/server/http/errors";
import { requestMeta } from "@/server/http/request";

export const dynamic = "force-dynamic";

// GET downloads the applicant's CV; PATCH marks the application reviewed or new.
type Context = { params: { id: string } };
const statusSchema = z.object({ status: z.enum(["new", "reviewed"]) }).strict();

export const GET = handle(async (request: Request, { params }: Context) => {
  const user = await requirePermission(request, "application.read", "any");
  const id = z.string().uuid().parse(params.id);
  const meta = requestMeta(request);
  const application = await getApplication(user, id, meta);
  const cv = application.documents.find((document) => document.kind === "CV");
  if (!cv) throw notFound("The application has no CV attached.");
  const file = await downloadApplicationDocument(user, id, cv.id, meta);
  const fileName = file.fileName.replace(/[\r\n"\\]/g, "_");
  return new Response(new Uint8Array(file.bytes), {
    headers: {
      "Content-Type": file.mimeType,
      "Content-Disposition": `attachment; filename="${fileName}"; filename*=UTF-8''${encodeURIComponent(file.fileName)}`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "sandbox; default-src 'none'",
    },
  });
});

export const PATCH = handle(async (request: Request, { params }: Context) => {
  const user = await requirePermission(request, "application.update", "any");
  const id = z.string().uuid().parse(params.id);
  const { status } = statusSchema.parse(await readJson(request));
  const nextStatus = status === "new" ? "SUBMITTED" : "UNDER_REVIEW";
  await changeApplicationStatus(user, id, { status: nextStatus }, requestMeta(request));
  return NextResponse.json({ data: { _id: id, status } });
});
