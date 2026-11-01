"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { formatMoney } from "@/lib/dates";
import { buildResumen } from "@/lib/reports";
import type { Barbero, EstadoTurno, Turno } from "@/lib/types";
import { ESTADOS } from "@/lib/types";
import { PlusIcon, ScissorsIcon } from "./Icons";
import { StatusBadge } from "./StatusBadge";

type Props = {
  fecha: string;
  turnos: Turno[];
  barberos: Barbero[];
};

type Tab = "agenda" | "caja";

export function AgendaClient({ fecha, turnos, barberos }: Props) {
  const [tab, setTab] = useState<Tab>("agenda");
  const [barberoId, setBarberoId] = useState("");
  const [estado, setEstado] = useState("");

  const filtrados = useMemo(
    () =>
      turnos.filter((turno) => {
        if (barberoId && turno.barberoId !== barberoId) return false;
        if (estado && turno.estado !== (estado as EstadoTurno)) return false;
        return true;
      }),
    [turnos, barberoId, estado],
  );

  const resumen = useMemo(() => buildResumen(turnos), [turnos]);
  const nuevoHref = `/turnos/nuevo?fecha=${fecha}`;

  return (
    <div className="mt-5">
      <div
        role="tablist"
        aria-label="Vista de agenda"
        className="grid grid-cols-2 gap-1 rounded-2xl border border-line bg-surface p-1"
      >
        <button
          type="button"
          role="tab"
          aria-selected={tab === "agenda"}
          onClick={() => setTab("agenda")}
          className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
            tab === "agenda"
              ? "bg-tab-active text-ink shadow-sm"
              : "text-muted hover:text-bone"
          }`}
        >
          Agenda
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "caja"}
          onClick={() => setTab("caja")}
          className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
            tab === "caja"
              ? "bg-tab-active text-ink shadow-sm"
              : "text-muted hover:text-bone"
          }`}
        >
          Caja
        </button>
      </div>

      {tab === "agenda" ? (
        <section className="mt-5 animate-fade-up">
          {turnos.length === 0 ? (
            <>
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-muted">Sin turnos para este día</p>
                <Link href={nuevoHref} className="btn-primary btn-sm">
                  <PlusIcon />
                  Nuevo turno
                </Link>
              </div>

              <div className="mt-4 rounded-2xl border border-dashed border-line bg-ink/30 px-6 py-16 text-center">
                <ScissorsIcon className="mx-auto mb-4 h-8 w-8 text-slate-600" />
                <h2 className="font-display text-6xl font-extrabold leading-none tracking-wide text-bone">
                  DÍA LIBRE
                </h2>
                <p className="mx-auto mt-4 max-w-xs text-sm leading-relaxed text-muted">
                  Tocá «Nuevo turno» para cargar el primero.
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="section-title">Turnos del día</h2>
                  <p className="mt-0.5 text-xs text-muted">
                    {turnos.length} {turnos.length === 1 ? "turno" : "turnos"} en agenda
                  </p>
                </div>
                <Link href={nuevoHref} className="btn-primary btn-sm">
                  <PlusIcon />
                  Nuevo turno
                </Link>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <div>
                  <label htmlFor="filtro-barbero" className="label">
                    Barbero
                  </label>
                  <select
                    id="filtro-barbero"
                    className="input py-2"
                    value={barberoId}
                    onChange={(event) => setBarberoId(event.target.value)}
                  >
                    <option value="">Todos</option>
                    {barberos.map((barbero) => (
                      <option key={barbero.id} value={barbero.id}>
                        {barbero.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="filtro-estado" className="label">
                    Estado
                  </label>
                  <select
                    id="filtro-estado"
                    className="input py-2"
                    value={estado}
                    onChange={(event) => setEstado(event.target.value)}
                  >
                    <option value="">Todos</option>
                    {ESTADOS.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-4 space-y-2.5">
                {filtrados.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-line px-5 py-10 text-center text-sm text-muted">
                    No hay turnos con esos filtros.
                  </div>
                ) : (
                  filtrados.map((turno) => (
                    <Link
                      key={turno.id}
                      href={`/turnos/${turno.id}`}
                      className="card block p-4 transition hover:border-slate-500"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-start gap-3">
                          <div className="min-w-[52px]">
                            <p className="font-display text-2xl font-bold leading-none">
                              {turno.horaInicio}
                            </p>
                            <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-muted">
                              hs
                            </p>
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-bone">
                              {turno.clienteNombre}
                            </p>
                            <p className="mt-0.5 truncate text-xs text-muted">
                              {turno.servicioNombre} · {turno.barberoNombre}
                            </p>
                          </div>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="font-display text-xl font-bold leading-none">
                            {formatMoney(turno.precioFinal)}
                          </p>
                          <StatusBadge estado={turno.estado} className="mt-2" />
                        </div>
                      </div>

                      {turno.estado === "Completado" ? (
                        <div className="mt-3 flex items-center justify-between border-t border-line/60 pt-2.5 text-[11px] text-muted">
                          <span>{turno.metodoPago || "Sin método"}</span>
                          <span>
                            Comisión{" "}
                            <span className="font-semibold text-emerald-300">
                              {formatMoney(turno.comisionMonto)}
                            </span>
                          </span>
                        </div>
                      ) : null}
                    </Link>
                  ))
                )}
              </div>
            </>
          )}
        </section>
      ) : (
        <Caja resumen={resumen} />
      )}
    </div>
  );
}

function Caja({ resumen }: { resumen: ReturnType<typeof buildResumen> }) {
  return (
    <section className="mt-5 animate-fade-up space-y-4">
      <div>
        <h2 className="section-title">Caja del día</h2>
        <p className="mt-0.5 text-xs text-muted">Solo turnos completados</p>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <Metric label="Ingresos" value={formatMoney(resumen.ingresos)} accent="text-emerald-300" />
        <Metric label="Comisiones" value={formatMoney(resumen.comisiones)} accent="text-amber-300" />
        <Metric label="Descuentos" value={formatMoney(resumen.descuentos)} accent="text-red-300" />
        <Metric
          label="Completados"
          value={String(resumen.turnosCompletados)}
          hint={`Ticket ${formatMoney(resumen.ticketPromedio)}`}
        />
      </div>

      {resumen.turnosCompletados === 0 ? (
        <div className="rounded-2xl border border-dashed border-line px-5 py-10 text-center text-sm text-muted">
          Todavía no hay turnos completados hoy.
        </div>
      ) : (
        <>
          <div className="card p-4">
            <h3 className="label mb-3">Métodos de pago</h3>
            <div className="space-y-2.5">
              {resumen.porMetodo.map((metodo) => (
                <div
                  key={metodo.metodo || "sin-metodo"}
                  className="flex items-center justify-between gap-3 text-sm"
                >
                  <span className="text-muted">
                    {metodo.metodo || "Sin método"}{" "}
                    <span className="text-slate-600">({metodo.turnos})</span>
                  </span>
                  <span className="font-semibold">{formatMoney(metodo.total)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-4">
            <h3 className="label mb-3">Comisiones por barbero</h3>
            <div className="space-y-3">
              {resumen.porBarbero.map((barbero) => (
                <div key={barbero.barberoId}>
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="font-medium">{barbero.nombre}</span>
                    <span className="font-semibold text-amber-300">
                      {formatMoney(barbero.comisiones)}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[11px] text-muted">
                    <span>{barbero.turnos} turnos</span>
                    <span>{formatMoney(barbero.ingresos)} generados</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </section>
  );
}

function Metric({
  label,
  value,
  hint,
  accent = "text-bone",
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: string;
}) {
  return (
    <div className="card p-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
        {label}
      </p>
      <p className={`mt-2 font-display text-3xl font-bold leading-none ${accent}`}>
        {value}
      </p>
      {hint ? <p className="mt-1.5 text-[11px] text-muted">{hint}</p> : null}
    </div>
  );
}
