import { createHmac, randomInt, timingSafeEqual } from 'node:crypto';

const CAPTCHA_TTL_MS = 10 * 60 * 1000;

type CaptchaPayload = {
  answer: number;
  exp: number;
};

const getCaptchaSecret = () => {
  const secret = process.env.NEXTAUTH_SECRET;

  if (!secret) {
    throw new Error('NEXTAUTH_SECRET is required to sign captcha challenges.');
  }

  return secret;
};

const encodeBase64Url = (value: string) => Buffer.from(value, 'utf8').toString('base64url');

const decodeBase64Url = (value: string) => Buffer.from(value, 'base64url').toString('utf8');

const signPayload = (payload: string) =>
  createHmac('sha256', getCaptchaSecret()).update(payload).digest('base64url');

export const createSimpleCaptcha = () => {
  const left = randomInt(2, 10);
  const right = randomInt(1, 10);
  const operator = Math.random() > 0.35 ? '+' : '-';
  const safeLeft = operator === '-' && left < right ? right + randomInt(1, 5) : left;
  const answer = operator === '+' ? safeLeft + right : safeLeft - right;
  const payload = encodeBase64Url(
    JSON.stringify({
      answer,
      exp: Date.now() + CAPTCHA_TTL_MS,
    } satisfies CaptchaPayload),
  );
  const signature = signPayload(payload);

  return {
    prompt: `${safeLeft} ${operator} ${right} = ?`,
    token: `${payload}.${signature}`,
  };
};

export const verifySimpleCaptcha = (token: string, answer: string | number) => {
  if (!token || (!answer && answer !== 0)) {
    return false;
  }

  const [payload, signature] = token.split('.');

  if (!payload || !signature) {
    return false;
  }

  const expectedSignature = signPayload(payload);
  const expectedBuffer = Buffer.from(expectedSignature);
  const signatureBuffer = Buffer.from(signature);

  if (
    expectedBuffer.length !== signatureBuffer.length ||
    !timingSafeEqual(expectedBuffer, signatureBuffer)
  ) {
    return false;
  }

  const parsed = JSON.parse(decodeBase64Url(payload)) as CaptchaPayload;
  const numericAnswer = Number.parseInt(String(answer).trim(), 10);

  if (!Number.isFinite(numericAnswer) || parsed.exp < Date.now()) {
    return false;
  }

  return numericAnswer === parsed.answer;
};
