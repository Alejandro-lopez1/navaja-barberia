# NAVAJA — Diseño técnico y sistema de diseño

## 1. Arquitectura

```
Browser (React 19 + Tailwind)
        │  fetch JSON / navegación
        ▼
Next.js 15 App Router (server components + route handlers)
        │
        ▼
Repositorio (lib/db.ts)
        │
        ├── GoogleSheetsStore  (googleapis, service account)
        └── LocalJsonStore     (SHEETS_MOCK=true, .data/db.json)
```

- Las páginas leen datos desde el servidor; los formularios mutan por API y luego refrescan.
- `lib/domain.ts` concentra reglas puras y testeables (precio final, comisión, solapamiento, transiciones).
- `lib/db.ts` mapea filas de la Sheet a objetos tipados y aplica la lógica de negocio.
- Credenciales Google solo en el servidor. `googleapis` se marca como paquete externo del servidor.
- PIN opcional: cookie HttpOnly firmada con HMAC; layout del grupo `(app)` y route handlers validan.

## 2. Modelo de datos

### Pestañas y encabezados

| Pestaña | Encabezados |
|---|---|
| Config_Barberos | ID_Barbero, Nombre, Activo, Comision_Porcentaje, Comision_Fija_Opcional, Telefono, Notas |
| Config_Servicios | ID_Servicio, Nombre, Precio, Duracion_Min, Activo |
| Config_Promos | ID_Promo, Fecha, Descripcion, Descuento_Porcentaje_Sugerido, Activo |
| Turnos | ID_Turno, Fecha, Hora_Inicio, Cliente_Nombre, Cliente_Telefono, Barbero_ID, Barbero_Nombre, Servicio_ID, Servicio_Nombre, Precio_Lista, Descuento_Tipo, Descuento_Valor, Descuento_Motivo, Precio_Final, Metodo_Pago, Estado, Comision_Porcentaje_Aplicado, Comision_Monto, Notas, Creado_En, Actualizado_En |
| Log_Cambios | ID_Log, ID_Turno, Accion, Estado_Anterior, Estado_Nuevo, Usuario, Timestamp |

### Tipos

```ts
type EstadoTurno = 'Pendiente' | 'Confirmado' | 'En atención' | 'Completado' | 'Cancelado' | 'No asistió'
type MetodoPago = 'Efectivo' | 'Transferencia' | 'Tarjeta débito' | 'Tarjeta crédito' | 'Mercado Pago' | 'Otro'
type DescuentoTipo = 'porcentaje' | 'monto_fijo' | 'ninguno'
```

### Invariantes
- `Precio_Final` y `Comision_Monto` son números con 2 decimales.
- `Activo` se persiste como `TRUE`/`FALSE`.
- Los IDs son UUID v4 (`crypto.randomUUID()`).
- `Creado_En` / `Actualizado_En` / `Timestamp` son ISO 8601.
- La fila completa se reescribe al actualizar; el ID nunca cambia.

## 3. Flujos

### Crear turno
1. Se eligen fecha, hora, barbero y servicio activos.
2. El servidor obtiene precio y duración del servicio (no confía en el cliente).
3. Valida solapamiento contra turnos activos del mismo barbero y fecha.
4. Calcula `Precio_Final`, persiste `Pendiente`, comisión 0.
5. Agrega log `Creación`.

### Aplicar descuento
1. Disponible solo en Pendiente / Confirmado / En atención.
2. La UI muestra la promo del día si existe; permite autocompletar.
3. El servidor limita el descuento, recalcula `Precio_Final` y registra log.

### Completar
1. Exige método de pago válido.
2. Verifica transición y solapamiento si corresponde.
3. Calcula comisión con la configuración actual del barbero.
4. Persiste estado, pago y comisión; registra log.

### Revertir Completado
1. Solo hacia `Confirmado`.
2. `Comision_Monto` y `Comision_Porcentaje_Aplicado` vuelven a 0.
3. Se registra log con estado anterior/nuevo.

### Reportes
- Se leen todos los turnos y se filtran por rango.
- Ingresos y comisiones consideran solo `Completado`.
- Descuentos consideran turnos completados con descuento > 0.
- Se agrupa por día, barbero y método de pago.

## 4. API

| Método | Ruta | Función |
|---|---|---|
| POST | `/api/login` | Valida PIN y setea cookie |
| POST | `/api/logout` | Borra cookie |
| GET/POST | `/api/barberos` | Lista / crea barbero |
| PATCH | `/api/barberos/[id]` | Edita/activa barbero |
| GET/POST | `/api/servicios` | Lista / crea servicio |
| PATCH | `/api/servicios/[id]` | Edita/activa servicio |
| GET/POST | `/api/promos` | Lista / crea promo |
| PATCH | `/api/promos/[id]` | Edita/activa promo |
| GET | `/api/promos/sugerida?fecha=` | Promo activa de la fecha |
| GET/POST | `/api/turnos` | Lista filtrada / crea turno |
| GET/PATCH | `/api/turnos/[id]` | Detalle / acciones (`editar`, `estado`, `descuento`) |

Respuestas de error: `{ "error": "mensaje" }` con status 400/401/404/409/500.

## 5. Sistema de diseño

### Paleta

| Token | Hex | Uso |
|---|---|---|
| ink | `#0F172A` | Fondo principal |
| surface | `#1E293B` | Cards, tabs inactivos, inputs |
| line | `#334155` | Bordes, dashed empty state |
| bone | `#F8FAFC` | Texto principal |
| muted | `#94A3B8` | Texto secundario |
| brand | `#DC2626` | Botón primario, acentos |
| brand-dark | `#B91C1C` | Hover/tap |
| tab-active | `#E2E8F0` | Tab activo |
| blue | `#1D4ED8` | Poste de barbero |

### Tipografía
- Display: **Barlow Condensed** 600–800, mayúsculas, tracking cerrado. Títulos: NAVAJA, 30 OCT, DÍA LIBRE.
- Texto: **Inter** 400–600. Secundarios en mayúsculas con `tracking-[0.25em]`.
- Números monetarios tabulares.

### Componentes
- **Poste de barbero**: franja superior de 8 px con `repeating-linear-gradient(135deg, #DC2626 0 12px, #F8FAFC 12px 24px, #1D4ED8 24px 36px, #F8FAFC 36px 48px)`.
- **Botón primario**: rojo, `rounded-xl`, padding generoso, hover `brand-dark`, transición.
- **Botón secundario**: surface + borde line.
- **Tab activo**: fondo `#E2E8F0`, texto ink; inactivo surface + texto muted.
- **Empty state**: borde dashed line, `rounded-2xl`, título display enorme.
- **Status chip**: fondo con 15% de opacidad del color semántico + texto claro.
- **Cards**: surface, borde line, `rounded-2xl`, sombra sutil.
- **Bottom nav**: fija, blur, 3 accesos (Agenda, Reportes, Config).
- **Inputs**: fondo ink/surface, borde line, focus ring brand, labels pequeñas y espaciadas.

### Semántica de estados
| Estado | Color |
|---|---|
| Pendiente | Ámbar `#F59E0B` |
| Confirmado | Azul `#3B82F6` |
| En atención | Violeta `#A78BFA` |
| Completado | Verde `#22C55E` |
| Cancelado | Rojo `#EF4444` |
| No asistió | Gris `#64748B` |

### Layout
- Contenedor máximo 768 px centrado, padding 16 px, bottom padding para nav.
- Mobile-first: una columna; reportes y caja usan grids de 2 columnas desde `sm`.
- Breakpoint principal `sm` (640 px). No se diseñan vistas desktop específicas: se aprovecha el ancho disponible.
