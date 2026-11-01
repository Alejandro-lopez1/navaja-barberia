export const ESTADOS = [
  "Pendiente",
  "Confirmado",
  "En atención",
  "Completado",
  "Cancelado",
  "No asistió",
] as const;

export type EstadoTurno = (typeof ESTADOS)[number];

export const METODOS_PAGO = [
  "Efectivo",
  "Transferencia",
  "Tarjeta débito",
  "Tarjeta crédito",
  "Mercado Pago",
  "Otro",
] as const;

export type MetodoPago = (typeof METODOS_PAGO)[number];

export const TIPOS_DESCUENTO = ["porcentaje", "monto_fijo", "ninguno"] as const;

export type DescuentoTipo = (typeof TIPOS_DESCUENTO)[number];

export type Barbero = {
  id: string;
  nombre: string;
  activo: boolean;
  comisionPorcentaje: number;
  comisionFija: number;
  telefono: string;
  notas: string;
};

export type Servicio = {
  id: string;
  nombre: string;
  precio: number;
  duracionMin: number;
  activo: boolean;
};

export type Promo = {
  id: string;
  fecha: string;
  descripcion: string;
  descuentoPorcentajeSugerido: number;
  activo: boolean;
};

export type Turno = {
  id: string;
  fecha: string;
  horaInicio: string;
  clienteNombre: string;
  clienteTelefono: string;
  barberoId: string;
  barberoNombre: string;
  servicioId: string;
  servicioNombre: string;
  precioLista: number;
  descuentoTipo: DescuentoTipo;
  descuentoValor: number;
  descuentoMotivo: string;
  precioFinal: number;
  metodoPago: MetodoPago | "";
  estado: EstadoTurno;
  comisionPorcentajeAplicado: number;
  comisionMonto: number;
  notas: string;
  creadoEn: string;
  actualizadoEn: string;
};

export type LogCambio = {
  id: string;
  idTurno: string;
  accion: string;
  estadoAnterior: string;
  estadoNuevo: string;
  usuario: string;
  timestamp: string;
};

export const TABS = {
  barberos: "Config_Barberos",
  servicios: "Config_Servicios",
  promos: "Config_Promos",
  turnos: "Turnos",
  logs: "Log_Cambios",
} as const;

export type TabKey = keyof typeof TABS;
export type TabName = (typeof TABS)[TabKey];

export const SHEET_HEADERS: Record<TabName, readonly string[]> = {
  Config_Barberos: [
    "ID_Barbero",
    "Nombre",
    "Activo",
    "Comision_Porcentaje",
    "Comision_Fija_Opcional",
    "Telefono",
    "Notas",
  ],
  Config_Servicios: [
    "ID_Servicio",
    "Nombre",
    "Precio",
    "Duracion_Min",
    "Activo",
  ],
  Config_Promos: [
    "ID_Promo",
    "Fecha",
    "Descripcion",
    "Descuento_Porcentaje_Sugerido",
    "Activo",
  ],
  Turnos: [
    "ID_Turno",
    "Fecha",
    "Hora_Inicio",
    "Cliente_Nombre",
    "Cliente_Telefono",
    "Barbero_ID",
    "Barbero_Nombre",
    "Servicio_ID",
    "Servicio_Nombre",
    "Precio_Lista",
    "Descuento_Tipo",
    "Descuento_Valor",
    "Descuento_Motivo",
    "Precio_Final",
    "Metodo_Pago",
    "Estado",
    "Comision_Porcentaje_Aplicado",
    "Comision_Monto",
    "Notas",
    "Creado_En",
    "Actualizado_En",
  ],
  Log_Cambios: [
    "ID_Log",
    "ID_Turno",
    "Accion",
    "Estado_Anterior",
    "Estado_Nuevo",
    "Usuario",
    "Timestamp",
  ],
};

export const ESTADOS_ACTIVOS: readonly EstadoTurno[] = [
  "Pendiente",
  "Confirmado",
  "En atención",
];

export const ESTADOS_CERRADOS: readonly EstadoTurno[] = [
  "Completado",
  "Cancelado",
  "No asistió",
];
