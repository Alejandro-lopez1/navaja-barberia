# NAVAJA — Plan de implementación

## Fase 0 — Documentación
- [x] `spec.md` con alcance, reglas y criterios de aceptación.
- [x] `design.md` con arquitectura, modelo de datos, API y sistema de diseño.
- [x] `tasks.md`.

## Fase 1 — Base del proyecto
- [x] `package.json` con Next.js 15, React 19, Tailwind 3, googleapis, zod, tsx.
- [x] TypeScript, Tailwind, PostCSS y `next.config`.
- [x] `globals.css` con tokens, componentes base y poste de barbero.
- [x] Layout raíz, fuentes Barlow Condensed + Inter, shell con bottom nav.

## Fase 2 — Persistencia
- [x] Definición de pestañas/encabezados y tipos.
- [x] `GoogleSheetsStore`: auth, auto-creación de pestañas, read/append/update.
- [x] `LocalJsonStore` para desarrollo sin credenciales.
- [x] Repositorio tipado `lib/db.ts` para barberos, servicios, promos, turnos y logs.
- [x] Scripts `init-sheets` y `seed`.

## Fase 3 — Dominio y API
- [x] Precio final, comisión, solapamientos, transiciones y formato de moneda/fechas.
- [x] Tests unitarios del dominio.
- [x] CRUD de configuración con validación zod.
- [x] Alta/listado de turnos.
- [x] Detalle/edición, cambios de estado y descuentos.
- [x] Endpoint de promo sugerida.
- [x] PIN opcional + guardas de API.

## Fase 4 — UI
- [x] Home Agenda/Caja con selector de fecha, filtros y empty state.
- [x] Formulario nuevo/editar con promo, descuento y precio en vivo.
- [x] Detalle con acciones de estado, pago, comisión y log.
- [x] Configuración con ABM lógico de las tres entidades.
- [x] Reportes con filtros y tablas.
- [x] Login PIN.

## Fase 5 — Entrega
- [x] `.env.example`, `.gitignore`.
- [x] README con Google Cloud, service account, spreadsheet, ejecución y deploy.
- [x] `npm run typecheck`, `npm test`, `npm run build`.
- [x] Smoke test del flujo completo en modo local.
