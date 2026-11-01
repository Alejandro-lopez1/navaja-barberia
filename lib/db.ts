import { randomUUID } from "node:crypto";
import { getStore } from "./store";
import {
  ESTADOS,
  METODOS_PAGO,
  TABS,
  TIPOS_DESCUENTO,
  type Barbero,
  type DescuentoTipo,
  type EstadoTurno,
  type LogCambio,
  type MetodoPago,
  type Promo,
  type Servicio,
  type Turno,
} from "./types";

function now(): string {
  return new Date().toISOString();
}

function newId(): string {
  return randomUUID();
}

function num(value: string | undefined): number {
  const parsed = Number(String(value ?? "").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

function bool(value: string | undefined): boolean {
  return ["true", "1", "si", "sí", "yes"].includes(String(value ?? "").toLowerCase());
}

function boolText(value: boolean): string {
  return value ? "TRUE" : "FALSE";
}

function text(value: unknown): string {
  return value === undefined || value === null ? "" : String(value);
}

function estado(value: string | undefined): EstadoTurno {
  return ESTADOS.includes(value as EstadoTurno) ? (value as EstadoTurno) : "Pendiente";
}

function metodo(value: string | undefined): MetodoPago | "" {
  return METODOS_PAGO.includes(value as MetodoPago) ? (value as MetodoPago) : "";
}

function tipoDescuento(value: string | undefined): DescuentoTipo {
  return TIPOS_DESCUENTO.includes(value as DescuentoTipo)
    ? (value as DescuentoTipo)
    : "ninguno";
}

function dataRows(rows: string[][]): string[][] {
  return rows.slice(1).filter((row) => row[0] !== "");
}

/* ────────────────────────────── Barberos ────────────────────────────── */

function mapBarbero(row: string[]): Barbero {
  return {
    id: row[0] ?? "",
    nombre: row[1] ?? "",
    activo: bool(row[2]),
    comisionPorcentaje: num(row[3]),
    comisionFija: num(row[4]),
    telefono: row[5] ?? "",
    notas: row[6] ?? "",
  };
}

function barberoRow(b: Barbero): string[] {
  return [
    b.id,
    b.nombre,
    boolText(b.activo),
    String(b.comisionPorcentaje),
    String(b.comisionFija),
    b.telefono,
    b.notas,
  ];
}

export async function listBarberos(): Promise<Barbero[]> {
  const store = await getStore();
  const rows = await store.readTab(TABS.barberos);
  return dataRows(rows).map(mapBarbero);
}

export async function getBarbero(id: string): Promise<Barbero | null> {
  const barberos = await listBarberos();
  return barberos.find((b) => b.id === id) ?? null;
}

export async function createBarbero(
  input: Omit<Barbero, "id">,
): Promise<Barbero> {
  const store = await getStore();
  const barbero: Barbero = { ...input, id: newId() };
  await store.appendRow(TABS.barberos, barberoRow(barbero));
  return barbero;
}

export async function updateBarbero(
  id: string,
  patch: Partial<Omit<Barbero, "id">>,
): Promise<Barbero> {
  const store = await getStore();
  const current = await getBarbero(id);
  if (!current) throw new Error("Barbero no encontrado.");
  const updated: Barbero = { ...current, ...patch, id };
  await store.updateRow(TABS.barberos, id, barberoRow(updated));
  return updated;
}

/* ────────────────────────────── Servicios ───────────────────────────── */

function mapServicio(row: string[]): Servicio {
  return {
    id: row[0] ?? "",
    nombre: row[1] ?? "",
    precio: num(row[2]),
    duracionMin: num(row[3]),
    activo: bool(row[4]),
  };
}

function servicioRow(s: Servicio): string[] {
  return [s.id, s.nombre, String(s.precio), String(s.duracionMin), boolText(s.activo)];
}

export async function listServicios(): Promise<Servicio[]> {
  const store = await getStore();
  const rows = await store.readTab(TABS.servicios);
  return dataRows(rows).map(mapServicio);
}

export async function getServicio(id: string): Promise<Servicio | null> {
  const servicios = await listServicios();
  return servicios.find((s) => s.id === id) ?? null;
}

export async function createServicio(
  input: Omit<Servicio, "id">,
): Promise<Servicio> {
  const store = await getStore();
  const servicio: Servicio = { ...input, id: newId() };
  await store.appendRow(TABS.servicios, servicioRow(servicio));
  return servicio;
}

export async function updateServicio(
  id: string,
  patch: Partial<Omit<Servicio, "id">>,
): Promise<Servicio> {
  const store = await getStore();
  const current = await getServicio(id);
  if (!current) throw new Error("Servicio no encontrado.");
  const updated: Servicio = { ...current, ...patch, id };
  await store.updateRow(TABS.servicios, id, servicioRow(updated));
  return updated;
}

/* ─────────────────────────────── Promos ─────────────────────────────── */

function mapPromo(row: string[]): Promo {
  return {
    id: row[0] ?? "",
    fecha: row[1] ?? "",
    descripcion: row[2] ?? "",
    descuentoPorcentajeSugerido: num(row[3]),
    activo: bool(row[4]),
  };
}

function promoRow(p: Promo): string[] {
  return [
    p.id,
    p.fecha,
    p.descripcion,
    String(p.descuentoPorcentajeSugerido),
    boolText(p.activo),
  ];
}

export async function listPromos(): Promise<Promo[]> {
  const store = await getStore();
  const rows = await store.readTab(TABS.promos);
  return dataRows(rows).map(mapPromo);
}

export async function getPromo(id: string): Promise<Promo | null> {
  const promos = await listPromos();
  return promos.find((p) => p.id === id) ?? null;
}

export async function getPromoForDate(fecha: string): Promise<Promo | null> {
  const promos = await listPromos();
  return (
    promos.find((p) => p.activo && p.fecha === fecha) ??
    null
  );
}

export async function createPromo(input: Omit<Promo, "id">): Promise<Promo> {
  const store = await getStore();
  const promo: Promo = { ...input, id: newId() };
  await store.appendRow(TABS.promos, promoRow(promo));
  return promo;
}

export async function updatePromo(
  id: string,
  patch: Partial<Omit<Promo, "id">>,
): Promise<Promo> {
  const store = await getStore();
  const current = await getPromo(id);
  if (!current) throw new Error("Promoción no encontrada.");
  const updated: Promo = { ...current, ...patch, id };
  await store.updateRow(TABS.promos, id, promoRow(updated));
  return updated;
}

/* ─────────────────────────────── Turnos ─────────────────────────────── */

function mapTurno(row: string[]): Turno {
  return {
    id: row[0] ?? "",
    fecha: row[1] ?? "",
    horaInicio: row[2] ?? "",
    clienteNombre: row[3] ?? "",
    clienteTelefono: row[4] ?? "",
    barberoId: row[5] ?? "",
    barberoNombre: row[6] ?? "",
    servicioId: row[7] ?? "",
    servicioNombre: row[8] ?? "",
    precioLista: num(row[9]),
    descuentoTipo: tipoDescuento(row[10]),
    descuentoValor: num(row[11]),
    descuentoMotivo: row[12] ?? "",
    precioFinal: num(row[13]),
    metodoPago: metodo(row[14]),
    estado: estado(row[15]),
    comisionPorcentajeAplicado: num(row[16]),
    comisionMonto: num(row[17]),
    notas: row[18] ?? "",
    creadoEn: row[19] ?? "",
    actualizadoEn: row[20] ?? "",
  };
}

function turnoRow(t: Turno): string[] {
  return [
    t.id,
    t.fecha,
    t.horaInicio,
    t.clienteNombre,
    t.clienteTelefono,
    t.barberoId,
    t.barberoNombre,
    t.servicioId,
    t.servicioNombre,
    String(t.precioLista),
    t.descuentoTipo,
    String(t.descuentoValor),
    t.descuentoMotivo,
    String(t.precioFinal),
    t.metodoPago,
    t.estado,
    String(t.comisionPorcentajeAplicado),
    String(t.comisionMonto),
    t.notas,
    t.creadoEn,
    t.actualizadoEn,
  ];
}

export type TurnoFiltro = {
  fecha?: string;
  desde?: string;
  hasta?: string;
  barberoId?: string;
  estado?: EstadoTurno;
};

export async function listTurnos(filtro: TurnoFiltro = {}): Promise<Turno[]> {
  const store = await getStore();
  const rows = await store.readTab(TABS.turnos);
  const turnos = dataRows(rows).map(mapTurno).filter((t) => {
    if (filtro.fecha && t.fecha !== filtro.fecha) return false;
    if (filtro.desde && t.fecha < filtro.desde) return false;
    if (filtro.hasta && t.fecha > filtro.hasta) return false;
    if (filtro.barberoId && t.barberoId !== filtro.barberoId) return false;
    if (filtro.estado && t.estado !== filtro.estado) return false;
    return true;
  });

  return turnos.sort((a, b) =>
    `${a.fecha} ${a.horaInicio}`.localeCompare(`${b.fecha} ${b.horaInicio}`),
  );
}

export async function getTurno(id: string): Promise<Turno | null> {
  const store = await getStore();
  const rows = await store.readTab(TABS.turnos);
  const row = dataRows(rows).find((r) => r[0] === id);
  return row ? mapTurno(row) : null;
}

export async function insertTurno(
  input: Omit<Turno, "id" | "creadoEn" | "actualizadoEn">,
): Promise<Turno> {
  const store = await getStore();
  const timestamp = now();
  const turno: Turno = {
    ...input,
    id: newId(),
    creadoEn: timestamp,
    actualizadoEn: timestamp,
  };
  await store.appendRow(TABS.turnos, turnoRow(turno));
  return turno;
}

export async function saveTurno(turno: Turno): Promise<Turno> {
  const store = await getStore();
  const updated: Turno = { ...turno, actualizadoEn: now() };
  await store.updateRow(TABS.turnos, turno.id, turnoRow(updated));
  return updated;
}

/* ──────────────────────────────── Logs ──────────────────────────────── */

function mapLog(row: string[]): LogCambio {
  return {
    id: row[0] ?? "",
    idTurno: row[1] ?? "",
    accion: row[2] ?? "",
    estadoAnterior: row[3] ?? "",
    estadoNuevo: row[4] ?? "",
    usuario: row[5] ?? "",
    timestamp: row[6] ?? "",
  };
}

function logRow(l: LogCambio): string[] {
  return [l.id, l.idTurno, l.accion, l.estadoAnterior, l.estadoNuevo, l.usuario, l.timestamp];
}

export async function addLog(input: {
  idTurno: string;
  accion: string;
  estadoAnterior?: string;
  estadoNuevo?: string;
}): Promise<LogCambio> {
  const store = await getStore();
  const log: LogCambio = {
    id: newId(),
    idTurno: input.idTurno,
    accion: input.accion,
    estadoAnterior: text(input.estadoAnterior),
    estadoNuevo: text(input.estadoNuevo),
    usuario: process.env.ADMIN_NAME || "Admin",
    timestamp: now(),
  };
  await store.appendRow(TABS.logs, logRow(log));
  return log;
}

export async function listLogs(idTurno: string): Promise<LogCambio[]> {
  const store = await getStore();
  const rows = await store.readTab(TABS.logs);
  return dataRows(rows)
    .map(mapLog)
    .filter((l) => l.idTurno === idTurno)
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
}

export async function allTurnos(): Promise<Turno[]> {
  return listTurnos();
}
