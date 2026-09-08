import { z } from "zod";

export const userRoleSchema = z.enum(["professional", "organization", "admin"]);
export type UserRole = z.infer<typeof userRoleSchema>;

const phoneSchema = z.string().trim().regex(/^\+?[0-9 ()-]{7,20}$/);
const nameSchema = z.string().trim().min(2).max(100);

const onboardingBase = z.object({
  fullName: nameSchema,
  phone: phoneSchema,
  city: z.string().trim().min(2).max(80),
  countryCode: z.string().trim().length(2).toUpperCase(),
  locale: z.enum(["ar", "en"]),
});

export const professionalOnboardingSchema = onboardingBase.extend({
  role: z.literal("professional"),
  specialty: z.string().trim().min(2).max(100),
  licenseNumber: z.string().trim().min(3).max(100),
  yearsExperience: z.coerce.number().int().min(0).max(70),
});

export const organizationOnboardingSchema = onboardingBase.extend({
  role: z.literal("organization"),
  organizationName: nameSchema,
  organizationType: z.enum(["hospital", "clinic", "home_care", "other"]),
  licenseNumber: z.string().trim().min(3).max(100),
});

export const organizationMemberOnboardingSchema = onboardingBase.extend({
  role: z.literal("organization_member"),
});

export const onboardingSchema = z.discriminatedUnion("role", [
  professionalOnboardingSchema,
  organizationOnboardingSchema,
  organizationMemberOnboardingSchema,
]);
export type OnboardingInput = z.infer<typeof onboardingSchema>;

export const shiftCreateSchema = z
  .object({
    title: z.string().trim().min(3).max(120),
    specialty: z.string().trim().min(2).max(100),
    city: z.string().trim().min(2).max(80),
    startsAt: z.iso.datetime({ offset: true }),
    endsAt: z.iso.datetime({ offset: true }),
    neededCount: z.coerce.number().int().min(1).max(100).default(1),
    hourlyRate: z.coerce.number().positive().max(100_000).optional(),
    currency: z.enum(["YER", "SAR", "AED", "BHD", "KWD", "OMR", "QAR"]).default("YER"),
    requirements: z.array(z.string().trim().min(1).max(200)).max(20).default([]),
    publish: z.boolean().default(false),
  })
  .refine((value) => new Date(value.endsAt) > new Date(value.startsAt), {
    message: "The end time must be after the start time.",
    path: ["endsAt"],
  });
export type ShiftCreateInput = z.infer<typeof shiftCreateSchema>;

export const applicationCreateSchema = z.object({
  shiftId: z.uuid(),
  note: z.string().trim().max(1000).optional(),
});

export const applicationStatusSchema = z.object({
  status: z.enum(["shortlisted", "accepted", "rejected", "withdrawn", "cancelled", "completed"]),
});
export type ApplicationStatusInput = z.infer<typeof applicationStatusSchema>;

export const shiftStatusSchema = z.object({
  status: z.enum(["draft", "published", "filled", "cancelled", "completed"]),
});
export type ShiftStatusInput = z.infer<typeof shiftStatusSchema>;

export const profileUpdateSchema = onboardingBase.extend({
  role: userRoleSchema,
  specialty: z.string().trim().min(2).max(100).optional(),
  yearsExperience: z.coerce.number().int().min(0).max(70).optional(),
  bio: z.string().trim().max(2000).optional(),
  available: z.boolean().optional(),
  organizationName: nameSchema.optional(),
  organizationType: z.enum(["hospital", "clinic", "home_care", "other"]).optional(),
});
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;

export const messageCreateSchema = z.object({
  body: z.string().trim().min(1).max(5000),
});
export type MessageCreateInput = z.infer<typeof messageCreateSchema>;

export const documentCreateSchema = z.object({
  type: z.enum(["identity", "professional_license", "certificate", "insurance", "other"]),
  expiresOn: z.iso.date().optional(),
});

export const teamInviteSchema = z.object({
  email: z.email().max(254).transform((value) => value.trim().toLowerCase()),
  role: z.enum(["manager", "recruiter", "viewer"]),
  locale: z.enum(["ar", "en"]).default("ar"),
});

export const accountDeletionSchema = z.object({
  confirmation: z.literal("DELETE"),
});

export const contactSchema = z.object({
  name: nameSchema,
  email: z.email().max(254),
  subject: z.string().trim().min(3).max(140),
  message: z.string().trim().min(10).max(5000),
  locale: z.enum(["ar", "en"]).default("ar"),
  website: z.string().max(0).optional(),
});
export type ContactInput = z.infer<typeof contactSchema>;
