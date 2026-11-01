import {
  addLog,
  getBarbero,
  getServicio,
  getTurno,
  insertTurno,
  listServicios,
  listTurnos,
  saveTurno,
} from "./db";
import { isHora, isISODate } from "./dates";
import {
  calcularComision,
  calcularDescuento,
  calcularPrecioFinal,
  esEstadoActivo,
  haySolapamiento,
  puedeTransicionar,
  permiteDescuento,
  round2,
} from "./domain";
import { AppError } from "./errors";
import {
  METODOS_PAGO,
  type DescuentoTipo,
  type EstadoTurno,
  type MetodoPago,
  type Servicio,
  type Turno,
} from "./types";

const TIPOS: DescuentoTipo[] = ["porcentaje", "monto_fijo", "ninguno"];

export type CrearTurnoInput = {
  fecha: string;
  horaInicio: string;
  clienteNombre: string;
  clienteTelefono?: string;
  barberoId: string;
  servicioId: string;
  descuentoTipo?: DescuentoTipo;
  descuentoValor?: number;
  descuentoMotivo?: string;
  metodoPago?: string;
  notas?: string;
};

export type EditarTurnoInput = CrearTurnoInput;

function parseMetodoPago(value: string | undefined): MetodoPago | "" {
  if (!value) return "";
  if (!METODOS_PAGO.includes(value as MetodoPago)) {
    throw new AppError("Método de pago inválido.");
  }
  return value as MetodoPago;
}

function normalizarDescuento(
  precioLista: number,
  tipoInput: DescuentoTipo | undefined,
  valorInput: number | undefined,
  motivoInput: string | undefined,
): { tipo: DescuentoTipo; valor: number; motivo: string } {
  const tipo = tipoInput && TIPOS.includes(tipoInput) ? tipoInput : "ninguno";
  let valor = Number(valorInput ?? 0);

  if (!Number.isFinite(valor) || valor < 0) {
    throw new AppError("El descuento no puede ser negativo.");
  }

  if (tipo === "porcentaje") {
    if (valor > 100) throw new AppError("El descuento porcentual no puede superar 100%.");
  } else if (tipo === "monto_fijo") {
    valor = Math.min(valor, precioLista);
  }

  const monto = calcularDescuento(precioLista, tipo, valor);
  if (monto <= 0) {
    return { tipo: "ninguno", valor: 0, motivo: "" };
  }

  const motivo = String(motivoInput ?? "").trim();
  if (!motivo) {
    throw new AppError("Indicá el motivo del descuento.");
  }

  return { tipo, valor: round2(valor), motivo };
}

function duracionDe(servicioId: string, servicios: Servicio[]): number {
  return servicios.find((s) => s.id === servicioId)?.duracionMin || 30;
}

async function validarHorario(input: {
  fecha: string;
  horaInicio: string;
  barberoId: string;
  servicioId: string;
  excluirId?: string;
}): Promise<void> {
  if (!isISODate(input.fecha)) throw new AppError("La fecha no es válida.");
  if (!isHora(input.horaInicio)) throw new AppError("La hora debe tener formato HH:mm.");

  const [turnos, servicios] = await Promise.all([
    listTurnos({ fecha: input.fecha }),
    listServicios(),
  ]);

  const duracion = duracionDe(input.servicioId, servicios);

  const solapado = turnos.find(
    (t) =>
      t.id !== input.excluirId &&
      t.barberoId === input.barberoId &&
      esEstadoActivo(t.estado) &&
      haySolapamiento(
        input.horaInicio,
        duracion,
        t.horaInicio,
        duracionDe(t.servicioId, servicios),
      ),
  );

  if (solapado) {
    throw new AppError(
      `El barbero ya tiene un turno activo superpuesto a las ${solapado.horaInicio}.`,
      409,
    );
  }
}

