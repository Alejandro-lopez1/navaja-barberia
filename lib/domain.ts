import type { DescuentoTipo, EstadoTurno } from "./types";

export const TRANSICIONES: Record<EstadoTurno, readonly EstadoTurno[]> = {
  Pendiente: ["Confirmado", "En atención", "Completado", "Cancelado", "No asistió"],
  Confirmado: ["En atención", "Completado", "Cancelado", "No asistió"],
  "En atención": ["Completado", "Cancelado", "No asistió"],
  Completado: ["Confirmado"],
  Cancelado: [],
  "No asistió": [],
};

export function puedeTransicionar(desde: EstadoTurno, hacia: EstadoTurno): boolean {
  return TRANSICIONES[desde]?.includes(hacia) ?? false;
}

export function esEstadoActivo(estado: EstadoTurno): boolean {
  return estado === "Pendiente" || estado === "Confirmado" || estado === "En atención";
}

export function permiteDescuento(estado: EstadoTurno): boolean {
  return esEstadoActivo(estado);
}

export function round2(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function safeMoney(value: number): number {
  return Number.isFinite(value) && value > 0 ? value : 0;
}

export function calcularDescuento(
  precioLista: number,
  tipo: DescuentoTipo,
  valor: number,
): number {
  const precio = safeMoney(precioLista);
  const monto = safeMoney(valor);

  if (tipo === "porcentaje") {
    return round2(precio * (Math.min(monto, 100) / 100));
  }
  if (tipo === "monto_fijo") {
    return round2(Math.min(monto, precio));
  }
  return 0;
}

export function calcularPrecioFinal(
  precioLista: number,
  tipo: DescuentoTipo,
  valor: number,
): number {
  const precio = safeMoney(precioLista);
  return round2(Math.max(0, precio - calcularDescuento(precio, tipo, valor)));
}

export type ComisionConfig = {
  comisionPorcentaje: number;
  comisionFija: number;
};

export type ComisionCalculada = {
  monto: number;
  porcentajeAplicado: number;
};

export function calcularComision(
  precioFinal: number,
  config: ComisionConfig,
): ComisionCalculada {
  const porcentaje = Math.min(Math.max(safeMoney(config.comisionPorcentaje), 0), 100);
  const fija = safeMoney(config.comisionFija);
  const base = safeMoney(precioFinal);

  if (fija > 0) {
    return { monto: round2(Math.min(fija, base)), porcentajeAplicado: porcentaje };
  }

  return { monto: round2(base * (porcentaje / 100)), porcentajeAplicado: porcentaje };
}

export function horaAMinutos(hora: string): number {
  const match = /^(\d{1,2}):(\d{2})$/.exec(hora.trim());
  if (!match) return Number.NaN;
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (h < 0 || h > 23 || m < 0 || m > 59) return Number.NaN;
  return h * 60 + m;
}

export function haySolapamiento(
  inicioA: string,
  duracionA: number,
  inicioB: string,
  duracionB: number,
): boolean {
  const a = horaAMinutos(inicioA);
  const b = horaAMinutos(inicioB);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return false;

  const finA = a + Math.max(duracionA, 0);
  const finB = b + Math.max(duracionB, 0);

  return a < finB && b < finA;
}
