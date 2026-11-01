"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/client";
import { isISODate, formatMoney } from "@/lib/dates";
import {
  calcularComision,
  calcularDescuento,
  calcularPrecioFinal,
} from "@/lib/domain";
import type {
  Barbero,
  DescuentoTipo,
  Promo,
  Servicio,
  Turno,
} from "@/lib/types";
import { METODOS_PAGO, TIPOS_DESCUENTO } from "@/lib/types";

type Props = {
  mode: "crear" | "editar";
  fechaInicial: string;
  barberos: Barbero[];
  servicios: Servicio[];
  turno?: Turno;
  promoInicial?: Promo | null;
};

export function TurnoForm({
  mode,
  fechaInicial,
  barberos,
  servicios,
  turno,
  promoInicial = null,
}: Props) {
  const router = useRouter();

  const barberosDisponibles = useMemo(
    () => barberos.filter((b) => b.activo || b.id === turno?.barberoId),
    [barberos, turno?.barberoId],
  );
  const serviciosDisponibles = useMemo(
    () => servicios.filter((s) => s.activo || s.id === turno?.servicioId),
    [servicios, turno?.servicioId],
  );

  const [fecha, setFecha] = useState(turno?.fecha ?? fechaInicial);
  const [horaInicio, setHoraInicio] = useState(turno?.horaInicio ?? "10:00");
  const [clienteNombre, setClienteNombre] = useState(turno?.clienteNombre ?? "");
  const [clienteTelefono, setClienteTelefono] = useState(
    turno?.clienteTelefono ?? "",
  );
  const [barberoId, setBarberoId] = useState(
    turno?.barberoId ?? barberosDisponibles[0]?.id ?? "",
  );
  const [servicioId, setServicioId] = useState(
    turno?.servicioId ?? serviciosDisponibles[0]?.id ?? "",
  );
  const [descuentoTipo, setDescuentoTipo] = useState<DescuentoTipo>(
    turno?.descuentoTipo ?? "ninguno",
  );
  const [descuentoValor, setDescuentoValor] = useState(
    turno && turno.descuentoValor > 0 ? String(turno.descuentoValor) : "",
  );
  const [descuentoMotivo, setDescuentoMotivo] = useState(
    turno?.descuentoMotivo ?? "",
  );
  const [metodoPago, setMetodoPago] = useState<string>(turno?.metodoPago ?? "");
  const [notas, setNotas] = useState(turno?.notas ?? "");
  const [promo, setPromo] = useState<Promo | null>(promoInicial);
  const [descuentoTocado, setDescuentoTocado] = useState(
    Boolean(turno && turno.descuentoValor > 0),
  );
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const barbero = barberosDisponibles.find((b) => b.id === barberoId);
  const servicio = serviciosDisponibles.find((s) => s.id === servicioId);
  const precioLista = servicio?.precio ?? 0;
  const valorNumerico = Number(descuentoValor) || 0;
  const descuentoMonto = calcularDescuento(precioLista, descuentoTipo, valorNumerico);
  const precioFinal = calcularPrecioFinal(precioLista, descuentoTipo, valorNumerico);
  const comisionEstimada = barbero
    ? calcularComision(precioFinal, {
        comisionPorcentaje: barbero.comisionPorcentaje,
        comisionFija: barbero.comisionFija,
      })
    : { monto: 0, porcentajeAplicado: 0 };

  useEffect(() => {
    if (!isISODate(fecha)) return;

    let vigente = true;
    const timer = setTimeout(async () => {
      try {
        const data = await apiRequest<{ promo: Promo | null }>(
          `/api/promos/sugerida?fecha=${fecha}`,
        );
        if (!vigente) return;
        setPromo(data.promo);

        if (data.promo && !descuentoTocado && !turno) {
          setDescuentoTipo("porcentaje");
          setDescuentoValor(String(data.promo.descuentoPorcentajeSugerido));
          setDescuentoMotivo(`Promo: ${data.promo.descripcion}`);
        }
      } catch {
        if (vigente) setPromo(null);
      }
    }, 200);

    return () => {
      vigente = false;
      clearTimeout(timer);
    };
  }, [fecha, descuentoTocado, turno]);

  function aplicarPromo() {
    if (!promo) return;
    setDescuentoTocado(true);
    setDescuentoTipo("porcentaje");
    setDescuentoValor(String(promo.descuentoPorcentajeSugerido));
    setDescuentoMotivo(`Promo: ${promo.descripcion}`);
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");

    if (!clienteNombre.trim()) {
      setError("El nombre del cliente es obligatorio.");
      return;
    }
    if (!barberoId || !servicioId) {
      setError("Elegí un barbero y un servicio.");
      return;
    }
    if (descuentoMonto > 0 && !descuentoMotivo.trim()) {
      setError("Indicá el motivo del descuento.");
      return;
    }

    const payload = {
      fecha,
      horaInicio,
      clienteNombre: clienteNombre.trim(),
      clienteTelefono: clienteTelefono.trim(),
      barberoId,
      servicioId,
      descuentoTipo,
      descuentoValor: valorNumerico,
      descuentoMotivo: descuentoMotivo.trim(),
      metodoPago,
      notas: notas.trim(),
    };

    setLoading(true);
    try {
      const data =
        mode === "editar" && turno
          ? await apiRequest<{ turno: Turno }>(`/api/turnos/${turno.id}`, {
              method: "PATCH",
              body: JSON.stringify({ accion: "editar", ...payload }),
            })
          : await apiRequest<{ turno: Turno }>("/api/turnos", {
              method: "POST",
              body: JSON.stringify(payload),
            });

      router.push(`/turnos/${data.turno.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar el turno.");
      setLoading(false);
    }
  }

  const cancelHref =
    mode === "editar" && turno ? `/turnos/${turno.id}` : `/?fecha=${fecha}`;

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <section className="card p-4">
        <h2 className="label">Cliente</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="clienteNombre" className="label">
              Nombre *
            </label>
            <input
              id="clienteNombre"
              className="input"
              value={clienteNombre}
              onChange={(event) => setClienteNombre(event.target.value)}
              placeholder="Nombre del cliente"
              required
            />
          </div>
          <div>
            <label htmlFor="clienteTelefono" className="label">
              Teléfono
            </label>
            <input
              id="clienteTelefono"
              className="input"
              value={clienteTelefono}
              onChange={(event) => setClienteTelefono(event.target.value)}
              placeholder="Opcional"
              inputMode="tel"
            />
          </div>
          <div>
            <label htmlFor="fecha" className="label">
              Fecha *
            </label>
            <input
              id="fecha"
              type="date"
              className="input"
              value={fecha}
              onChange={(event) => setFecha(event.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="horaInicio" className="label">
              Hora de inicio *
            </label>
            <input
              id="horaInicio"
              type="time"
              className="input"
              value={horaInicio}
              onChange={(event) => setHoraInicio(event.target.value)}
              required
            />
          </div>
        </div>
      </section>

      <section className="card p-4">
        <h2 className="label">Servicio y barbero</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="barberoId" className="label">
              Barbero *
            </label>
            <select
              id="barberoId"
              className="input"
              value={barberoId}
              onChange={(event) => setBarberoId(event.target.value)}
              required
            >
              <option value="">Elegir barbero</option>
              {barberosDisponibles.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.nombre}
                  {item.activo ? "" : " (inactivo)"}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="servicioId" className="label">
              Servicio *
            </label>
            <select
              id="servicioId"
              className="input"
              value={servicioId}
              onChange={(event) => setServicioId(event.target.value)}
              required
            >
              <option value="">Elegir servicio</option>
              {serviciosDisponibles.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.nombre} · {formatMoney(item.precio)}
                  {item.activo ? "" : " (inactivo)"}
                </option>
              ))}
            </select>
          </div>
          {servicio ? (
            <p className="field-hint sm:col-span-2">
              Precio de lista {formatMoney(servicio.precio)} · Duración{" "}
              {servicio.duracionMin} min
            </p>
          ) : null}
        </div>
      </section>

      <section className="card p-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="label mb-0">Descuento</h2>
          <span className="text-[10px] uppercase tracking-[0.18em] text-slate-600">
            Opcional
          </span>
        </div>

        {promo ? (
          <div className="mt-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-300">
              Promo del día
            </p>
            <p className="mt-1 text-sm text-bone">{promo.descripcion}</p>
            <div className="mt-2 flex items-center justify-between gap-3">
              <span className="text-xs text-amber-200/80">
                Sugerido: {promo.descuentoPorcentajeSugerido}%
              </span>
              <button type="button" onClick={aplicarPromo} className="btn-secondary btn-sm">
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
            <label htmlFor="descuentoTipo" className="label">
              Tipo
            </label>
            <select
              id="descuentoTipo"
              className="input"
              value={descuentoTipo}
              onChange={(event) => {
                setDescuentoTocado(true);
                setDescuentoTipo(event.target.value as DescuentoTipo);
              }}
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
            <label htmlFor="descuentoValor" className="label">
              Valor
            </label>
            <input
              id="descuentoValor"
              type="number"
              min="0"
              step="0.01"
              max={descuentoTipo === "porcentaje" ? 100 : undefined}
              className="input"
              value={descuentoValor}
              onChange={(event) => {
                setDescuentoTocado(true);
                setDescuentoValor(event.target.value);
              }}
              disabled={descuentoTipo === "ninguno"}
              placeholder={descuentoTipo === "porcentaje" ? "Ej. 15" : "Ej. 1500"}
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="descuentoMotivo" className="label">
              Motivo
            </label>
            <input
              id="descuentoMotivo"
              className="input"
              value={descuentoMotivo}
              onChange={(event) => {
                setDescuentoTocado(true);
                setDescuentoMotivo(event.target.value);
              }}
              disabled={descuentoTipo === "ninguno"}
              placeholder="Ej. Promo del día, cliente frecuente…"
            />
          </div>
        </div>
      </section>

      <section className="card p-4">
        <h2 className="label">Pago y notas</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="metodoPago" className="label">
              Método de pago
            </label>
            <select
              id="metodoPago"
              className="input"
              value={metodoPago}
              onChange={(event) => setMetodoPago(event.target.value)}
            >
              <option value="">Se define al completar</option>
              {METODOS_PAGO.map((metodo) => (
                <option key={metodo} value={metodo}>
                  {metodo}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="notas" className="label">
              Notas
            </label>
            <textarea
              id="notas"
              className="input min-h-[5rem] resize-y"
              value={notas}
              onChange={(event) => setNotas(event.target.value)}
              placeholder="Preferencias, observaciones…"
            />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-line bg-gradient-to-br from-surface to-ink p-4">
        <div className="space-y-1.5 text-sm">
          <div className="flex items-center justify-between gap-3 text-muted">
            <span>Precio de lista</span>
            <span>{formatMoney(precioLista)}</span>
          </div>
          <div className="flex items-center justify-between gap-3 text-red-300">
            <span>Descuento</span>
            <span>- {formatMoney(descuentoMonto)}</span>
          </div>
          <div className="flex items-end justify-between gap-3 border-t border-line pt-2">
            <span className="font-semibold text-bone">Total a cobrar</span>
            <span className="font-display text-3xl font-bold leading-none text-bone">
              {formatMoney(precioFinal)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3 pt-1 text-[11px] text-muted">
            <span>Comisión estimada al completar</span>
            <span className="font-semibold text-amber-300">
              {formatMoney(comisionEstimada.monto)}
            </span>
          </div>
        </div>
      </section>

      {error ? (
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      ) : null}

      <div className="flex gap-2">
        <Link href={cancelHref} className="btn-secondary flex-1">
          Cancelar
        </Link>
        <button type="submit" className="btn-primary flex-[1.4]" disabled={loading}>
          {loading
            ? "Guardando…"
            : mode === "editar"
              ? "Guardar cambios"
              : "Crear turno"}
        </button>
      </div>
    </form>
  );
}
