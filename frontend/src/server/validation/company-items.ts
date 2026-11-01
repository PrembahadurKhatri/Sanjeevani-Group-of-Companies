import { z } from "zod";
import { toWebsiteUrl } from "@/data/companyProfiles";

// Records that belong to one company's profile page: its services/products,
// projects & achievements, and related businesses. The company comes from the
// URL, never from the body, so a record cannot be moved to another company.

const text = (max: number) => z.string().trim().max(max).transform((v) => v || null).nullable().optional();
const id = z.string().uuid().nullable().optional();
const sortOrder = z.number().int().min(0).max(10000).optional();
const status = z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional();

const website = z
  .string()
  .trim()
  .max(300)
  .nullable()
  .optional()
  .transform((value, ctx) => {
    if (!value) return value === undefined ? undefined : null;
    const url = toWebsiteUrl(value);
    if (!url) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Enter a valid website address." });
    return url ?? null;
  });

// "preview" is the address of the profile preview page, so it cannot be a slug.
const itemSlug = z
  .string()
  .trim()
  .toLowerCase()
  .min(2)
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and single hyphens only.")
  .refine((v) => v !== "preview", "This web address is reserved.");

const offering = {
  title: z.string().trim().min(2, "Enter a title.").max(160),
  slug: itemSlug.optional(),
  summary: text(600),
  body: text(10000),
  imageId: id,
  sortOrder,
  status,
};

const achievement = {
  kind: z.enum(["PROJECT", "AWARD", "CERTIFICATION", "ACHIEVEMENT", "MILESTONE"]),
  title: z.string().trim().min(2, "Enter a title.").max(160),
  description: text(3000),
  date: z.string().datetime().nullable().optional(),
  imageId: id,
  sortOrder,
  status,
};

const relation = {
  relationType: z.enum(["SUBSIDIARY", "BRAND", "DIVISION", "ASSOCIATE", "PARTNER"]),
  relatedCompanyId: id,
  name: text(160),
  description: text(600),
  logoId: id,
  websiteUrl: website,
  sortOrder,
  status,
};

const needsName = (v: { relatedCompanyId?: string | null; name?: string | null }) => Boolean(v.relatedCompanyId || v.name);
const nameMessage = { message: "Choose one of the group's companies or enter the business name.", path: ["name"] };

export const ITEM_SCHEMAS = {
  offerings: {
    create: z.object(offering).strict(),
    update: z.object(offering).partial().extend({ expectedUpdatedAt: z.string().datetime().optional() }).strict(),
  },
  achievements: {
    create: z.object(achievement).strict(),
    update: z.object(achievement).partial().extend({ expectedUpdatedAt: z.string().datetime().optional() }).strict(),
  },
  relations: {
    create: z.object(relation).strict().refine(needsName, nameMessage),
    update: z.object(relation).partial().extend({ expectedUpdatedAt: z.string().datetime().optional() }).strict(),
  },
} as const;

export type ItemKind = keyof typeof ITEM_SCHEMAS;
export const itemKind = z.enum(["offerings", "achievements", "relations"]);
