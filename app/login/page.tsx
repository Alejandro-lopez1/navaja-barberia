import { redirect } from "next/navigation";
import { LoginForm } from "@/components/LoginForm";
import { ScissorsIcon } from "@/components/Icons";
import { authEnabled, isAuthenticated } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (!authEnabled()) redirect("/");
  if (await isAuthenticated()) redirect("/");

  return (
    <div className="min-h-dvh">
      <div className="barber-pole" />
      <main className="mx-auto flex min-h-[calc(100dvh-8px)] w-full max-w-sm flex-col justify-center px-6 py-10">
        <div className="mb-10 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-line bg-surface text-brand">
            <ScissorsIcon className="h-7 w-7" />
          </div>
          <h1 className="font-display text-6xl font-extrabold tracking-tight text-bone">
            NAVAJA
          </h1>
          <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.35em] text-muted">
            Turnos y caja
          </p>
        </div>

        <div className="card p-5">
          <p className="mb-5 text-sm leading-relaxed text-muted">
            Ingresá el PIN del local para administrar la agenda del día.
          </p>
          <LoginForm />
        </div>

        <p className="mt-8 text-center text-[10px] uppercase tracking-[0.25em] text-slate-600">
          Acceso interno
        </p>
      </main>
    </div>
  );
}
