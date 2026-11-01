# NAVAJA — Especificación funcional (MVP)

App interna mobile-first para una barbería con varios barberos. Permite cargar y gestionar turnos, aplicar descuentos, registrar el método de pago elegido (sin cobrar), calcular comisiones y persistir todo en Google Sheets.

## 1. Objetivos

1. Registrar turnos en pocos pasos desde el celular.
2. Gestionar el ciclo de vida del turno por estados.
3. Calcular ingresos, descuentos y comisiones sin ambigüedad.
4. Usar Google Sheets como única fuente de verdad.
5. Mantener una UI Dark Mode con identidad visual de barbería.

## 2. Alcance

### Incluido
- Un administrador único. PIN opcional mediante variable de entorno.
- ABM lógico de barberos, servicios y promociones (activar/desactivar, editar).
- Agenda por día, filtros por barbero y estado.
- Alta y edición de turnos.
- Detalle con cambio de estado, método de pago, descuento, comisión y log.
- Descuento porcentual o monto fijo, con sugerencia automática desde promociones.
- Reportes básicos por rango de fechas.
- Persistencia en Google Sheets API v4 con service account.
- Script de inicialización de pestañas/encabezados y script de datos demo.
- Modo local de desarrollo (`SHEETS_MOCK=true`) con un JSON que imita las pestañas.

### Excluido
- Pagos, cobros, pasarelas, facturación, WhatsApp/SMS, multi-sucursal y autenticación avanzada.
- Borrado físico de configuraciones o turnos.
- Edición de turnos cerrados (Completado, Cancelado, No asistió), salvo revertir un Completado a Confirmado.

## 3. Reglas de negocio

### Turnos
- Estados: `Pendiente`, `Confirmado`, `En atención`, `Completado`, `Cancelado`, `No asistió`.
- Transiciones permitidas:
  - Pendiente → Confirmado, En atención, Completado, Cancelado, No asistió.
  - Confirmado → En atención, Completado, Cancelado, No asistió.
  - En atención → Completado, Cancelado, No asistió.
  - Completado → Confirmado (reversión).
  - Cancelado y No asistió son terminales.
- Completar exige `Metodo_Pago`.
- Solo `Completado` genera ingresos y comisión.
- Cancelado / No asistió siempre tienen comisión 0.
- Al revertir un Completado, la comisión se recalcula a 0 y se registra en el log.
- El descuento solo se aplica en estados Pendiente, Confirmado o En atención.
- No se permiten solapamientos de turnos activos (Pendiente, Confirmado, En atención) para el mismo barbero y fecha. Se usa la duración del servicio.
- `Precio_Final = max(0, Precio_Lista - descuento)`.
- Un barbero o servicio inactivo no puede usarse en turnos nuevos. En edición solo se tolera el valor que ya tenía el turno.

### Descuentos
- Tipos: `porcentaje`, `monto_fijo`, `ninguno`.
- Porcentaje se limita a 0–100. Monto fijo se limita a 0–Precio_Lista.
- Si hay una promo activa para la fecha, la UI la muestra y permite autocompletar el porcentaje sugerido.
- Sin promo, se permite descuento manual mostrando una advertencia.
- Todo descuento requiere motivo cuando su valor es mayor a 0.

### Comisiones
- Configuración por barbero: porcentaje (0–100) y monto fijo opcional.
- Si `Comision_Fija_Opcional > 0`, la comisión del turno es ese monto fijo.
- Si no, `Comision_Monto = Precio_Final × Comision_Porcentaje / 100`.
- Se redondea a 2 decimales y se guarda al completar el turno.
- `Comision_Porcentaje_Aplicado` registra el porcentaje vigente al completar.

### Configuración
- Barbero: nombre, activo, comisión %, comisión fija opcional, teléfono, notas.
- Servicio: nombre, precio, duración en minutos, activo.
- Promoción: fecha ISO, descripción, % sugerido, activa.
- No se elimina físicamente: se desactiva.

### Persistencia
- Pestañas: `Config_Barberos`, `Config_Servicios`, `Config_Promos`, `Turnos`, `Log_Cambios`.
- La app crea pestañas y encabezados si faltan.
- Altas: append de fila. Cambios: update de la fila completa ubicada por ID.
- Fechas `YYYY-MM-DD`, horas `HH:mm`, timestamps ISO 8601.
- Moneda ARS, formateada como `$ 12.345,00` en la UI.
- Credenciales solo en backend, vía variables de entorno.

## 4. Pantallas

1. **Agenda (home)**: header NAVAJA, selector de fecha, tabs Agenda/Caja, filtros, listado del día o estado vacío “DÍA LIBRE”.
2. **Caja**: resumen del día (ingresos, comisiones, descuentos, completados), métodos de pago y comisiones por barbero.
3. **Nuevo turno**: formulario con precio automático, promo sugerida, descuento manual, método de pago opcional y notas.
4. **Editar turno**: mismos campos, bloqueado para estados cerrados.
5. **Detalle**: datos, estado, método de pago, descuento, comisión, acciones de estado y log.
6. **Configuración**: alta/edición/activación de barberos, servicios y promociones.
7. **Reportes**: rango de fechas, comisiones por barbero, ingresos por día, métodos de pago y descuentos.
8. **Login PIN** (solo si `APP_PIN` está configurado).

## 5. Criterios de aceptación

- [ ] La home respeta la paleta, tipografía condensada, borde de poste de barbero, tabs y empty state indicados.
- [ ] Crear un turno agrega exactamente una fila nueva en `Turnos`.
- [ ] Editar un turno actualiza la fila correcta por `ID_Turno`.
- [ ] Cambiar estado actualiza la misma fila y agrega una fila en `Log_Cambios`.
- [ ] Completar sin método de pago devuelve error y no modifica el turno.
- [ ] Completar calcula `Precio_Final` y `Comision_Monto` y los persiste.
- [ ] Aplicar descuento recalcula `Precio_Final` y queda registrado en el turno/log.
- [ ] Cancelado y No asistió tienen comisión 0.
- [ ] Revertir Completado deja comisión 0 y registra el cambio.
- [ ] No se puede solapar un turno activo del mismo barbero.
- [ ] Se filtran turnos por fecha, barbero y estado.
- [ ] Reportes de ingresos/comisiones se calculan desde los datos de la Sheet.
- [ ] El frontend nunca recibe credenciales de Google.
- [ ] `npm run typecheck`, `npm test` y `npm run build` finalizan sin errores.

## 6. Decisiones de simplificación

- Un solo rol (`Admin`) y un solo usuario lógico. El PIN es opcional y protege toda la app.
- El modo local (`SHEETS_MOCK=true`) permite desarrollar sin Google Cloud; no debe usarse en producción.
- No hay borrado físico: desactivar es suficiente para el MVP.
- No hay bloqueo de fila/transacción distribuida; el uso es de un único administrador y el volumen es bajo.
- El estado inicial de un turno nuevo es `Pendiente`.
- La comisión fija tiene prioridad sobre el porcentaje cuando es mayor a 0.
- La duración del turno se toma del servicio configurado; si el servicio ya no existe, se asume 30 minutos.
- Un turno cerrado no se edita, salvo revertir el estado de Completado.
