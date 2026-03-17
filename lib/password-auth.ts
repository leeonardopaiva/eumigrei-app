import { randomBytes, scrypt as nodeScrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(nodeScrypt);
const SCRYPT_KEY_LENGTH = 64;

const toBuffer = (value: string, encoding: BufferEncoding = 'utf8') =>
  Buffer.from(value, encoding);

export const hashPassword = async (password: string) => {
  const salt = randomBytes(16).toString('hex');
  const derivedKey = (await scrypt(password, salt, SCRYPT_KEY_LENGTH)) as Buffer;

  return `${salt}:${derivedKey.toString('hex')}`;
};

export const verifyPassword = async (password: string, passwordHash?: string | null) => {
  if (!passwordHash) {
    return false;
  }

  const [salt, storedKeyHex] = passwordHash.split(':');

  if (!salt || !storedKeyHex) {
    return false;
  }

  const derivedKey = (await scrypt(password, salt, SCRYPT_KEY_LENGTH)) as Buffer;
  const storedKey = toBuffer(storedKeyHex, 'hex');

  if (storedKey.length !== derivedKey.length) {
    return false;
  }

  return timingSafeEqual(storedKey, derivedKey);
};

export const normalizeAuthEmail = (email: string) => email.trim().toLowerCase();