async function resolverConfiguracion(
  barberoId: string,
  servicioId: string,
  permitirInactivos?: { barberoId?: string; servicioId?: string },
) {
  const [barbero, servicio] = await Promise.all([
    getBarbero(barberoId),
    getServicio(servicioId),
  ]);

  if (!barbero) throw new AppError("El barbero no existe.", 404);
  if (!servicio) throw new AppError("El servicio no existe.", 404);

  if (!barbero.activo && barbero.id !== permitirInactivos?.barberoId) {
    throw new AppError("El barbero está inactivo.");
  }
  if (!servicio.activo && servicio.id !== permitirInactivos?.servicioId) {
    throw new AppError("El servicio está inactivo.");
  }

  return { barbero, servicio };
}

export async function crearTurno(input: CrearTurnoInput): Promise<Turno> {
  const clienteNombre = input.clienteNombre.trim();
  if (!clienteNombre) throw new AppError("El nombre del cliente es obligatorio.");

  const { barbero, servicio } = await resolverConfiguracion(
    input.barberoId,
    input.servicioId,
  );

  await validarHorario({
    fecha: input.fecha,
    horaInicio: input.horaInicio,
    barberoId: input.barberoId,
    servicioId: input.servicioId,
  });

  const descuento = normalizarDescuento(
    servicio.precio,
    input.descuentoTipo,
    input.descuentoValor,
    input.descuentoMotivo,
  );

  const precioFinal = calcularPrecioFinal(
    servicio.precio,
    descuento.tipo,
    descuento.valor,
  );

  const turno = await insertTurno({
    fecha: input.fecha,
    horaInicio: input.horaInicio,
    clienteNombre,
    clienteTelefono: String(input.clienteTelefono ?? "").trim(),
    barberoId: barbero.id,
    barberoNombre: barbero.nombre,
    servicioId: servicio.id,
    servicioNombre: servicio.nombre,
    precioLista: servicio.precio,
    descuentoTipo: descuento.tipo,
    descuentoValor: descuento.valor,
    descuentoMotivo: descuento.motivo,
    precioFinal,
    metodoPago: parseMetodoPago(input.metodoPago),
    estado: "Pendiente",
    comisionPorcentajeAplicado: 0,
    comisionMonto: 0,
    notas: String(input.notas ?? "").trim(),
  });

  await addLog({
    idTurno: turno.id,
    accion: "Creación",
    estadoNuevo: turno.estado,
  });

  if (descuento.tipo !== "ninguno") {
    await addLog({
      idTurno: turno.id,
      accion: `Descuento aplicado (${descuento.motivo})`,
      estadoAnterior: turno.estado,
      estadoNuevo: turno.estado,
    });
  }

  return turno;
}

export async function editarTurno(
  id: string,
  input: EditarTurnoInput,
): Promise<Turno> {
  const turno = await getTurno(id);
  if (!turno) throw new AppError("Turno no encontrado.", 404);
  if (!esEstadoActivo(turno.estado)) {
    throw new AppError("Solo se pueden editar turnos activos.", 409);
  }

  const clienteNombre = input.clienteNombre.trim();
  if (!clienteNombre) throw new AppError("El nombre del cliente es obligatorio.");

  const { barbero, servicio } = await resolverConfiguracion(
    input.barberoId,
    input.servicioId,
    { barberoId: turno.barberoId, servicioId: turno.servicioId },
  );

  await validarHorario({
    fecha: input.fecha,
    horaInicio: input.horaInicio,
    barberoId: input.barberoId,
    servicioId: input.servicioId,
    excluirId: id,
  });

  const descuento = normalizarDescuento(
    servicio.precio,
    input.descuentoTipo,
    input.descuentoValor,
    input.descuentoMotivo,
  );

  const updated = await saveTurno({
    ...turno,
    fecha: input.fecha,
    horaInicio: input.horaInicio,
    clienteNombre,
    clienteTelefono: String(input.clienteTelefono ?? "").trim(),
    barberoId: barbero.id,
    barberoNombre: barbero.nombre,
    servicioId: servicio.id,
    servicioNombre: servicio.nombre,
    precioLista: servicio.precio,
    descuentoTipo: descuento.tipo,
    descuentoValor: descuento.valor,
    descuentoMotivo: descuento.motivo,
    precioFinal: calcularPrecioFinal(servicio.precio, descuento.tipo, descuento.valor),
    metodoPago:
      input.metodoPago !== undefined
        ? parseMetodoPago(input.metodoPago)
        : turno.metodoPago,
    notas: String(input.notas ?? "").trim(),
  });

  await addLog({
    idTurno: id,
    accion: "Edición",
    estadoAnterior: turno.estado,
    estadoNuevo: turno.estado,
  });

  return updated;
}

