import { NextResponse } from "next/server";
import { apiError, readBody } from "@/lib/api";
import { requireApiAuth } from "@/lib/auth";
import { createBarbero, listBarberos } from "@/lib/db";
import { barberoSchema } from "@/lib/schemas";

export const dynamic = "force-dynamic";

export async function GET() {
  const unauthorized = await requireApiAuth();
  if (unauthorized) return unauthorized;

  try {
    return NextResponse.json({ barberos: await listBarberos() });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  const unauthorized = await requireApiAuth();
  if (unauthorized) return unauthorized;

  try {
    const data = barberoSchema.parse(await readBody<unknown>(request));
    const barbero = await createBarbero({
      nombre: data.nombre,
      activo: data.activo,
      comisionPorcentaje: data.comisionPorcentaje,
      comisionFija: data.comisionFija,
      telefono: data.telefono,
      notas: data.notas,
    });
    return NextResponse.json({ barbero }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
