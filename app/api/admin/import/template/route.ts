import { NextResponse } from 'next/server';
import { buildAdminImportTemplate } from '@/lib/admin-import';
import { requireAdminSession } from '@/lib/require-admin';

export const runtime = 'nodejs';

export async function GET() {
  const { response } = await requireAdminSession();

  if (response) {
    return response;
  }

  const buffer = await buildAdminImportTemplate();

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="emigrei-import-template.xlsx"',
      'Cache-Control': 'no-store',
    },
  });
}
