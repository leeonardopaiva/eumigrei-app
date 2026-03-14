import { createHash, randomBytes } from 'crypto';
import { isConfiguredAdminEmail } from '@/lib/admin';

const EMAIL_CHANGE_TOKEN_TTL_MS = 30 * 60 * 1000;

export const createEmailChangeToken = () => randomBytes(32).toString('hex');

export const hashEmailChangeToken = (token: string) =>
  createHash('sha256').update(token).digest('hex');

export const getEmailChangeExpiry = () => new Date(Date.now() + EMAIL_CHANGE_TOKEN_TTL_MS);

export const normalizeEmail = (value: string) => value.trim().toLowerCase();

export const canSelfServeEmailChange = (email: string, isAdmin = false) =>
  isAdmin || !isConfiguredAdminEmail(normalizeEmail(email));
