import { NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { businessDirectoryInclude, toBusinessRecord } from "@/server/business-directory";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const companies = await prisma.company.findMany({
      where: { status: "PUBLISHED" },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: businessDirectoryInclude,
    });
    return NextResponse.json({ data: companies.map(toBusinessRecord) });
  } catch (error) {
    console.error("Could not load the PostgreSQL business directory:", error);
    return NextResponse.json(
      { message: "Could not load the Sanjeevani business directory." },
      { status: 503 },
    );
  }
}
