"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiRequest } from "@/lib/client";
import { formatDateNumeric, formatMoney, todayISO } from "@/lib/dates";
import type { Barbero, Promo, Servicio } from "@/lib/types";

type Tab = "barberos" | "servicios" | "promos";

type Props = {
  barberos: Barbero[];
  servicios: Servicio[];
  promos: Promo[];
};

export function ConfiguracionClient({ barberos, servicios, promos }: Props) {
  const [tab, setTab] = useState<Tab>("barberos");

  return (
    <div className="mt-5">
      <div
        role="tablist"
        aria-label="Configuración"
        className="grid grid-cols-3 gap-1 rounded-2xl border border-line bg-surface p-1"
      >
        {(
          [
            ["barberos", "Barberos"],
            ["servicios", "Servicios"],
            ["promos", "Promos"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={tab === value}
            onClick={() => setTab(value)}
            className={`rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
              tab === value
                ? "bg-tab-active text-ink shadow-sm"
                : "text-muted hover:text-bone"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-4">
        {tab === "barberos" ? <BarberosSection barberos={barberos} /> : null}
        {tab === "servicios" ? <ServiciosSection servicios={servicios} /> : null}
        {tab === "promos" ? <PromosSection promos={promos} /> : null}
      </div>
    </div>
  );
}

/* ─────────────────────────────── Barberos ─────────────────────────────── */

type BarberoForm = {
  nombre: string;
  comisionPorcentaje: string;
  comisionFija: string;
  telefono: string;
  notas: string;
  activo: boolean;
};

const emptyBarbero: BarberoForm = {
  nombre: "",
  comisionPorcentaje: "40",
  comisionFija: "",
  telefono: "",
  notas: "",
  activo: true,
};

function BarberosSection({ barberos }: { barberos: Barbero[] }) {
  const router = useRouter();
  const [form, setForm] = useState<BarberoForm | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function abrirNuevo() {
    setEditingId(null);
    setError("");
    setForm({ ...emptyBarbero });
  }

  function abrirEdicion(barbero: Barbero) {
    setEditingId(barbero.id);
    setError("");
    setForm({
      nombre: barbero.nombre,
      comisionPorcentaje: String(barbero.comisionPorcentaje),
      comisionFija: barbero.comisionFija > 0 ? String(barbero.comisionFija) : "",
      telefono: barbero.telefono,
      notas: barbero.notas,
      activo: barbero.activo,
    });
  }

  function cerrar() {
    setForm(null);
    setEditingId(null);
    setError("");
  }

  async function guardar(event: React.FormEvent) {
    event.preventDefault();
    if (!form) return;
    setError("");
    setLoading(true);

    const payload = {
      nombre: form.nombre.trim(),
      comisionPorcentaje: Number(form.comisionPorcentaje) || 0,
      comisionFija: Number(form.comisionFija) || 0,
      telefono: form.telefono.trim(),
      notas: form.notas.trim(),
      activo: form.activo,
    };

    try {
      if (editingId) {
        await apiRequest(`/api/barberos/${editingId}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      } else {
        await apiRequest("/api/barberos", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
      cerrar();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar.");
    } finally {
      setLoading(false);
    }
  }

  async function alternarActivo(barbero: Barbero) {
    setError("");
    try {
      await apiRequest(`/api/barberos/${barbero.id}`, {
        method: "PATCH",
        body: JSON.stringify({ activo: !barbero.activo }),
      });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo actualizar.");
    }
  }

  return (
    <div className="space-y-3">
      {!form ? (
        <button type="button" onClick={abrirNuevo} className="btn-primary w-full">
          + Agregar barbero
        </button>
      ) : (
        <form onSubmit={guardar} className="card animate-fade-up space-y-3 p-4">
          <h3 className="section-title text-xl">
            {editingId ? "Editar barbero" : "Nuevo barbero"}
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="label" htmlFor="barbero-nombre">
                Nombre *
              </label>
              <input
                id="barbero-nombre"
                className="input"
                value={form.nombre}
                onChange={(event) => setForm({ ...form, nombre: event.target.value })}
                required
              />
            </div>
            <div>
              <label className="label" htmlFor="barbero-pct">
                Comisión %
              </label>
              <input
                id="barbero-pct"
                type="number"
                min="0"
                max="100"
                step="0.01"
                className="input"
                value={form.comisionPorcentaje}
                onChange={(event) =>
                  setForm({ ...form, comisionPorcentaje: event.target.value })
                }
              />
            </div>
            <div>
              <label className="label" htmlFor="barbero-fija">
                Comisión fija (opcional)
              </label>
              <input
                id="barbero-fija"
                type="number"
                min="0"
                step="0.01"
                className="input"
                value={form.comisionFija}
                onChange={(event) =>
                  setForm({ ...form, comisionFija: event.target.value })
                }
                placeholder="Tiene prioridad si es > 0"
              />
            </div>
            <div>
              <label className="label" htmlFor="barbero-tel">
                Teléfono
              </label>
              <input
                id="barbero-tel"
                className="input"
                value={form.telefono}
                onChange={(event) => setForm({ ...form, telefono: event.target.value })}
              />
            </div>
            <div>
              <label className="label" htmlFor="barbero-notas">
                Notas
              </label>
              <input
                id="barbero-notas"
                className="input"
                value={form.notas}
                onChange={(event) => setForm({ ...form, notas: event.target.value })}
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-muted sm:col-span-2">
              <input
                type="checkbox"
                checked={form.activo}
                onChange={(event) => setForm({ ...form, activo: event.target.checked })}
                className="h-4 w-4 accent-brand"
              />
              Activo para nuevos turnos
            </label>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={cerrar} className="btn-secondary flex-1">
              Cancelar
            </button>
            <button type="submit" className="btn-primary flex-1" disabled={loading}>
              {loading ? "Guardando…" : "Guardar"}
            </button>
          </div>
        </form>
      )}

      {error ? (
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      ) : null}

      <div className="space-y-2.5">
        {barberos.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-line px-5 py-8 text-center text-sm text-muted">
            Todavía no hay barberos.
          </p>
        ) : (
          barberos.map((barbero) => (
            <div
              key={barbero.id}
              className={`card p-4 ${barbero.activo ? "" : "opacity-60"}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{barbero.nombre}</p>
                  <p className="mt-0.5 text-xs text-muted">
                    {barbero.comisionFija > 0
                      ? `Comisión fija ${formatMoney(barbero.comisionFija)}`
                      : `Comisión ${barbero.comisionPorcentaje}%`}
                    {barbero.telefono ? ` · ${barbero.telefono}` : ""}
                  </p>
                  {barbero.notas ? (
                    <p className="mt-1 text-[11px] text-slate-500">{barbero.notas}</p>
                  ) : null}
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.15em] ring-1 ring-inset ${
                    barbero.activo
                      ? "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30"
                      : "bg-slate-500/15 text-slate-400 ring-slate-500/30"
                  }`}
                >
                  {barbero.activo ? "Activo" : "Inactivo"}
                </span>
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => abrirEdicion(barbero)}
                  className="btn-secondary btn-sm"
                >
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => alternarActivo(barbero)}
                  className="btn-ghost btn-sm"
                >
                  {barbero.activo ? "Desactivar" : "Activar"}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────── Servicios ────────────────────────────── */

type ServicioForm = {
  nombre: string;
  precio: string;
  duracionMin: string;
  activo: boolean;
};

const emptyServicio: ServicioForm = {
  nombre: "",
  precio: "",
  duracionMin: "30",
  activo: true,
};

function ServiciosSection({ servicios }: { servicios: Servicio[] }) {
  const router = useRouter();
  const [form, setForm] = useState<ServicioForm | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function abrirNuevo() {
    setEditingId(null);
    setError("");
    setForm({ ...emptyServicio });
  }

  function abrirEdicion(servicio: Servicio) {
    setEditingId(servicio.id);
    setError("");
    setForm({
      nombre: servicio.nombre,
      precio: String(servicio.precio),
      duracionMin: String(servicio.duracionMin),
      activo: servicio.activo,
    });
  }

  function cerrar() {
    setForm(null);
    setEditingId(null);
    setError("");
  }

  async function guardar(event: React.FormEvent) {
    event.preventDefault();
    if (!form) return;
    setError("");
    setLoading(true);

    const payload = {
      nombre: form.nombre.trim(),
      precio: Number(form.precio) || 0,
      duracionMin: Number(form.duracionMin) || 30,
      activo: form.activo,
    };

    try {
      if (editingId) {
        await apiRequest(`/api/servicios/${editingId}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      } else {
        await apiRequest("/api/servicios", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
      cerrar();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar.");
    } finally {
      setLoading(false);
    }
  }

  async function alternarActivo(servicio: Servicio) {
    setError("");
    try {
      await apiRequest(`/api/servicios/${servicio.id}`, {
        method: "PATCH",
        body: JSON.stringify({ activo: !servicio.activo }),
      });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo actualizar.");
    }
  }

  return (
    <div className="space-y-3">
      {!form ? (
        <button type="button" onClick={abrirNuevo} className="btn-primary w-full">
          + Agregar servicio
        </button>
      ) : (
        <form onSubmit={guardar} className="card animate-fade-up space-y-3 p-4">
          <h3 className="section-title text-xl">
            {editingId ? "Editar servicio" : "Nuevo servicio"}
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="label" htmlFor="servicio-nombre">
                Nombre *
              </label>
              <input
                id="servicio-nombre"
                className="input"
                value={form.nombre}
                onChange={(event) => setForm({ ...form, nombre: event.target.value })}
                required
              />
            </div>
            <div>
              <label className="label" htmlFor="servicio-precio">
                Precio *
              </label>
              <input
                id="servicio-precio"
                type="number"
                min="0"
                step="0.01"
                className="input"
                value={form.precio}
                onChange={(event) => setForm({ ...form, precio: event.target.value })}
                required
              />
            </div>
            <div>
              <label className="label" htmlFor="servicio-duracion">
                Duración (min) *
              </label>
              <input
                id="servicio-duracion"
                type="number"
                min="5"
                max="480"
                step="5"
                className="input"
                value={form.duracionMin}
                onChange={(event) =>
                  setForm({ ...form, duracionMin: event.target.value })
                }
                required
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-muted sm:col-span-2">
              <input
                type="checkbox"
                checked={form.activo}
                onChange={(event) => setForm({ ...form, activo: event.target.checked })}
                className="h-4 w-4 accent-brand"
              />
              Activo para nuevos turnos
            </label>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={cerrar} className="btn-secondary flex-1">
              Cancelar
            </button>
            <button type="submit" className="btn-primary flex-1" disabled={loading}>
              {loading ? "Guardando…" : "Guardar"}
            </button>
          </div>
        </form>
      )}

      {error ? (
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      ) : null}

      <div className="space-y-2.5">
        {servicios.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-line px-5 py-8 text-center text-sm text-muted">
            Todavía no hay servicios.
          </p>
        ) : (
          servicios.map((servicio) => (
            <div
              key={servicio.id}
              className={`card p-4 ${servicio.activo ? "" : "opacity-60"}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{servicio.nombre}</p>
                  <p className="mt-0.5 text-xs text-muted">
                    {formatMoney(servicio.precio)} · {servicio.duracionMin} min
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.15em] ring-1 ring-inset ${
                    servicio.activo
                      ? "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30"
                      : "bg-slate-500/15 text-slate-400 ring-slate-500/30"
                  }`}
                >
                  {servicio.activo ? "Activo" : "Inactivo"}
                </span>
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => abrirEdicion(servicio)}
                  className="btn-secondary btn-sm"
                >
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => alternarActivo(servicio)}
                  className="btn-ghost btn-sm"
                >
                  {servicio.activo ? "Desactivar" : "Activar"}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/* ──────────────────────────────── Promos ──────────────────────────────── */

type PromoForm = {
  fecha: string;
  descripcion: string;
  descuentoPorcentajeSugerido: string;
  activo: boolean;
};

function PromosSection({ promos }: { promos: Promo[] }) {
  const router = useRouter();
  const [form, setForm] = useState<PromoForm | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function abrirNuevo() {
    setEditingId(null);
    setError("");
    setForm({
      fecha: todayISO(),
      descripcion: "",
      descuentoPorcentajeSugerido: "15",
      activo: true,
    });
  }

  function abrirEdicion(promo: Promo) {
    setEditingId(promo.id);
    setError("");
    setForm({
      fecha: promo.fecha,
      descripcion: promo.descripcion,
      descuentoPorcentajeSugerido: String(promo.descuentoPorcentajeSugerido),
      activo: promo.activo,
    });
  }

  function cerrar() {
    setForm(null);
    setEditingId(null);
    setError("");
  }

  async function guardar(event: React.FormEvent) {
    event.preventDefault();
    if (!form) return;
    setError("");
    setLoading(true);

    const payload = {
      fecha: form.fecha,
      descripcion: form.descripcion.trim(),
      descuentoPorcentajeSugerido: Number(form.descuentoPorcentajeSugerido) || 0,
      activo: form.activo,
    };

    try {
      if (editingId) {
        await apiRequest(`/api/promos/${editingId}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      } else {
        await apiRequest("/api/promos", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
      cerrar();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar.");
    } finally {
      setLoading(false);
    }
  }

  async function alternarActivo(promo: Promo) {
    setError("");
    try {
      await apiRequest(`/api/promos/${promo.id}`, {
        method: "PATCH",
        body: JSON.stringify({ activo: !promo.activo }),
      });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo actualizar.");
    }
  }

  return (
    <div className="space-y-3">
      {!form ? (
        <button type="button" onClick={abrirNuevo} className="btn-primary w-full">
          + Agregar promoción
        </button>
      ) : (
        <form onSubmit={guardar} className="card animate-fade-up space-y-3 p-4">
          <h3 className="section-title text-xl">
            {editingId ? "Editar promoción" : "Nueva promoción"}
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="promo-fecha">
                Fecha *
              </label>
              <input
                id="promo-fecha"
                type="date"
                className="input"
                value={form.fecha}
                onChange={(event) => setForm({ ...form, fecha: event.target.value })}
                required
              />
            </div>
            <div>
              <label className="label" htmlFor="promo-pct">
                Descuento sugerido %
              </label>
              <input
                id="promo-pct"
                type="number"
                min="0"
                max="100"
                step="1"
                className="input"
                value={form.descuentoPorcentajeSugerido}
                onChange={(event) =>
                  setForm({
                    ...form,
                    descuentoPorcentajeSugerido: event.target.value,
                  })
                }
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label" htmlFor="promo-desc">
                Descripción *
              </label>
              <input
                id="promo-desc"
                className="input"
                value={form.descripcion}
                onChange={(event) =>
                  setForm({ ...form, descripcion: event.target.value })
                }
                placeholder="Ej. Martes de barba"
                required
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-muted sm:col-span-2">
              <input
                type="checkbox"
                checked={form.activo}
                onChange={(event) => setForm({ ...form, activo: event.target.checked })}
                className="h-4 w-4 accent-brand"
              />
              Activa
            </label>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={cerrar} className="btn-secondary flex-1">
              Cancelar
            </button>
            <button type="submit" className="btn-primary flex-1" disabled={loading}>
              {loading ? "Guardando…" : "Guardar"}
            </button>
          </div>
        </form>
      )}

      {error ? (
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      ) : null}

      <div className="space-y-2.5">
        {promos.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-line px-5 py-8 text-center text-sm text-muted">
            Todavía no hay promociones.
          </p>
        ) : (
          promos
            .slice()
            .sort((a, b) => b.fecha.localeCompare(a.fecha))
            .map((promo) => (
              <div
                key={promo.id}
                className={`card p-4 ${promo.activo ? "" : "opacity-60"}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{promo.descripcion}</p>
                    <p className="mt-0.5 text-xs text-muted">
                      {formatDateNumeric(promo.fecha)} ·{" "}
                      {promo.descuentoPorcentajeSugerido}% sugerido
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.15em] ring-1 ring-inset ${
                      promo.activo
                        ? "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30"
                        : "bg-slate-500/15 text-slate-400 ring-slate-500/30"
                    }`}
                  >
                    {promo.activo ? "Activa" : "Inactiva"}
                  </span>
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => abrirEdicion(promo)}
                    className="btn-secondary btn-sm"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => alternarActivo(promo)}
                    className="btn-ghost btn-sm"
                  >
                    {promo.activo ? "Desactivar" : "Activar"}
                  </button>
                </div>
              </div>
            ))
        )}
      </div>
    </div>
  );
}
