import { NextResponse } from "next/server";
import { apiError, readBody } from "@/lib/api";
import { requireApiAuth } from "@/lib/auth";
import { createPromo, listPromos } from "@/lib/db";
import { promoSchema } from "@/lib/schemas";

export const dynamic = "force-dynamic";

export async function GET() {
  const unauthorized = await requireApiAuth();
  if (unauthorized) return unauthorized;

  try {
    return NextResponse.json({ promos: await listPromos() });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  const unauthorized = await requireApiAuth();
  if (unauthorized) return unauthorized;

  try {
    const data = promoSchema.parse(await readBody<unknown>(request));
    const promo = await createPromo(data);
    return NextResponse.json({ promo }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
