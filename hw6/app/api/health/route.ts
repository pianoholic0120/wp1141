import { NextResponse } from 'next/server';
import { SuccessResponseSchema } from '@/lib/validators/response';

export async function GET() {
  const response = { ok: true, ts: Date.now() };
  
  // Validate response with Zod
  const responseValidation = SuccessResponseSchema.safeParse(response);
  if (!responseValidation.success) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
  
  return NextResponse.json(response);
}
