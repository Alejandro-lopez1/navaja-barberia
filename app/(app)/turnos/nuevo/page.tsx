import Link from "next/link";
import { ArrowLeft } from "@/components/Icons";
import { TurnoForm } from "@/components/TurnoForm";
import { getPromoForDate, listBarberos, listServicios } from "@/lib/db";
import { formatDateLong, isISODate, todayISO } from "@/lib/dates";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ fecha?: string }>;
};

export default async function NuevoTurnoPage({ searchParams }: Props) {
  const params = await searchParams;
  const fecha =
    params.fecha && isISODate(params.fecha) ? params.fecha : todayISO();

  const [barberos, servicios, promo] = await Promise.all([
    listBarberos(),
    listServicios(),
    getPromoForDate(fecha),
  ]);

  const hayBarberos = barberos.some((b) => b.activo);
  const hayServicios = servicios.some((s) => s.activo);

  return (
    <div>
      <div className="flex items-center gap-3">
        <Link
          href={`/?fecha=${fecha}`}
          aria-label="Volver a la agenda"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-line bg-surface text-bone transition hover:border-slate-500"
        >
          <ArrowLeft />
        </Link>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-muted">
            {formatDateLong(fecha)}
          </p>
          <h1 className="font-display text-4xl font-extrabold uppercase leading-none tracking-wide">
            Nuevo turno
          </h1>
        </div>
      </div>

      <div className="mt-6">
        {hayBarberos && hayServicios ? (
          <TurnoForm
            mode="crear"
            fechaInicial={fecha}
            barberos={barberos}
            servicios={servicios}
            promoInicial={promo}
          />
        ) : (
          <div className="card p-6 text-center">
            <h2 className="font-display text-3xl font-bold uppercase">Falta configurar</h2>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted">
              Necesitás al menos un barbero activo y un servicio activo para cargar
              turnos.
            </p>
            <Link href="/configuracion" className="btn-primary mt-5">
              Ir a configuración
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
