import { NextResponse } from "next/server";
import { loadNewsroom } from "@/server/public/newsroom";
import { handle } from "@/server/http/errors";

export const dynamic = "force-dynamic";

export const GET = handle(async () =>
  NextResponse.json(await loadNewsroom(), {
    headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
  }),
);
