import { NextResponse } from "next/server";
import { apiError, readBody } from "@/lib/api";
import { requireApiAuth } from "@/lib/auth";
import { updatePromo } from "@/lib/db";
import { promoPatchSchema } from "@/lib/schemas";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const unauthorized = await requireApiAuth();
  if (unauthorized) return unauthorized;

  try {
    const { id } = await params;
    const data = promoPatchSchema.parse(await readBody<unknown>(request));
    const promo = await updatePromo(id, data);
    return NextResponse.json({ promo });
  } catch (error) {
    return apiError(error);
  }
}
