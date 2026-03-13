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
    message: 'Phone number is too short',
  }),
  locationLabel: z.string().trim().min(2).max(120),
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
