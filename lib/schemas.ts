import { z } from "zod";
import { isISODate } from "./dates";
import {
  ESTADOS,
  METODOS_PAGO,
  TIPOS_DESCUENTO,
} from "./types";

export const barberoSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio.").max(80),
  activo: z.boolean().optional().default(true),
  comisionPorcentaje: z.coerce
    .number()
    .min(0, "La comisión no puede ser negativa.")
    .max(100, "La comisión no puede superar 100%."),
  comisionFija: z.coerce.number().min(0).optional().default(0),
  telefono: z.string().max(50).optional().default(""),
  notas: z.string().max(500).optional().default(""),
});

export const barberoPatchSchema = barberoSchema.partial();

export const servicioSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio.").max(80),
  precio: z.coerce.number().min(0, "El precio no puede ser negativo."),
  duracionMin: z.coerce
    .number()
    .int()
    .min(5, "La duración mínima es 5 minutos.")
    .max(480, "La duración máxima es 480 minutos."),
  activo: z.boolean().optional().default(true),
});

export const servicioPatchSchema = servicioSchema.partial();

export const promoSchema = z.object({
  fecha: z
    .string()
    .refine(isISODate, "La fecha debe tener formato YYYY-MM-DD."),
  descripcion: z.string().trim().min(1, "La descripción es obligatoria.").max(200),
  descuentoPorcentajeSugerido: z.coerce
    .number()
    .min(0)
    .max(100, "El porcentaje no puede superar 100."),
  activo: z.boolean().optional().default(true),
});

export const promoPatchSchema = promoSchema.partial();

const metodoPagoSchema = z
  .union([z.enum(METODOS_PAGO), z.literal("")])
  .optional();

const turnoBase = {
  fecha: z.string().refine(isISODate, "La fecha no es válida."),
  horaInicio: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "La hora debe tener formato HH:mm."),
  clienteNombre: z.string().trim().min(1, "El nombre del cliente es obligatorio.").max(120),
  clienteTelefono: z.string().max(50).optional().default(""),
  barberoId: z.string().min(1, "Elegí un barbero."),
  servicioId: z.string().min(1, "Elegí un servicio."),
  descuentoTipo: z.enum(TIPOS_DESCUENTO).optional().default("ninguno"),
  descuentoValor: z.coerce.number().min(0).optional().default(0),
  descuentoMotivo: z.string().max(200).optional().default(""),
  metodoPago: metodoPagoSchema,
  notas: z.string().max(500).optional().default(""),
};

export const turnoCreateSchema = z.object(turnoBase);

export const turnoPatchSchema = z.discriminatedUnion("accion", [
  z.object({ accion: z.literal("editar"), ...turnoBase }),
  z.object({
    accion: z.literal("estado"),
    estado: z.enum(ESTADOS),
    metodoPago: metodoPagoSchema,
  }),
  z.object({
    accion: z.literal("descuento"),
    descuentoTipo: z.enum(TIPOS_DESCUENTO),
    descuentoValor: z.coerce.number().min(0).optional().default(0),
    descuentoMotivo: z.string().max(200).optional().default(""),
  }),
]);

export const loginSchema = z.object({
  pin: z.string().min(1, "Ingresá el PIN."),
});
