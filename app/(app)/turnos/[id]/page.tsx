import { notFound } from "next/navigation";
import { TurnoDetalle } from "@/components/TurnoDetalle";
import { getPromoForDate, getTurno, listLogs } from "@/lib/db";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function TurnoPage({ params }: Props) {
  const { id } = await params;
  const turno = await getTurno(id);
  if (!turno) notFound();

  const [logs, promo] = await Promise.all([
    listLogs(id),
    getPromoForDate(turno.fecha),
  ]);

  return (
    <TurnoDetalle
      key={turno.actualizadoEn}
      turno={turno}
      logs={logs}
      promo={promo}
    />
  );
}