export async function cambiarEstado(
  id: string,
  nuevoEstado: EstadoTurno,
  metodoPago?: string,
): Promise<Turno> {
  const turno = await getTurno(id);
  if (!turno) throw new AppError("Turno no encontrado.", 404);

  if (turno.estado === nuevoEstado) {
    throw new AppError("El turno ya está en ese estado.");
  }

  if (!puedeTransicionar(turno.estado, nuevoEstado)) {
    throw new AppError(
      `No se puede pasar de "${turno.estado}" a "${nuevoEstado}".`,
      409,
    );
  }

  if (esEstadoActivo(nuevoEstado)) {
    await validarHorario({
      fecha: turno.fecha,
      horaInicio: turno.horaInicio,
      barberoId: turno.barberoId,
      servicioId: turno.servicioId,
      excluirId: turno.id,
    });
  }

  let comisionPorcentajeAplicado = turno.comisionPorcentajeAplicado;
  let comisionMonto = turno.comisionMonto;
  let metodo = turno.metodoPago;

  if (metodoPago !== undefined) {
    metodo = parseMetodoPago(metodoPago);
  }

  if (nuevoEstado === "Completado") {
    if (!metodo) {
      throw new AppError("Para completar el turno tenés que indicar el método de pago.");
    }
    const barbero = await getBarbero(turno.barberoId);
    if (!barbero) throw new AppError("No se encontró el barbero del turno.", 404);

    const comision = calcularComision(turno.precioFinal, {
      comisionPorcentaje: barbero.comisionPorcentaje,
      comisionFija: barbero.comisionFija,
    });
    comisionPorcentajeAplicado = comision.porcentajeAplicado;
    comisionMonto = comision.monto;
  }

  if (turno.estado === "Completado" && nuevoEstado !== "Completado") {
    comisionPorcentajeAplicado = 0;
    comisionMonto = 0;
  }

  const updated = await saveTurno({
    ...turno,
    estado: nuevoEstado,
    metodoPago: metodo,
    comisionPorcentajeAplicado,
    comisionMonto,
  });

  await addLog({
    idTurno: id,
    accion: "Cambio de estado",
    estadoAnterior: turno.estado,
    estadoNuevo: nuevoEstado,
  });

  return updated;
}

export async function aplicarDescuento(
  id: string,
  tipo: DescuentoTipo,
  valor: number,
  motivo: string,
): Promise<Turno> {
  const turno = await getTurno(id);
  if (!turno) throw new AppError("Turno no encontrado.", 404);
  if (!permiteDescuento(turno.estado)) {
    throw new AppError("El descuento solo se aplica antes de completar o cancelar.", 409);
  }

  const descuento = normalizarDescuento(turno.precioLista, tipo, valor, motivo);
  const precioFinal = calcularPrecioFinal(
    turno.precioLista,
    descuento.tipo,
    descuento.valor,
  );

  const updated = await saveTurno({
    ...turno,
    descuentoTipo: descuento.tipo,
    descuentoValor: descuento.valor,
    descuentoMotivo: descuento.motivo,
    precioFinal,
  });

  await addLog({
    idTurno: id,
    accion:
      descuento.tipo === "ninguno"
        ? "Descuento quitado"
        : `Descuento aplicado (${descuento.motivo})`,
    estadoAnterior: turno.estado,
    estadoNuevo: turno.estado,
  });

  return updated;
}
