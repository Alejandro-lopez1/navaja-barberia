import { NextResponse } from "next/server";
import { apiError, readBody } from "@/lib/api";
import { requireApiAuth } from "@/lib/auth";
import { createServicio, listServicios } from "@/lib/db";
import { servicioSchema } from "@/lib/schemas";

export const dynamic = "force-dynamic";

export async function GET() {
  const unauthorized = await requireApiAuth();
  if (unauthorized) return unauthorized;

  try {
    return NextResponse.json({ servicios: await listServicios() });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  const unauthorized = await requireApiAuth();
  if (unauthorized) return unauthorized;

  try {
    const data = servicioSchema.parse(await readBody<unknown>(request));
    const servicio = await createServicio(data);
    return NextResponse.json({ servicio }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
