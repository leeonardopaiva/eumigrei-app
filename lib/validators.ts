import { z } from 'zod';

const emptyToUndefined = (value: string) => {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const optionalString = z.string().transform(emptyToUndefined).optional();

const optionalUrl = z
  .string()
  .transform(emptyToUndefined)
  .optional()
  .refine((value) => !value || /^https?:\/\//i.test(value), {
    message: 'Use a valid URL starting with http:// or https://',
  });

export const onboardingSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().email().optional(),
  phone: optionalString.refine((value) => !value || value.length >= 8, {
    message: 'Telefone muito curto',
  }),
  regionKey: z.string().trim().min(2, 'Selecione uma regiao valida'),
});

export const updateRegionSchema = z.object({
  regionKey: z.string().trim().min(2, 'Selecione uma regiao valida'),
});

const regionKeySchema = z
  .string()
  .trim()
  .min(3)
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use apenas letras minusculas, numeros e hifens');

export const adminRegionSchema = z.object({
  key: regionKeySchema.optional(),
  label: z.string().trim().min(3).max(80),
  city: z.string().trim().min(2).max(60),
  state: z.string().trim().min(2).max(40),
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  aliases: z.array(z.string().trim().min(2).max(60)).max(20).default([]),
  isActive: z.boolean().default(true),
});

export const businessSchema = z.object({
  name: z.string().trim().min(2).max(80),
  category: z.string().trim().min(2).max(40),
  description: z.string().trim().min(10).max(600),
  address: z.string().trim().min(5).max(140),
  phone: optionalString,
  whatsapp: optionalString,
  website: optionalUrl,
  instagram: optionalString,
  imageUrl: optionalUrl,
});

export const eventSchema = z.object({
  title: z.string().trim().min(4).max(100),
  description: z.string().trim().min(10).max(700),
  venueName: z.string().trim().min(3).max(100),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime().optional(),
  locationLabel: z.string().trim().min(2).max(120),
  externalUrl: optionalUrl,
  imageUrl: optionalUrl,
});

export const communityPostSchema = z.object({
  content: z.string().trim().min(5).max(500),
  imageUrl: optionalUrl,
});

export const commentSchema = z.object({
  content: z.string().trim().min(2).max(240),
});

export const businessReviewSchema = z.object({
  action: z.enum(['approve', 'reject', 'suspend']),
});

export const eventReviewSchema = z.object({
  action: z.enum(['approve', 'reject', 'cancel']),
});

export const postReviewSchema = z.object({
  action: z.enum(['approve', 'remove']),
});
