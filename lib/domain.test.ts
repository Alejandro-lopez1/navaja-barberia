import assert from "node:assert/strict";
import { test } from "node:test";
import {
  calcularComision,
  calcularDescuento,
  calcularPrecioFinal,
  haySolapamiento,
  horaAMinutos,
  puedeTransicionar,
} from "./domain";

test("calcula precio final con descuento porcentual", () => {
  assert.equal(calcularDescuento(10000, "porcentaje", 15), 1500);
  assert.equal(calcularPrecioFinal(10000, "porcentaje", 15), 8500);
});

test("limita porcentaje y monto fijo", () => {
  assert.equal(calcularPrecioFinal(10000, "porcentaje", 150), 0);
  assert.equal(calcularPrecioFinal(10000, "monto_fijo", 99999), 0);
  assert.equal(calcularPrecioFinal(10000, "monto_fijo", -50), 10000);
});

test("precio final nunca negativo", () => {
  assert.equal(calcularPrecioFinal(5000, "monto_fijo", 8000), 0);
  assert.equal(calcularPrecioFinal(-100, "porcentaje", 10), 0);
});

test("calcula comisión porcentual redondeada", () => {
  assert.deepEqual(calcularComision(8500, { comisionPorcentaje: 40, comisionFija: 0 }), {
    monto: 3400,
    porcentajeAplicado: 40,
  });
  assert.deepEqual(calcularComision(3333.33, { comisionPorcentaje: 33, comisionFija: 0 }), {
    monto: 1100,
    porcentajeAplicado: 33,
  });
});

test("comisión fija tiene prioridad y no supera el precio final", () => {
  assert.deepEqual(calcularComision(5000, { comisionPorcentaje: 40, comisionFija: 1200 }), {
    monto: 1200,
    porcentajeAplicado: 40,
  });
  assert.equal(
    calcularComision(500, { comisionPorcentaje: 40, comisionFija: 1200 }).monto,
    500,
  );
});

test("detecta solapamientos de turnos activos", () => {
  assert.equal(haySolapamiento("10:00", 30, "10:15", 30), true);
  assert.equal(haySolapamiento("10:00", 30, "10:30", 30), false);
  assert.equal(haySolapamiento("10:00", 60, "10:45", 15), true);
  assert.equal(haySolapamiento("10:00", 30, "09:30", 30), false);
});

test("convierte horas y rechaza valores inválidos", () => {
  assert.equal(horaAMinutos("09:30"), 570);
  assert.equal(Number.isNaN(horaAMinutos("25:00")), true);
  assert.equal(Number.isNaN(horaAMinutos("9")), true);
  assert.equal(horaAMinutos("9:00"), 540);
});

test("valida transiciones de estado", () => {
  assert.equal(puedeTransicionar("Pendiente", "Completado"), true);
  assert.equal(puedeTransicionar("Completado", "Confirmado"), true);
  assert.equal(puedeTransicionar("Completado", "Pendiente"), false);
  assert.equal(puedeTransicionar("Cancelado", "Pendiente"), false);
  assert.equal(puedeTransicionar("No asistió", "Completado"), false);
});
