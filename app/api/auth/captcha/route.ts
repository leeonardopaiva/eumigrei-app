import { NextResponse } from 'next/server';
import { createSimpleCaptcha } from '@/lib/simple-captcha';

export async function GET() {
  const captcha = createSimpleCaptcha();

  return NextResponse.json(captcha);
}
