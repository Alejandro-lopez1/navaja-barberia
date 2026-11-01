import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AppError } from "./errors";

export function apiError(error: unknown): NextResponse {
  if (error instanceof AppError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  if (error instanceof ZodError) {
    const message = error.issues[0]?.message || "Datos inválidos.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  console.error("[api]", error);
  return NextResponse.json(
    { error: "Ocurrió un error inesperado. Revisá la configuración del servidor." },
    { status: 500 },
  );
}

export async function readBody<T>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    throw new AppError("El cuerpo de la solicitud no es JSON válido.");
  }
}
