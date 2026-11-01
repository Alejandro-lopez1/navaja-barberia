import { NextResponse } from "next/server";
import { apiError, readBody } from "@/lib/api";
import {
  AUTH_COOKIE,
  authEnabled,
  safeEqual,
  tokenForPin,
} from "@/lib/auth";
import { loginSchema } from "@/lib/schemas";

export async function POST(request: Request) {
  try {
    const body = await readBody<unknown>(request);
    const { pin } = loginSchema.parse(body);

    if (!authEnabled()) {
      return NextResponse.json({ ok: true });
    }

    const expected = process.env.APP_PIN || "";
    if (!safeEqual(pin, expected)) {
      return NextResponse.json({ error: "PIN incorrecto." }, { status: 401 });
    }

    const response = NextResponse.json({ ok: true });
    response.cookies.set(AUTH_COOKIE, tokenForPin(pin), {
      httpOnly: true,
      sameSite: "lax",
      secure: new URL(request.url).protocol === "https:",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
    return response;
  } catch (error) {
    return apiError(error);
  }
}
