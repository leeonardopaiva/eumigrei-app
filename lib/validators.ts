import { BusinessStatus, EventStatus, UserRole } from '@prisma/client';
import { z } from 'zod';
import { USERNAME_MAX_LENGTH, USERNAME_MIN_LENGTH, USERNAME_PATTERN, isReservedUsername } from '@/lib/username';
import { isValidHttpUrl, normalizeHttpUrlInput } from '@/lib/url';

const emptyToUndefined = (value: string) => {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const optionalString = z.string().transform(emptyToUndefined).optional();
const optionalEmail = z
  .string()
  .transform(emptyToUndefined)
  .optional()
  .refine((value) => !value || z.string().email().safeParse(value).success, {
    message: 'Use um email valido',
  });

const optionalUrl = z
  .string()
  .optional()
  .transform((value) => (typeof value === 'string' ? normalizeHttpUrlInput(value) : undefined))
  .transform((value) => (typeof value === 'string' ? emptyToUndefined(value) : undefined))
  .refine((value) => !value || isValidHttpUrl(value), {
    message: 'Use a valid URL starting with http:// or https://',
  });

const requiredUrl = z
  .string()
  .transform(normalizeHttpUrlInput)
  .refine((value) => value.length > 0, {
    message: 'Informe uma URL valida',
  })
  .refine((value) => isValidHttpUrl(value), {
    message: 'Use uma URL valida iniciando com http:// ou https://',
  });

const optionalUrlArray = z
  .array(z.string())
  .max(12, 'Use no maximo 12 imagens na galeria')
  .transform((values) =>
    Array.from(
      new Set(
        values
          .map((value) => normalizeHttpUrlInput(value))
          .map((value) => emptyToUndefined(value))
          .filter((value): value is string => Boolean(value)),
      ),
    ),
  )
  .refine((values) => values.every((value) => isValidHttpUrl(value)), {
    message: 'Use URLs validas para a galeria iniciando com http:// ou https://',
  })
  .default([]);

export const usernameSchema = z
  .string()
  .trim()
  .min(USERNAME_MIN_LENGTH, 'Use ao menos 3 caracteres para seu nome publico')
  .max(USERNAME_MAX_LENGTH, `Use no maximo ${USERNAME_MAX_LENGTH} caracteres`)
  .regex(USERNAME_PATTERN, 'Use apenas letras minusculas, numeros e hifens')
  .refine((value) => !isReservedUsername(value), {
    message: 'Esse nome esta reservado pela plataforma',
  });

export const onboardingSchema = z.object({
  name: z.string().trim().min(2).max(80),
  username: usernameSchema,
  email: z.string().email().optional(),
  phone: optionalString.refine((value) => !value || value.length >= 8, {
    message: 'Telefone muito curto',
  }),
  regionKey: z.string().trim().min(2, 'Selecione uma regiao valida'),
});

export const updateRegionSchema = z.object({
  regionKey: z.string().trim().min(2, 'Selecione uma regiao valida'),
});

export const updateProfileImageSchema = z.object({
  image: optionalUrl,
});

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2).max(80),
  username: usernameSchema,
  email: optionalEmail,
  phone: optionalString.refine((value) => !value || value.length >= 8, {
    message: 'Telefone muito curto',
  }),
});

export const updateBusinessMediaSchema = z.object({
  imageUrl: optionalUrl,
  galleryUrls: optionalUrlArray,
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

export const adminBannerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  imageUrl: requiredUrl,
  targetUrl: requiredUrl,
  regionKey: z.string().trim().transform(emptyToUndefined).optional(),
  isActive: z.boolean().default(true),
});

export const businessSchema = z.object({
  name: z.string().trim().min(2).max(80),
  category: z.string().trim().min(2).max(40),
  description: z.string().trim().min(10).max(600),
  address: z.string().trim().min(5).max(140),
  regionKey: z.string().trim().min(2, 'Selecione uma regiao valida'),
  phone: optionalString,
  whatsapp: optionalString,
  website: optionalUrl,
  instagram: optionalString,
  imageUrl: optionalUrl,
  galleryUrls: optionalUrlArray,
});

export const eventSchema = z.object({
  title: z.string().trim().min(4).max(100),
  description: z.string().trim().min(10).max(700),
  venueName: z.string().trim().min(3).max(100),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime().optional(),
  regionKey: z.string().trim().min(2, 'Selecione uma regiao valida'),
  externalUrl: optionalUrl,
  imageUrl: optionalUrl,
});

export const adminBusinessSchema = businessSchema.extend({
  status: z.nativeEnum(BusinessStatus),
});

export const adminEventSchema = eventSchema.extend({
  status: z.nativeEnum(EventStatus),
});

export const adminUserSchema = z.object({
  name: z.string().trim().min(2).max(80),
  username: usernameSchema,
  email: optionalEmail,
  phone: optionalString.refine((value) => !value || value.length >= 8, {
    message: 'Telefone muito curto',
  }),
  image: optionalUrl,
  role: z.nativeEnum(UserRole),
  regionKey: z.string().trim().min(2, 'Selecione uma regiao valida'),
  onboardingCompleted: z.boolean().default(true),
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
