import "./env";
import {
  createBarbero,
  createPromo,
  createServicio,
  listBarberos,
  listPromos,
  listServicios,
  listTurnos,
} from "../lib/db";
import { todayISO } from "../lib/dates";
import { initLocalStore } from "../lib/local-store";
import { initSheets } from "../lib/sheets";
import { cambiarEstado, crearTurno } from "../lib/turnos-service";

async function main() {
  if (process.env.SHEETS_MOCK === "true") {
    await initLocalStore();
  } else {
    await initSheets();
  }

  const hoy = todayISO();

  if ((await listBarberos()).length === 0) {
    await createBarbero({
      nombre: "Nico",
      activo: true,
      comisionPorcentaje: 40,
      comisionFija: 0,
      telefono: "11 5555-1001",
      notas: "Cortes clásicos y degradados",
    });
    await createBarbero({
      nombre: "Fede",
      activo: true,
      comisionPorcentaje: 45,
      comisionFija: 0,
      telefono: "11 5555-1002",
      notas: "Barba y perfilado",
    });
    await createBarbero({
      nombre: "Seba",
      activo: true,
      comisionPorcentaje: 35,
      comisionFija: 2500,
      telefono: "11 5555-1003",
      notas: "Comisión fija por trabajo",
    });
    console.log("Barberos demo creados.");
  }

  if ((await listServicios()).length === 0) {
    await createServicio({ nombre: "Corte clásico", precio: 8000, duracionMin: 30, activo: true });
    await createServicio({ nombre: "Corte + barba", precio: 12000, duracionMin: 45, activo: true });
    await createServicio({ nombre: "Barba", precio: 5000, duracionMin: 20, activo: true });
    await createServicio({ nombre: "Degradado", precio: 9000, duracionMin: 35, activo: true });
    await createServicio({ nombre: "Color", precio: 15000, duracionMin: 60, activo: true });
    console.log("Servicios demo creados.");
  }

  const promos = await listPromos();
  if (!promos.some((promo) => promo.fecha === hoy)) {
    await createPromo({
      fecha: hoy,
      descripcion: "Promo del día: 15% en corte",
      descuentoPorcentajeSugerido: 15,
      activo: true,
    });
    console.log("Promoción demo creada para hoy.");
  }

  const turnosHoy = await listTurnos({ fecha: hoy });
  if (turnosHoy.length === 0) {
    const [barberos, servicios] = await Promise.all([listBarberos(), listServicios()]);
    if (barberos.length >= 2 && servicios.length >= 3) {
      const [nico, fede] = barberos;
      const [corte, corteBarba, barba] = servicios;

      const turno1 = await crearTurno({
        fecha: hoy,
        horaInicio: "10:00",
        clienteNombre: "Juan Pérez",
        clienteTelefono: "11 4444-2001",
        barberoId: nico.id,
        servicioId: corte.id,
        descuentoTipo: "porcentaje",
        descuentoValor: 15,
        descuentoMotivo: "Promo del día",
        metodoPago: "Efectivo",
        notas: "Cliente habitual",
      });
      await cambiarEstado(turno1.id, "Completado", "Efectivo");

      await crearTurno({
        fecha: hoy,
        horaInicio: "11:00",
        clienteNombre: "Martín Gómez",
        clienteTelefono: "11 4444-2002",
        barberoId: fede.id,
        servicioId: corteBarba.id,
        metodoPago: "Transferencia",
      });

      const turno3 = await crearTurno({
        fecha: hoy,
        horaInicio: "12:30",
        clienteNombre: "Lucas Díaz",
        clienteTelefono: "11 4444-2003",
        barberoId: nico.id,
        servicioId: barba.id,
        metodoPago: "Mercado Pago",
      });
      await cambiarEstado(turno3.id, "Completado", "Mercado Pago");

      console.log("Turnos demo creados para hoy.");
    }
  }

  console.log("Seed completado.");
}

main().catch((error) => {
  console.error("No se pudo ejecutar el seed:", error);
  process.exit(1);
});
