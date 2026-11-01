import type { EstadoTurno } from "@/lib/types";

const STYLES: Record<EstadoTurno, string> = {
  Pendiente: "bg-amber-500/15 text-amber-300 ring-amber-500/30",
  Confirmado: "bg-blue-500/15 text-blue-300 ring-blue-500/30",
  "En atención": "bg-violet-500/15 text-violet-300 ring-violet-500/30",
  Completado: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30",
  Cancelado: "bg-red-500/15 text-red-300 ring-red-500/30",
  "No asistió": "bg-slate-500/15 text-slate-300 ring-slate-500/30",
};

export function StatusBadge({
  estado,
  className = "",
}: {
  estado: EstadoTurno;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ring-1 ring-inset ${STYLES[estado]} ${className}`}
    >
      {estado}
    </span>
  );
}
