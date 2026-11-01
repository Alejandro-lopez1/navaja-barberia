import { NextResponse } from "next/server";
import { apiError } from "@/lib/api";
import { requireApiAuth } from "@/lib/auth";
import { getPromoForDate } from "@/lib/db";
import { isISODate } from "@/lib/dates";
import { AppError } from "@/lib/errors";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const unauthorized = await requireApiAuth();
  if (unauthorized) return unauthorized;

  try {
    const fecha = new URL(request.url).searchParams.get("fecha") || "";
    if (!isISODate(fecha)) throw new AppError("La fecha no es válida.");
    return NextResponse.json({ promo: await getPromoForDate(fecha) });
  } catch (error) {
    return apiError(error);
  }
}
