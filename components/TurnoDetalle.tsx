"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiRequest } from "@/lib/client";
import { formatDateLong, formatMoney, formatTimestamp } from "@/lib/dates";
import { TRANSICIONES, permiteDescuento } from "@/lib/domain";
import type {
  DescuentoTipo,
  EstadoTurno,
  LogCambio,
  Promo,
  Turno,
} from "@/lib/types";
import { METODOS_PAGO, TIPOS_DESCUENTO } from "@/lib/types";
import { ArrowLeft, ClockIcon, UserIcon } from "./Icons";
import { StatusBadge } from "./StatusBadge";

type Props = {
  turno: Turno;
  logs: LogCambio[];
  promo: Promo | null;
};

const ETIQUETAS: Record<EstadoTurno, string> = {
  Pendiente: "Volver a pendiente",
  Confirmado: "Confirmar",
  "En atención": "En atención",
  Completado: "Completar",
  Cancelado: "Cancelar",
  "No asistió": "No asistió",
};

export function TurnoDetalle({ turno, logs, promo }: Props) {
  const router = useRouter();
  const [metodoPago, setMetodoPago] = useState(turno.metodoPago);
  const [descuentoTipo, setDescuentoTipo] = useState<DescuentoTipo>(
    turno.descuentoTipo,
  );
  const [descuentoValor, setDescuentoValor] = useState(
    turno.descuentoValor > 0 ? String(turno.descuentoValor) : "",
  );
  const [descuentoMotivo, setDescuentoMotivo] = useState(turno.descuentoMotivo);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState("");

  const puedeEditar = turno.estado === "Pendiente" || turno.estado === "Confirmado" || turno.estado === "En atención";
  const puedeDescontar = permiteDescuento(turno.estado);
  const acciones = TRANSICIONES[turno.estado];
  const descuentoActual = Math.max(0, turno.precioLista - turno.precioFinal);

  async function accionEstado(estado: EstadoTurno) {
    setError("");
    if (estado === "Completado" && !metodoPago) {
      setError("Elegí el método de pago antes de completar el turno.");
      return;
    }

    if (
      (estado === "Cancelado" || estado === "No asistió") &&
      !window.confirm(`¿Marcar el turno como "${estado}"?`)
    ) {
      return;
    }

    if (
      turno.estado === "Completado" &&
      !window.confirm("¿Revertir el turno a Confirmado? La comisión se recalcula a 0.")
    ) {
      return;
    }

    setLoading(`estado-${estado}`);
    try {
      await apiRequest(`/api/turnos/${turno.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          accion: "estado",
          estado,
          metodoPago,
        }),
      });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cambiar el estado.");
    } finally {
      setLoading("");
    }
  }

  async function guardarDescuento(
    tipo: DescuentoTipo,
    valor: number,
    motivo: string,
  ) {
    setError("");
    setLoading("descuento");
    try {
      await apiRequest(`/api/turnos/${turno.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          accion: "descuento",
          descuentoTipo: tipo,
          descuentoValor: valor,
          descuentoMotivo: motivo,
        }),
      });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo aplicar el descuento.");
    } finally {
      setLoading("");
    }
  }

  function aplicarPromo() {
    if (!promo) return;
    setDescuentoTipo("porcentaje");
    setDescuentoValor(String(promo.descuentoPorcentajeSugerido));
    setDescuentoMotivo(`Promo: ${promo.descripcion}`);
    void guardarDescuento(
      "porcentaje",
      promo.descuentoPorcentajeSugerido,
      `Promo: ${promo.descripcion}`,
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link
          href={`/?fecha=${turno.fecha}`}
          aria-label="Volver a la agenda"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-line bg-surface text-bone transition hover:border-slate-500"
        >
          <ArrowLeft />
        </Link>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-muted">
            {formatDateLong(turno.fecha)} · {turno.horaInicio}
          </p>
          <div className="mt-1 flex items-center gap-2">
            <h1 className="truncate font-display text-4xl font-extrabold uppercase leading-none tracking-wide">
              {turno.clienteNombre}
            </h1>
            <StatusBadge estado={turno.estado} />
          </div>
        </div>
      </div>

      <section className="card p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <InfoRow
            icon={<ClockIcon />}
            label="Horario"
            value={`${turno.horaInicio} hs · ${formatDateLong(turno.fecha)}`}
          />
          <InfoRow
            icon={<UserIcon />}
            label="Barbero"
            value={turno.barberoNombre}
          />
          <InfoRow label="Servicio" value={turno.servicioNombre} />
          <InfoRow
            label="Teléfono"
            value={
              turno.clienteTelefono ? (
                <a href={`tel:${turno.clienteTelefono}`} className="hover:text-brand">
                  {turno.clienteTelefono}
                </a>
              ) : (
                "—"
              )
            }
          />
        </div>
        {turno.notas ? (
          <p className="mt-3 rounded-xl border border-line bg-ink/40 px-3 py-2 text-sm leading-relaxed text-muted">
            {turno.notas}
          </p>
        ) : null}
        {puedeEditar ? (
          <Link href={`/turnos/${turno.id}/editar`} className="btn-secondary mt-4 w-full">
            Editar turno
          </Link>
        ) : null}
      </section>

      <section className="card p-4">
        <h2 className="label">Resumen de caja</h2>
        <div className="space-y-1.5 text-sm">
          <div className="flex items-center justify-between gap-3 text-muted">
            <span>Precio de lista</span>
            <span>{formatMoney(turno.precioLista)}</span>
          </div>
          <div className="flex items-center justify-between gap-3 text-red-300">
            <span>
              Descuento
              {turno.descuentoTipo !== "ninguno" ? (
                <span className="ml-1 text-red-300/70">
                  ({turno.descuentoTipo === "porcentaje"
                    ? `${turno.descuentoValor}%`
                    : "monto fijo"})
                </span>
              ) : null}
            </span>
            <span>- {formatMoney(descuentoActual)}</span>
          </div>
          {turno.descuentoMotivo ? (
            <p className="text-[11px] text-muted">{turno.descuentoMotivo}</p>
          ) : null}
          <div className="flex items-end justify-between gap-3 border-t border-line pt-2">
            <span className="font-semibold">Total</span>
            <span className="font-display text-3xl font-bold leading-none">
              {formatMoney(turno.precioFinal)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3 pt-1 text-[11px] text-muted">
            <span>Método de pago</span>
            <span className="font-semibold text-bone">
              {turno.metodoPago || "Sin definir"}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3 text-[11px] text-muted">
            <span>Comisión del barbero</span>
            <span
              className={`font-semibold ${
                turno.estado === "Completado" ? "text-amber-300" : "text-muted"
              }`}
            >
              {turno.estado === "Completado"
                ? `${formatMoney(turno.comisionMonto)} (${turno.comisionPorcentajeAplicado}%)`
                : "Se calcula al completar"}
            </span>
          </div>
        </div>
      </section>

      <section className="card p-4">
        <h2 className="label">Estado del turno</h2>

        {turno.estado !== "Completado" && turno.estado !== "Cancelado" && turno.estado !== "No asistió" ? (
          <div className="mb-3">
            <label htmlFor="metodoPagoDetalle" className="label">
              Método de pago
            </label>
            <select
              id="metodoPagoDetalle"
              className="input"
              value={metodoPago}
              onChange={(event) => setMetodoPago(event.target.value as typeof metodoPago)}
            >
              <option value="">Elegir método</option>
              {METODOS_PAGO.map((metodo) => (
                <option key={metodo} value={metodo}>
                  {metodo}
                </option>
              ))}
            </select>
            <p className="field-hint">Obligatorio para completar el turno.</p>
          </div>
        ) : null}

        {acciones.length > 0 ? (
          <div className="grid gap-2 sm:grid-cols-2">
            {acciones.includes("Completado") ? (
              <button
                type="button"
                onClick={() => accionEstado("Completado")}
                className="btn-primary sm:col-span-2"
                disabled={Boolean(loading)}
              >
                {loading === "estado-Completado"
                  ? "Completando…"
                  : turno.estado === "Completado"
                    ? "Revertir a confirmado"
                    : "Completar turno"}
              </button>
            ) : null}

            {acciones
              .filter((estado) => estado !== "Completado")
              .map((estado) => (
                <button
                  key={estado}
                  type="button"
                  onClick={() => accionEstado(estado)}
                  className={
                    estado === "Cancelado" || estado === "No asistió"
                      ? "btn-danger"
                      : "btn-secondary"
                  }
                  disabled={Boolean(loading)}
                >
                  {loading === `estado-${estado}`
                    ? "Guardando…"
                    : turno.estado === "Completado"
                      ? "Revertir a confirmado"
                      : ETIQUETAS[estado]}
                </button>
              ))}
          </div>
        ) : (
          <p className="rounded-xl border border-line bg-ink/40 px-3 py-2 text-sm text-muted">
            Este turno está cerrado y no admite más cambios de estado.
          </p>
        )}
      </section>

      <section className="card p-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="label mb-0">Descuento</h2>
          {descuentoActual > 0 ? (
            <span className="text-[11px] font-semibold text-red-300">
              -{formatMoney(descuentoActual)}
            </span>
          ) : null}
        </div>

        {puedeDescontar ? (
          <>
            {promo ? (
              <div className="mt-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-300">
                  Promo del día
                </p>
                <p className="mt-1 text-sm">{promo.descripcion}</p>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <span className="text-xs text-amber-200/80">
                    Sugerido: {promo.descuentoPorcentajeSugerido}%
                  </span>
                  <button
                    type="button"
                    onClick={aplicarPromo}
                    className="btn-secondary btn-sm"
                    disabled={Boolean(loading)}
                  >
                    Aplicar descuento promo
                  </button>
                </div>
              </div>
            ) : (
              <p className="mt-3 rounded-xl border border-line bg-ink/40 px-3 py-2 text-xs leading-relaxed text-muted">
                No hay promo activa para esta fecha. Podés aplicar un descuento manual.
              </p>
            )}

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="descuentoTipoDetalle" className="label">
                  Tipo
                </label>
                <select
                  id="descuentoTipoDetalle"
                  className="input"
                  value={descuentoTipo}
                  onChange={(event) =>
                    setDescuentoTipo(event.target.value as DescuentoTipo)
                  }
                >
                  {TIPOS_DESCUENTO.map((tipo) => (
                    <option key={tipo} value={tipo}>
                      {tipo === "ninguno"
                        ? "Sin descuento"
                        : tipo === "porcentaje"
                          ? "Porcentaje"
                          : "Monto fijo"}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="descuentoValorDetalle" className="label">
                  Valor
                </label>
                <input
                  id="descuentoValorDetalle"
                  type="number"
                  min="0"
                  step="0.01"
                  max={descuentoTipo === "porcentaje" ? 100 : undefined}
                  className="input"
                  value={descuentoValor}
                  onChange={(event) => setDescuentoValor(event.target.value)}
                  disabled={descuentoTipo === "ninguno"}
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="descuentoMotivoDetalle" className="label">
                  Motivo
                </label>
                <input
                  id="descuentoMotivoDetalle"
                  className="input"
                  value={descuentoMotivo}
                  onChange={(event) => setDescuentoMotivo(event.target.value)}
                  disabled={descuentoTipo === "ninguno"}
                  placeholder="Motivo del descuento"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={() =>
                guardarDescuento(
                  descuentoTipo,
                  Number(descuentoValor) || 0,
                  descuentoMotivo,
                )
              }
              className="btn-secondary mt-3 w-full"
              disabled={Boolean(loading)}
            >
              {loading === "descuento" ? "Guardando…" : "Guardar descuento"}
            </button>
          </>
        ) : (
          <p className="mt-3 rounded-xl border border-line bg-ink/40 px-3 py-2 text-sm text-muted">
            El descuento quedó bloqueado al cerrar el turno.
          </p>
        )}
      </section>

      {error ? (
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      ) : null}

      <section className="card p-4">
        <h2 className="label">Historial</h2>
        {logs.length === 0 ? (
          <p className="text-sm text-muted">Sin movimientos registrados.</p>
        ) : (
          <ol className="space-y-3">
            {logs.map((log) => (
              <li key={log.id} className="flex gap-3">
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-bone">{log.accion}</p>
                  <p className="text-[11px] text-muted">
                    {formatTimestamp(log.timestamp)} · {log.usuario}
                    {log.estadoAnterior || log.estadoNuevo
                      ? ` · ${log.estadoAnterior || "—"} → ${log.estadoNuevo || "—"}`
                      : ""}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}

function InfoRow({
  label,
  value,
  icon,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
        {label}
      </p>
      <p className="mt-1 flex items-center gap-1.5 text-sm text-bone">
        {icon ? <span className="text-muted">{icon}</span> : null}
        {value}
      </p>
    </div>
  );
}
