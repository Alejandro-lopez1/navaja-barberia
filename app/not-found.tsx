import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-dvh">
      <div className="barber-pole" />
      <main className="mx-auto flex min-h-[calc(100dvh-8px)] w-full max-w-sm flex-col items-center justify-center px-6 text-center">
        <p className="font-display text-7xl font-extrabold leading-none">404</p>
        <h1 className="mt-2 font-display text-3xl font-bold uppercase tracking-wide">
          No encontrado
        </h1>
        <p className="mt-2 text-sm text-muted">
          El turno o la página que buscás no existe.
        </p>
        <Link href="/" className="btn-primary mt-6">
          Volver a la agenda
        </Link>
      </main>
    </div>
  );
}
