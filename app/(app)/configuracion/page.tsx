import { ConfiguracionClient } from "@/components/ConfiguracionClient";
import { LogoutButton } from "@/components/LogoutButton";
import { authEnabled } from "@/lib/auth";
import { listBarberos, listPromos, listServicios } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function ConfiguracionPage() {
  const [barberos, servicios, promos] = await Promise.all([
    listBarberos(),
    listServicios(),
    listPromos(),
  ]);

  return (
    <div>
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-muted">
            Ajustes del local
          </p>
          <h1 className="mt-1 font-display text-5xl font-extrabold uppercase leading-none tracking-wide">
            Configuración
          </h1>
        </div>
        {authEnabled() ? <LogoutButton /> : null}
      </header>

      <ConfiguracionClient
        barberos={barberos}
        servicios={servicios}
        promos={promos}
      />
    </div>
  );
}
