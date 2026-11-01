import { round2 } from "./domain";
import type { MetodoPago, Turno } from "./types";

export type BarberoResumen = {
  barberoId: string;
  nombre: string;
  turnos: number;
  ingresos: number;
  comisiones: number;
};

export type DiaResumen = {
  fecha: string;
  turnos: number;
  ingresos: number;
  comisiones: number;
};

export type MetodoResumen = {
  metodo: MetodoPago | "";
  turnos: number;
  total: number;
};

export type Resumen = {
  turnosCompletados: number;
  ingresos: number;
  comisiones: number;
  descuentos: number;
  ticketPromedio: number;
  porBarbero: BarberoResumen[];
  porDia: DiaResumen[];
  porMetodo: MetodoResumen[];
  descuentosDetalle: Turno[];
};

export function buildResumen(turnos: Turno[]): Resumen {
  const completados = turnos.filter((t) => t.estado === "Completado");

  const ingresos = round2(completados.reduce((acc, t) => acc + t.precioFinal, 0));
  const comisiones = round2(completados.reduce((acc, t) => acc + t.comisionMonto, 0));
  const descuentos = round2(
    completados.reduce((acc, t) => acc + Math.max(0, t.precioLista - t.precioFinal), 0),
  );

  const barberos = new Map<string, BarberoResumen>();
  const dias = new Map<string, DiaResumen>();
  const metodos = new Map<string, MetodoResumen>();

  for (const turno of completados) {
    const barbero = barberos.get(turno.barberoId) ?? {
      barberoId: turno.barberoId,
      nombre: turno.barberoNombre || "Sin barbero",
      turnos: 0,
      ingresos: 0,
      comisiones: 0,
    };
    barbero.turnos += 1;
    barbero.ingresos = round2(barbero.ingresos + turno.precioFinal);
    barbero.comisiones = round2(barbero.comisiones + turno.comisionMonto);
    barberos.set(turno.barberoId, barbero);

    const dia = dias.get(turno.fecha) ?? {
      fecha: turno.fecha,
      turnos: 0,
      ingresos: 0,
      comisiones: 0,
    };
    dia.turnos += 1;
    dia.ingresos = round2(dia.ingresos + turno.precioFinal);
    dia.comisiones = round2(dia.comisiones + turno.comisionMonto);
    dias.set(turno.fecha, dia);

    const metodoKey = turno.metodoPago || "";
    const metodo = metodos.get(metodoKey) ?? {
      metodo: turno.metodoPago,
      turnos: 0,
      total: 0,
    };
    metodo.turnos += 1;
    metodo.total = round2(metodo.total + turno.precioFinal);
    metodos.set(metodoKey, metodo);
  }

  return {
    turnosCompletados: completados.length,
    ingresos,
    comisiones,
    descuentos,
    ticketPromedio:
      completados.length > 0 ? round2(ingresos / completados.length) : 0,
    porBarbero: [...barberos.values()].sort((a, b) => b.ingresos - a.ingresos),
    porDia: [...dias.values()].sort((a, b) => a.fecha.localeCompare(b.fecha)),
    porMetodo: [...metodos.values()].sort((a, b) => b.total - a.total),
    descuentosDetalle: completados
      .filter((t) => t.descuentoValor > 0)
      .sort((a, b) => `${b.fecha} ${b.horaInicio}`.localeCompare(`${a.fecha} ${a.horaInicio}`)),
  };
}
