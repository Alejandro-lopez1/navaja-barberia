import Link from "next/link";
import { listBarberos, listTurnos } from "@/lib/db";
import {
  currentMonthRange,
  formatDateNumeric,
  formatMoney,
  isISODate,
} from "@/lib/dates";
import { buildResumen } from "@/lib/reports";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ desde?: string; hasta?: string; barbero?: string }>;
};

export default async function ReportesPage({ searchParams }: Props) {
  const params = await searchParams;
  const rango = currentMonthRange();

  let desde = params.desde && isISODate(params.desde) ? params.desde : rango.desde;
  let hasta = params.hasta && isISODate(params.hasta) ? params.hasta : rango.hasta;
  if (desde > hasta) {
    [desde, hasta] = [hasta, desde];
  }

  const barberoId = params.barbero || "";

  const [barberos, turnos] = await Promise.all([
    listBarberos(),
    listTurnos({ desde, hasta, barberoId: barberoId || undefined }),
  ]);

  const resumen = buildResumen(turnos);

  return (
    <div>
      <header>
        <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-muted">
          Cierre y comisiones
        </p>
        <h1 className="mt-1 font-display text-5xl font-extrabold uppercase leading-none tracking-wide">
          Reportes
        </h1>
        <p className="mt-2 text-xs text-muted">
          {formatDateNumeric(desde)} — {formatDateNumeric(hasta)}
        </p>
      </header>

      <form
        method="get"
        action="/reportes"
        className="card mt-5 grid gap-3 p-4 sm:grid-cols-4"
      >
        <div>
          <label htmlFor="desde" className="label">
            Desde
          </label>
          <input
            id="desde"
            name="desde"
            type="date"
            className="input"
            defaultValue={desde}
          />
        </div>
        <div>
          <label htmlFor="hasta" className="label">
            Hasta
          </label>
          <input
            id="hasta"
            name="hasta"
            type="date"
            className="input"
            defaultValue={hasta}
          />
        </div>
        <div>
          <label htmlFor="barbero" className="label">
            Barbero
          </label>
          <select id="barbero" name="barbero" className="input" defaultValue={barberoId}>
            <option value="">Todos</option>
            {barberos.map((barbero) => (
              <option key={barbero.id} value={barbero.id}>
                {barbero.nombre}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end">
          <button type="submit" className="btn-primary w-full">
            Ver reporte
          </button>
        </div>
      </form>

      <div className="mt-4 grid grid-cols-2 gap-2.5">
        <Metric label="Ingresos" value={formatMoney(resumen.ingresos)} accent="text-emerald-300" />
        <Metric label="Comisiones" value={formatMoney(resumen.comisiones)} accent="text-amber-300" />
        <Metric label="Descuentos" value={formatMoney(resumen.descuentos)} accent="text-red-300" />
        <Metric
          label="Turnos completados"
          value={String(resumen.turnosCompletados)}
          hint={`Ticket ${formatMoney(resumen.ticketPromedio)}`}
        />
      </div>

      {resumen.turnosCompletados === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-line px-5 py-12 text-center">
          <p className="font-display text-4xl font-bold uppercase text-bone">Sin datos</p>
          <p className="mt-2 text-sm text-muted">
            No hay turnos completados en el rango elegido.
          </p>
          <Link href="/" className="btn-secondary mt-5">
            Volver a la agenda
          </Link>
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          <section className="card p-4">
            <h2 className="label mb-3">Comisiones por barbero</h2>
            <div className="overflow-x-auto">
              <table className="table-base">
                <thead>
                  <tr>
                    <th>Barbero</th>
                    <th className="text-right">Turnos</th>
                    <th className="text-right">Ingresos</th>
                    <th className="text-right">Comisión</th>
                  </tr>
                </thead>
                <tbody>
                  {resumen.porBarbero.map((barbero) => (
                    <tr key={barbero.barberoId}>
                      <td className="font-medium">{barbero.nombre}</td>
                      <td className="text-right text-muted">{barbero.turnos}</td>
                      <td className="text-right">{formatMoney(barbero.ingresos)}</td>
                      <td className="text-right font-semibold text-amber-300">
                        {formatMoney(barbero.comisiones)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="card p-4">
            <h2 className="label mb-3">Ingresos por día</h2>
            <div className="overflow-x-auto">
              <table className="table-base">
                <thead>
                  <tr>
                    <th>Día</th>
                    <th className="text-right">Turnos</th>
                    <th className="text-right">Ingresos</th>
                    <th className="text-right">Comisiones</th>
                  </tr>
                </thead>
                <tbody>
                  {resumen.porDia.map((dia) => (
                    <tr key={dia.fecha}>
                      <td className="font-medium">{formatDateNumeric(dia.fecha)}</td>
                      <td className="text-right text-muted">{dia.turnos}</td>
                      <td className="text-right">{formatMoney(dia.ingresos)}</td>
                      <td className="text-right text-amber-300">
                        {formatMoney(dia.comisiones)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="card p-4">
            <h2 className="label mb-3">Métodos de pago</h2>
            <div className="overflow-x-auto">
              <table className="table-base">
                <thead>
                  <tr>
                    <th>Método</th>
                    <th className="text-right">Turnos</th>
                    <th className="text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {resumen.porMetodo.map((metodo) => (
                    <tr key={metodo.metodo || "sin-metodo"}>
                      <td className="font-medium">{metodo.metodo || "Sin método"}</td>
                      <td className="text-right text-muted">{metodo.turnos}</td>
                      <td className="text-right">{formatMoney(metodo.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="card p-4">
            <h2 className="label mb-3">Descuentos aplicados</h2>
            {resumen.descuentosDetalle.length === 0 ? (
              <p className="text-sm text-muted">No se aplicaron descuentos en el rango.</p>
            ) : (
              <div className="space-y-2.5">
                {resumen.descuentosDetalle.map((turno) => (
                  <div
                    key={turno.id}
                    className="flex items-start justify-between gap-3 border-b border-line/60 pb-2.5 last:border-b-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {turno.clienteNombre}{" "}
                        <span className="font-normal text-muted">
                          · {turno.barberoNombre}
                        </span>
                      </p>
                      <p className="mt-0.5 text-[11px] text-muted">
                        {formatDateNumeric(turno.fecha)} · {turno.descuentoMotivo || "Sin motivo"}
                      </p>
                    </div>
                    <span className="shrink-0 text-sm font-semibold text-red-300">
                      -{formatMoney(turno.precioLista - turno.precioFinal)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
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
