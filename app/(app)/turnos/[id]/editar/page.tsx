import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "@/components/Icons";
import { TurnoForm } from "@/components/TurnoForm";
import {
  getPromoForDate,
  getTurno,
  listBarberos,
  listServicios,
} from "@/lib/db";
import { formatDateLong } from "@/lib/dates";
import { esEstadoActivo } from "@/lib/domain";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditarTurnoPage({ params }: Props) {
  const { id } = await params;
  const turno = await getTurno(id);
  if (!turno) notFound();

  const [barberos, servicios, promo] = await Promise.all([
    listBarberos(),
    listServicios(),
    getPromoForDate(turno.fecha),
  ]);

  return (
    <div>
      <div className="flex items-center gap-3">
        <Link
          href={`/turnos/${turno.id}`}
          aria-label="Volver al detalle"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-line bg-surface text-bone transition hover:border-slate-500"
        >
          <ArrowLeft />
        </Link>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-muted">
            {formatDateLong(turno.fecha)} · {turno.horaInicio}
          </p>
          <h1 className="font-display text-4xl font-extrabold uppercase leading-none tracking-wide">
            Editar turno
          </h1>
        </div>
      </div>

      <div className="mt-6">
        {esEstadoActivo(turno.estado) ? (
          <TurnoForm
            mode="editar"
            fechaInicial={turno.fecha}
            barberos={barberos}
            servicios={servicios}
            turno={turno}
            promoInicial={promo}
          />
        ) : (
          <div className="card p-6 text-center">
            <h2 className="font-display text-3xl font-bold uppercase">
              Turno cerrado
            </h2>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted">
              Los turnos en estado {turno.estado} no se pueden editar. Si necesitás
              corregirlo, revertí el estado desde el detalle.
            </p>
            <Link href={`/turnos/${turno.id}`} className="btn-secondary mt-5">
              Volver al detalle
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
