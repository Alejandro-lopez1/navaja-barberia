import { NextResponse } from "next/server";
import { apiError, readBody } from "@/lib/api";
import { requireApiAuth } from "@/lib/auth";
import { listTurnos } from "@/lib/db";
import { isISODate } from "@/lib/dates";
import { AppError } from "@/lib/errors";
import { turnoCreateSchema } from "@/lib/schemas";
import { crearTurno } from "@/lib/turnos-service";
import { ESTADOS, type EstadoTurno } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const unauthorized = await requireApiAuth();
  if (unauthorized) return unauthorized;

  try {
    const params = new URL(request.url).searchParams;
    const fecha = params.get("fecha") || undefined;
    const desde = params.get("desde") || undefined;
    const hasta = params.get("hasta") || undefined;
    const barberoId = params.get("barberoId") || undefined;
    const estadoParam = params.get("estado") || undefined;

    if (fecha && !isISODate(fecha)) throw new AppError("La fecha no es válida.");
    if (desde && !isISODate(desde)) throw new AppError("La fecha desde no es válida.");
    if (hasta && !isISODate(hasta)) throw new AppError("La fecha hasta no es válida.");
    if (estadoParam && !ESTADOS.includes(estadoParam as EstadoTurno)) {
      throw new AppError("El estado no es válido.");
    }

    const turnos = await listTurnos({
      fecha,
      desde,
      hasta,
      barberoId,
      estado: estadoParam as EstadoTurno | undefined,
    });

    return NextResponse.json({ turnos });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  const unauthorized = await requireApiAuth();
  if (unauthorized) return unauthorized;

  try {
    const data = turnoCreateSchema.parse(await readBody<unknown>(request));
    const turno = await crearTurno(data);
    return NextResponse.json({ turno }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
