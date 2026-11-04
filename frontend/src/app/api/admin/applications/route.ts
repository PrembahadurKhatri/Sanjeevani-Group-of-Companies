import { NextResponse } from "next/server";
import { companyWhere } from "@/server/auth/access";
import { requirePermission } from "@/server/auth/guard";
import { prisma } from "@/server/db";
import { handle } from "@/server/http/errors";

export const dynamic = "force-dynamic";

// The list of applications, newest first, without the CV files themselves.
export const GET = handle(async (request: Request) => {
  const user = await requirePermission(request, "application.read", "any");
  const applications = await prisma.jobApplication.findMany({
    where: companyWhere(user.access, "application.read"),
    orderBy: { createdAt: "desc" },
    take: 500,
    include: {
      company: { select: { name: true } },
      careerArea: { select: { title: true } },
      documents: {
        where: { kind: "CV", deletedAt: null },
        select: { originalName: true, bytes: true },
        take: 1,
      },
    },
  });
  const data = applications.map((application) => {
    const cv = application.documents[0];
    return {
      _id: application.id,
      vacancyTitle: application.vacancyTitle,
      company: application.company?.name ?? application.careerArea?.title ?? "Sanjeevani Group",
      fullName: application.fullName,
      email: application.email,
      phone: application.phone,
      age: application.age,
      gender: application.gender ?? "",
      address: application.address,
      education: application.education,
      experienceYears: Number(application.experienceYears),
      currentEmployer: application.currentEmployer ?? "",
      expectedSalary: application.expectedSalary ?? "",
      coverLetter: application.coverLetter ?? "",
      cvFileName: cv?.originalName ?? "",
      cvSize: cv?.bytes ?? 0,
      status: application.status === "SUBMITTED" ? "new" : "reviewed",
      createdAt: application.createdAt,
    };
  });
  return NextResponse.json({ data });
});
