# NAVAJA — Turnos, caja y comisiones

App interna mobile-first para una barbería con varios barberos. Registra turnos, aplica descuentos, guarda el método de pago elegido (sin procesar pagos), calcula comisiones y persiste todo en **Google Sheets**.

![stack](https://img.shields.io/badge/Next.js-15-black) ![stack](https://img.shields.io/badge/React-19-61dafb) ![stack](https://img.shields.io/badge/Tailwind-3-38bdf8) ![stack](https://img.shields.io/badge/Google%20Sheets-API%20v4-34a853)

## Contenido

- [Demo local en 2 minutos](#demo-local-en-2-minutos)
- [Configuración de Google Cloud](#configuración-de-google-cloud)
- [Variables de entorno](#variables-de-entorno)
- [Scripts](#scripts)
- [Ejecución](#ejecución)
- [Deploy](#deploy)
- [Cómo funciona](#cómo-funciona)
- [API](#api)
- [Tests](#tests)
- [PIN opcional](#pin-opcional)
- [Troubleshooting](#troubleshooting)

## Demo local en 2 minutos

El proyecto incluye un modo local que imita las pestañas de la Sheet en `.data/db.json`, para desarrollar sin credenciales.

```bash
npm install
cp .env.example .env.local   # Windows: copy .env.example .env.local
# En .env.local:
# SHEETS_MOCK=true
# APP_PIN= (vacío para desarrollo)
npm run init-sheets
npm run seed
npm run dev
```

Abrí http://localhost:3000. El seed crea 3 barberos, 5 servicios, una promo del día y 3 turnos de ejemplo.

> El modo local **no debe usarse en producción**. Para producción usá Google Sheets real.

## Configuración de Google Cloud

### 1. Crear el proyecto y habilitar la API

1. Entrá a [Google Cloud Console](https://console.cloud.google.com/).
2. Creá un proyecto (o elegí uno existente).
3. En **APIs & Services → Library**, buscá **Google Sheets API** y presioná **Enable**.

### 2. Crear la service account

1. **IAM & Admin → Service Accounts → Create service account**.
2. Nombre sugerido: `navaja-sheets`.
3. No hace falta asignar roles de proyecto; el acceso se otorga compartiendo la Sheet.
4. Entrá a la service account → **Keys → Add key → Create new key → JSON**.
5. Descargá el JSON. Guardalo fuera del repo o en una ruta ignorada por git.

### 3. Crear y compartir la planilla

1. Creá una Google Sheet vacía en tu Drive.
2. Copiá el **spreadsheet ID** desde la URL:
   `https://docs.google.com/spreadsheets/d/`**`ESTE_ES_EL_ID`**`/edit`
3. Compartí la planilla con el email de la service account (campo `client_email` del JSON) con permiso **Editor**.

### 4. Cargar credenciales

Opción A — variables separadas:

```env
GOOGLE_SPREADSHEET_ID=1abc...
GOOGLE_SERVICE_ACCOUNT_EMAIL=navaja-sheets@mi-proyecto.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n"
```

Opción B — ruta al JSON:

```env
GOOGLE_SPREADSHEET_ID=1abc...
GOOGLE_APPLICATION_CREDENTIALS=./service-account.json
```

### 5. Inicializar pestañas

```bash
npm run init-sheets
```

Crea si no existen:

- `Config_Barberos`
- `Config_Servicios`
- `Config_Promos`
- `Turnos`
- `Log_Cambios`

y escribe la fila de encabezados. **No reordenes ni renombres las columnas**: el mapeo es por posición.

### 6. Datos demo (opcional)

```bash
npm run seed
```

Solo agrega datos si las pestañas de configuración están vacías y no hay turnos para hoy.

## Variables de entorno

Copiá `.env.example` a `.env.local` (Next.js) y completá:

| Variable | Requerida | Descripción |
|---|---|---|
| `GOOGLE_SPREADSHEET_ID` | Sí (Sheets real) | ID de la planilla |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Sí (si no usás JSON) | `client_email` de la service account |
| `GOOGLE_PRIVATE_KEY` | Sí (si no usás JSON) | `private_key`; podés usar `\n` escapados |
| `GOOGLE_APPLICATION_CREDENTIALS` | Alternativa | Ruta al JSON de credenciales |
| `APP_PIN` | No | Si está seteado, protege la app con PIN |
| `AUTH_SECRET` | Recomendada con PIN | Secreto largo para firmar la cookie |
| `ADMIN_NAME` | No | Usuario que queda en el log (default `Admin`) |
| `CURRENCY` | No | Moneda de formato (default `ARS`) |
| `NEXT_PUBLIC_CURRENCY` | No | Igual que `CURRENCY`, también en el navegador |
| `APP_TIMEZONE` | No | Zona horaria (default `America/Argentina/Buenos_Aires`) |
| `NEXT_PUBLIC_TIMEZONE` | No | Igual que `APP_TIMEZONE`, también en el navegador |
| `SHEETS_MOCK` | No | `true` = usa `.data/db.json` local |
| `LOCAL_DB_PATH` | No | Ruta alternativa del JSON local |

> Las credenciales de Google **solo** se leen en el servidor. No tienen prefijo `NEXT_PUBLIC_` y nunca llegan al navegador.

## Scripts

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run start` | Servidor de producción |
| `npm run typecheck` | TypeScript sin emitir |
| `npm test` | Tests unitarios del dominio |
| `npm run init-sheets` | Crea pestañas y encabezados |
| `npm run seed` | Carga datos demo si la base está vacía |

## Ejecución

```bash
npm install
npm run init-sheets
npm run dev
```

- Agenda: http://localhost:3000
- Reportes: http://localhost:3000/reportes
- Configuración: http://localhost:3000/configuracion

### Flujo de uso

1. En **Configuración**, cargá barberos, servicios y promociones.
2. En **Agenda**, elegí el día y tocá **+ Nuevo turno**.
3. Completá cliente, horario, barbero y servicio. Si hay promo del día se sugiere el descuento.
4. En el detalle, cambiá el estado. Para **Completar** es obligatorio elegir método de pago.
5. La comisión se calcula y persiste al completar.
6. Revisá **Caja** y **Reportes**.

## Deploy

### Vercel (recomendado)

1. Subí el repo a GitHub.
2. Importalo en Vercel.
3. Cargá las variables de entorno del proyecto (Production/Preview):
   - `GOOGLE_SPREADSHEET_ID`
   - `GOOGLE_SERVICE_ACCOUNT_EMAIL`
   - `GOOGLE_PRIVATE_KEY` (con `\n` escapados o saltos reales según el dashboard)
   - `APP_PIN`, `AUTH_SECRET`, `ADMIN_NAME`, `CURRENCY`
   - **No** definas `SHEETS_MOCK` en producción.
4. Deploy. No hace falta correr `init-sheets` en el deploy: la app crea las pestañas en el primer request si faltan.

### Otros hosts

Cualquier host que soporte Next.js 15 (Node 20+) sirve:

```bash
npm ci
npm run build
npm run start
```

Recordá que la service account necesita acceso de edición a la planilla desde el entorno de producción.

## Cómo funciona

```
UI (React) → API Routes (Next.js) → lib/db.ts → GoogleSheetsStore / LocalJsonStore
```

- **Lecturas**: las páginas server component leen directo del repositorio.
- **Escrituras**: los formularios llaman a `/api/*`, que valida con Zod y aplica reglas de negocio.
- **Filas**: alta con `values.append`; actualización completa de la fila por `ID_Turno`.
- **Log**: cada alta, edición, cambio de estado y descuento agrega una fila en `Log_Cambios`.
- **Reglas puras** en `lib/domain.ts` con tests.

### Reglas clave

- Solo `Completado` genera ingresos y comisión.
- `Completado` exige método de pago.
- `Cancelado` y `No asistió` no generan comisión.
- Revertir un `Completado` a `Confirmado` deja la comisión en 0.
- Descuento solo antes de cerrar el turno; `Precio_Final` nunca negativo.
- Sin solapamiento de turnos activos por barbero.
- Comisión fija (si > 0) tiene prioridad sobre el porcentaje.
- Barbero/servicio inactivo no se usa en turnos nuevos.

## API

| Método | Ruta | Uso |
|---|---|---|
| `POST` | `/api/login` | Validar PIN |
| `POST` | `/api/logout` | Cerrar sesión |
| `GET/POST` | `/api/barberos` | Listar / crear |
| `PATCH` | `/api/barberos/[id]` | Editar / activar |
| `GET/POST` | `/api/servicios` | Listar / crear |
| `PATCH` | `/api/servicios/[id]` | Editar / activar |
| `GET/POST` | `/api/promos` | Listar / crear |
| `PATCH` | `/api/promos/[id]` | Editar / activar |
| `GET` | `/api/promos/sugerida?fecha=YYYY-MM-DD` | Promo activa del día |
| `GET/POST` | `/api/turnos` | Filtrar / crear |
| `GET` | `/api/turnos/[id]` | Detalle + log |
| `PATCH` | `/api/turnos/[id]` | `editar`, `estado` o `descuento` |

Ejemplo de cambio de estado:

```json
PATCH /api/turnos/{id}
{
  "accion": "estado",
  "estado": "Completado",
  "metodoPago": "Efectivo"
}
```

## Tests

```bash
npm test
npm run typecheck
npm run build
```

Los tests cubren precio final, descuentos, comisión fija/porcentual, solapamientos y transiciones.

## PIN opcional

Si definís `APP_PIN`, toda la app y las APIs quedan protegidas:

```env
APP_PIN=1234
AUTH_SECRET=un-secreto-largo-y-aleatorio
```

La cookie es `HttpOnly`, firmada con HMAC-SHA256 y dura 30 días. Si `APP_PIN` está vacío, la app queda abierta (solo recomendado para local).

## Troubleshooting

**`The caller does not have permission` / 403**
La planilla no está compartida con el `client_email` de la service account, o no tiene permiso Editor.

**`invalid_grant` / error de private key**
Revisá que `GOOGLE_PRIVATE_KEY` conserve los saltos de línea (`\n`) y que corresponda a la misma service account.

**`Falta GOOGLE_SPREADSHEET_ID`**
Configurá el ID o usá `SHEETS_MOCK=true` para desarrollo.

**Los encabezados no coinciden**
No renombres ni reordenes columnas. Si la Sheet quedó corrupta, creá una nueva y corré `npm run init-sheets`.

**En Vercel funciona la UI pero fallan las escrituras**
Verificá que la service account tenga permiso Editor y que la API de Sheets esté habilitada en el proyecto correcto.

## Estructura

```
app/
  (app)/               Agenda, turnos, configuración, reportes
  api/                 Route handlers
  login/               PIN
components/            UI (Agenda, formularios, detalle, config)
lib/
  db.ts                Repositorio tipado
  domain.ts            Reglas puras + tests
  sheets.ts            Google Sheets API v4
  local-store.ts       Fallback local
  turnos-service.ts    Casos de uso de turnos
  reports.ts           Agregaciones
scripts/               init-sheets, seed
spec.md                Requisitos y criterios
design.md              Modelo de datos, flujos y sistema de diseño
tasks.md               Plan de implementación
```

## Limitaciones del MVP

- Un solo administrador.
- Sin cobros ni pasarelas de pago.
- Sin borrado físico: desactivar es suficiente.
- Sin transacciones distribuidas; pensado para bajo volumen y un operador.
- No se editan turnos cerrados, salvo revertir `Completado` a `Confirmado`.
