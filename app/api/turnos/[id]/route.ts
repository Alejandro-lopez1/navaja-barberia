import { NextResponse } from "next/server";
import { apiError, readBody } from "@/lib/api";
import { requireApiAuth } from "@/lib/auth";
import { getTurno, listLogs } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { turnoPatchSchema } from "@/lib/schemas";
import {
  aplicarDescuento,
  cambiarEstado,
  editarTurno,
} from "@/lib/turnos-service";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const unauthorized = await requireApiAuth();
  if (unauthorized) return unauthorized;

  try {
    const { id } = await params;
    const turno = await getTurno(id);
    if (!turno) throw new AppError("Turno no encontrado.", 404);
    const logs = await listLogs(id);
    return NextResponse.json({ turno, logs });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const unauthorized = await requireApiAuth();
  if (unauthorized) return unauthorized;

  try {
    const { id } = await params;
    const data = turnoPatchSchema.parse(await readBody<unknown>(request));

    if (data.accion === "estado") {
      const turno = await cambiarEstado(id, data.estado, data.metodoPago);
      return NextResponse.json({ turno });
    }

    if (data.accion === "descuento") {
      const turno = await aplicarDescuento(
        id,
        data.descuentoTipo,
        data.descuentoValor,
        data.descuentoMotivo,
      );
      return NextResponse.json({ turno });
    }

    const turno = await editarTurno(id, data);
    return NextResponse.json({ turno });
  } catch (error) {
    return apiError(error);
  }
}
