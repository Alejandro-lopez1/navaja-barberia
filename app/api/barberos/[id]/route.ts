import { NextResponse } from "next/server";
import { apiError, readBody } from "@/lib/api";
import { requireApiAuth } from "@/lib/auth";
import { updateBarbero } from "@/lib/db";
import { barberoPatchSchema } from "@/lib/schemas";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const unauthorized = await requireApiAuth();
  if (unauthorized) return unauthorized;

  try {
    const { id } = await params;
    const data = barberoPatchSchema.parse(await readBody<unknown>(request));
    const barbero = await updateBarbero(id, data);
    return NextResponse.json({ barbero });
  } catch (error) {
    return apiError(error);
  }
}
