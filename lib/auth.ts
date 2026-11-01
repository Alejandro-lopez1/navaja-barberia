import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const AUTH_COOKIE = "navaja_auth";

export function authEnabled(): boolean {
  const pin = process.env.APP_PIN;
  const authSecret = process.env.AUTH_SECRET;

  if (process.env.NODE_ENV === "production") {
    if (!pin) {
      throw new Error("APP_PIN es obligatorio en producción.");
    }
    if (!authSecret || authSecret.length < 32) {
      throw new Error("AUTH_SECRET debe tener al menos 32 caracteres en producción.");
    }
  }

  return Boolean(pin);
}

function secret(): string {
  return process.env.AUTH_SECRET || "navaja-dev-secret-change-me";
}

export function tokenForPin(pin: string): string {
  return createHmac("sha256", secret()).update(pin).digest("hex");
}

export function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export async function isAuthenticated(): Promise<boolean> {
  if (!authEnabled()) return true;
  const store = await cookies();
  const token = store.get(AUTH_COOKIE)?.value;
  if (!token) return false;
  return safeEqual(token, tokenForPin(process.env.APP_PIN || ""));
}

export async function requireApiAuth(): Promise<NextResponse | null> {
  if (await isAuthenticated()) return null;
  return NextResponse.json({ error: "No autorizado." }, { status: 401 });
}
