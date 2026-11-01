import Link from "next/link";
import { AgendaClient } from "@/components/AgendaClient";
import { ChevronLeft, ChevronRight } from "@/components/Icons";
import { listBarberos, listTurnos } from "@/lib/db";
import {
  addDaysISO,
  dayNumber,
  isISODate,
  monthShort,
  todayISO,
  weekdayLong,
} from "@/lib/dates";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ fecha?: string }>;
};

export default async function HomePage({ searchParams }: Props) {
  const params = await searchParams;
  const hoy = todayISO();
  const fecha = params.fecha && isISODate(params.fecha) ? params.fecha : hoy;

  const [barberos, turnos] = await Promise.all([
    listBarberos(),
    listTurnos({ fecha }),
  ]);

  const anterior = addDaysISO(fecha, -1);
  const siguiente = addDaysISO(fecha, 1);

  return (
    <div>
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-6xl font-extrabold leading-none tracking-tight text-bone">
            NAVAJA
          </h1>
          <p className="mt-1.5 text-[10px] font-semibold uppercase tracking-[0.32em] text-muted">
            Barbería
          </p>
        </div>
        <p className="pt-1 text-right text-[10px] font-semibold uppercase leading-relaxed tracking-[0.3em] text-muted">
          Turnos
          <br />y caja
        </p>
      </header>

      <div className="mt-6 flex items-center justify-between gap-3">
        <Link
          href={`/?fecha=${anterior}`}
          aria-label="Día anterior"
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-line bg-surface text-bone transition hover:border-slate-500 hover:bg-slate-700/60"
        >
          <ChevronLeft />
        </Link>

        <div className="text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-muted">
            {weekdayLong(fecha)}
          </p>
          <p className="font-display text-4xl font-bold uppercase leading-none tracking-wide text-bone">
            {dayNumber(fecha)} {monthShort(fecha)}
          </p>
          {fecha !== hoy ? (
            <Link
              href="/"
              className="mt-1 inline-block text-[10px] font-semibold uppercase tracking-[0.2em] text-brand hover:text-red-400"
            >
              Volver a hoy
            </Link>
          ) : null}
        </div>

        <Link
          href={`/?fecha=${siguiente}`}
          aria-label="Día siguiente"
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-line bg-surface text-bone transition hover:border-slate-500 hover:bg-slate-700/60"
        >
          <ChevronRight />
        </Link>
      </div>

      <AgendaClient fecha={fecha} turnos={turnos} barberos={barberos} />
    </div>
  );
}
