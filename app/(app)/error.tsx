"use client";

import { useEffect } from "react";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="card p-6 text-center">
      <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-brand">
        Error de conexión
      </p>
      <h1 className="mt-2 font-display text-4xl font-extrabold uppercase leading-none">
        No pudimos cargar los datos
      </h1>
      <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted">
        Revisá la configuración de Google Sheets (spreadsheet ID, service account y
        permisos) o activá <code className="text-bone">SHEETS_MOCK=true</code> para
        trabajar en local.
      </p>
      <button type="button" onClick={reset} className="btn-primary mt-5">
        Reintentar
      </button>
    </div>
  );
}
