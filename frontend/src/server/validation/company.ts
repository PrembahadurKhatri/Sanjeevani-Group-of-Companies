import { z } from "zod";
import { toWebsiteUrl } from "@/data/companyProfiles";
import { SECTION_KEYS } from "@/lib/company-sections";

const optionalText = (max: number) =>
  z.string().trim().max(max).transform((value) => value || null).nullable().optional();

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

const phone = z
  .string()
  .trim()
  .max(40)
  .regex(/^[+\d][\d\s\-()/,]*$/, "Enter a valid phone number.")
  .or(z.literal(""))
  .transform((value) => value || null)
  .nullable()
  .optional();

const email = z.string().trim().toLowerCase().email("Enter a valid email address.").max(254).or(z.literal("")).transform((v) => v || null).nullable().optional();

export const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(2)
  .max(100)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and single hyphens only.");

const currentYear = new Date().getFullYear();

const httpsUrl = z.string().trim().url("Enter a full link starting with https://").refine((v) => v.startsWith("https://"), "Use an https:// link.").nullable().optional();

export const keyFactsSchema = z.array(z.object({ label: z.string().trim().min(1).max(60), value: z.string().trim().min(1).max(120) })).max(12);

// The company's map: a Google Maps embed address. The whole <iframe> code
// from Google Maps (Share → Embed a map) may be pasted; only its src is kept.
// Other sites are refused, so the page never frames arbitrary content.
export const MAP_EMBED_PATTERN = /^https:\/\/(www\.google\.[a-z.]+\/maps\/embed\?|(www\.)?google\.[a-z.]+\/maps\?[^"]*output=embed|maps\.google\.[a-z.]+\/maps\?[^"]*output=embed)/i;
const mapUrl = z
  .string()
  .max(5000)
  .transform((v) => (/<iframe/i.test(v) ? (/src=["']([^"']+)["']/i.exec(v)?.[1] ?? "") : v).trim().replace(/&amp;/g, "&"))
  .refine((v) => v === "" || MAP_EMBED_PATTERN.test(v), "In Google Maps choose Share → Embed a map, copy the HTML and paste it here.")
  .transform((v) => v || null)
  .nullable()
  .optional();

export const profileSectionsSchema = z
  .array(z.object({
    key: z.enum(SECTION_KEYS),
    enabled: z.boolean(),
    label: z.string().trim().max(40).optional().transform((v) => v || undefined),
    showEmpty: z.boolean().optional(),
  }))
  .max(SECTION_KEYS.length)
  .refine((list) => new Set(list.map((s) => s.key)).size === list.length, "Each section can only be listed once.");

const companyFields = {
  name: z.string().trim().min(2, "Enter the company name.").max(160),
  slug: slugSchema,
  category: z.enum(["HEALTHCARE", "EDUCATION", "AGRICULTURE", "OTHER"]),
  sectorId: z.string().uuid().nullable(),
  sectorLabel: z.string().trim().min(2).max(120),
  description: z.string().trim().max(5000),
  website,
  email,
  phone,
  establishedYear: z.number().int().min(1900).max(currentYear).nullable().optional(),
  logoId: z.string().uuid().nullable().optional(),
  bannerId: z.string().uuid().nullable().optional(),
  featured: z.boolean().optional(),
  sortOrder: z.number().int().min(0).max(10000).optional(),
  mission: z.string().trim().max(2000).nullable().optional(),
  vision: z.string().trim().max(2000).nullable().optional(),
  services: z.array(z.string().trim().min(1).max(200)).max(30).optional(),
  facebookUrl: httpsUrl,
  linkedinUrl: httpsUrl,
  instagramUrl: httpsUrl,
  youtubeUrl: httpsUrl,
  seoTitle: z.string().trim().max(70).nullable().optional(),
  seoDescription: z.string().trim().max(160).nullable().optional(),
  // Profile page
  shortName: optionalText(60),
  industry: optionalText(120),
  headquarters: optionalText(200),
  fullDescription: optionalText(10000),
  keyFacts: keyFactsSchema.optional(),
  background: optionalText(5000),
  history: optionalText(5000),
  coreValues: z.array(z.string().trim().min(1).max(200)).max(20).optional(),
  philosophy: optionalText(3000),
  servicesTitle: optionalText(40),
  registeredAddress: optionalText(300),
  officeHours: optionalText(300),
  mapUrl: mapUrl,
  shareImageId: z.string().uuid().nullable().optional(),
  profileSections: profileSectionsSchema.optional(),
};

const companyBase = z.object(companyFields);

export const companyCreateSchema = companyBase.extend({
  slug: slugSchema.optional(), // derived from the name when omitted
  sectorId: companyFields.sectorId.optional(),
  description: companyFields.description.default(""),
});

export const companyUpdateSchema = companyBase
  .partial()
  .extend({
    // The updatedAt the editor loaded; a different value means someone else saved in between.
    expectedUpdatedAt: z.string().datetime().optional(),
  })
  .strict();

export type CompanyCreateInput = z.infer<typeof companyCreateSchema>;
export type CompanyUpdateInput = z.infer<typeof companyUpdateSchema>;

export const companyStatusSchema = z.object({ action: z.enum(["publish", "unpublish", "archive", "restore"]) });

const coordinate = (min: number, max: number) => z.number().min(min).max(max).nullable().optional();

export const locationsSchema = z.object({
  locations: z
    .array(
      z.object({
        name: z.string().trim().min(2).max(120),
        addressLine: optionalText(300),
        municipality: optionalText(120),
        district: optionalText(120),
        province: optionalText(120),
        country: z.string().trim().min(2).max(80).default("Nepal"),
        latitude: coordinate(-90, 90),
        longitude: coordinate(-180, 180),
        phone,
        email,
        imageId: z.string().uuid().nullable().optional(),
        websiteUrl: website,
        isPrimary: z.boolean().optional(),
      }),
    )
    .max(30),
});

export const companyListQuery = z.object({
  q: z.string().trim().max(100).optional(),
  status: z.enum(["DRAFT", "PENDING_REVIEW", "APPROVED", "PUBLISHED", "ARCHIVED"]).optional(),
});
