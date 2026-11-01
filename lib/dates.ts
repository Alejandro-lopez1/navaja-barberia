export const TIMEZONE =
  process.env.NEXT_PUBLIC_TIMEZONE ||
  process.env.APP_TIMEZONE ||
  "America/Argentina/Buenos_Aires";
export const CURRENCY =
  process.env.NEXT_PUBLIC_CURRENCY || process.env.CURRENCY || "ARS";

function isoFromParts(parts: Intl.DateTimeFormatPart[]): string {
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

export function todayISO(): string {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return isoFromParts(formatter.formatToParts(new Date()));
}

export function addDaysISO(fecha: string, days: number): string {
  const [y, m, d] = fecha.split("-").map(Number);
  const base = new Date(Date.UTC(y, (m || 1) - 1, d || 1, 12));
  base.setUTCDate(base.getUTCDate() + days);
  return base.toISOString().slice(0, 10);
}

export function parseDate(fecha: string): Date {
  return new Date(`${fecha}T12:00:00Z`);
}

export function weekdayLong(fecha: string): string {
  return new Intl.DateTimeFormat("es-AR", {
    weekday: "long",
    timeZone: "UTC",
  }).format(parseDate(fecha));
}

export function weekdayShort(fecha: string): string {
  return weekdayLong(fecha).replace(/^./, (c) => c.toUpperCase());
}

export function monthShort(fecha: string): string {
  const month = new Intl.DateTimeFormat("es-AR", {
    month: "short",
    timeZone: "UTC",
  })
    .format(parseDate(fecha))
    .replace(/\./g, "");
  return month.toUpperCase();
}

export function dayNumber(fecha: string): string {
  return fecha.slice(8, 10);
}

export function formatDateLong(fecha: string): string {
  const formatted = new Intl.DateTimeFormat("es-AR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  })
    .format(parseDate(fecha))
    .replace(/\./g, "");
  return formatted;
}

export function formatDateNumeric(fecha: string): string {
  const [y, m, d] = fecha.split("-");
  return `${d}/${m}/${y}`;
}

export function formatTimestamp(iso: string): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TIMEZONE,
  }).format(date);
}

export function formatMoney(value: number, currency = CURRENCY): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);
}

export function currentMonthRange(): { desde: string; hasta: string } {
  const hoy = todayISO();
  return { desde: `${hoy.slice(0, 7)}-01`, hasta: hoy };
}

export function isISODate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function isHora(value: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}
