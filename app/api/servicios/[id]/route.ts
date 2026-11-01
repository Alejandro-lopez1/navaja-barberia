import { NextResponse } from "next/server";
import { apiError, readBody } from "@/lib/api";
import { requireApiAuth } from "@/lib/auth";
import { updateServicio } from "@/lib/db";
import { servicioPatchSchema } from "@/lib/schemas";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const unauthorized = await requireApiAuth();
  if (unauthorized) return unauthorized;

  try {
    const { id } = await params;
    const data = servicioPatchSchema.parse(await readBody<unknown>(request));
    const servicio = await updateServicio(id, data);
    return NextResponse.json({ servicio });
  } catch (error) {
    return apiError(error);
  }
}
